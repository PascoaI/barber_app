import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { resolveRedirectByRole } from '@/lib/server/permissions-core';

const DEFAULT_QUICK_LOGIN_PASSWORD = process.env.LOGIN_HINT_DEFAULT_PASSWORD || '123456';

export async function POST(req: Request) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, message: sameOrigin.message }, { status: 403 });

    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ ok: false, message: csrf.message }, { status: 403 });

    const ip = getClientIp(req);
    const limit = await checkRateLimit({
      key: `auth:quick-login:ip:${ip}`,
      limit: 30,
      windowMs: 60 * 1000,
      blockMs: 3 * 60 * 1000
    });
    if (!limit.allowed) {
      return NextResponse.json({ ok: false, message: 'Muitas tentativas. Tente novamente em instantes.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, message: 'Informe o email da dica de login.' }, { status: 400 });
    }

    const service = createSupabaseServiceClient();
    const { data: profile, error: profileError } = await service
      .from('users')
      .select('id,role,email')
      .eq('email', email)
      .in('role', ['admin', 'barber', 'client'])
      .maybeSingle();
    if (profileError || !profile?.id) {
      return NextResponse.json({ ok: false, message: 'Usuario nao encontrado nas dicas de login.' }, { status: 404 });
    }

    const supabase = createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: DEFAULT_QUICK_LOGIN_PASSWORD
    });
    if (authError || !authData.user) {
      return NextResponse.json({ ok: false, message: 'Nao foi possivel autenticar automaticamente este usuario.' }, { status: 401 });
    }

    const redirectPath = resolveRedirectByRole({
      isSuperAdmin: false,
      role: String(profile.role || '').toLowerCase()
    });

    return NextResponse.json({ ok: true, redirectPath });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'quick_login_failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { isLocked, registerFailure, resetFailures } from '@/lib/server/auth-throttle';
import { resolveRedirectByRole } from '@/lib/server/permissions-core';

export async function POST(req: Request) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, message: sameOrigin.message }, { status: 403 });

    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ ok: false, message: csrf.message }, { status: 403 });

    const ip = getClientIp(req);
    const genericLimit = await checkRateLimit({
      key: `auth:login:ip:${ip}`,
      limit: 20,
      windowMs: 60 * 1000,
      blockMs: 5 * 60 * 1000
    });
    if (!genericLimit.allowed) {
      return NextResponse.json({ ok: false, message: 'Muitas tentativas. Tente novamente em instantes.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    if (!email || !password) {
      return NextResponse.json({ ok: false, message: 'Informe email e senha.' }, { status: 400 });
    }

    const identityKey = `${ip}:${email}`;
    const lockState = await isLocked(identityKey);
    if (lockState.locked) {
      return NextResponse.json({ ok: false, message: 'Conta temporariamente bloqueada por tentativas invalidas.' }, { status: 429 });
    }

    const supabase = createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !authData.user) {
      await registerFailure(identityKey, {
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000,
        lockMs: 15 * 60 * 1000
      });
      return NextResponse.json({ ok: false, message: 'Credenciais invalidas.' }, { status: 401 });
    }

    await resetFailures(identityKey);

    const [{ data: superAdmin }, { data: profile }] = await Promise.all([
      supabase.from('super_admins').select('id').eq('id', authData.user.id).maybeSingle(),
      supabase.from('users').select('role').eq('id', authData.user.id).maybeSingle()
    ]);

    const redirectPath = resolveRedirectByRole({
      isSuperAdmin: Boolean(superAdmin?.id),
      role: String(profile?.role || '').toLowerCase()
    });

    return NextResponse.json({ ok: true, redirectPath });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'login_failed' }, { status: 500 });
  }
}

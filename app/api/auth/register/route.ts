import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { validateStrongPassword } from '@/lib/server/security-core';

const DEFAULT_BARBERSHOP_ID = process.env.NEXT_PUBLIC_DEFAULT_BARBERSHOP_ID || '11111111-1111-1111-1111-111111111111';

export async function POST(req: Request) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, message: sameOrigin.message }, { status: 403 });

    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ ok: false, message: csrf.message }, { status: 403 });

    const ip = getClientIp(req);
    const genericLimit = checkRateLimit({
      key: `auth:register:ip:${ip}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
      blockMs: 15 * 60 * 1000
    });
    if (!genericLimit.allowed) {
      return NextResponse.json({ ok: false, message: 'Muitas tentativas de cadastro. Aguarde alguns minutos.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const termsAccepted = Boolean(body?.termsAccepted);
    const privacyAccepted = Boolean(body?.privacyAccepted);

    if (!name || !email || !password) {
      return NextResponse.json({ ok: false, message: 'Preencha nome, email e senha.' }, { status: 400 });
    }

    if (!termsAccepted || !privacyAccepted) {
      return NextResponse.json({ ok: false, message: 'Aceite os termos de uso e a politica de privacidade.' }, { status: 400 });
    }

    const strong = validateStrongPassword(password);
    if (!strong.ok) {
      return NextResponse.json({ ok: false, message: `Senha fraca: ${strong.reasons.join(', ')}` }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    if (signUpError) {
      return NextResponse.json({ ok: false, message: signUpError.message || 'Nao foi possivel criar conta.' }, { status: 400 });
    }

    const userId = signUpData.user?.id;
    if (userId) {
      const { error: profileError } = await supabase.from('users').upsert({
        id: userId,
        barbershop_id: DEFAULT_BARBERSHOP_ID,
        name,
        email,
        role: 'client'
      });
      if (profileError) {
        return NextResponse.json({ ok: false, message: profileError.message || 'Falha ao vincular perfil.' }, { status: 400 });
      }

      await supabase.from('consent_events').insert({
        user_id: userId,
        barbershop_id: DEFAULT_BARBERSHOP_ID,
        terms_version: 'v1',
        privacy_version: 'v1',
        accepted_terms: true,
        accepted_privacy: true,
        accepted_at: new Date().toISOString(),
        ip_address: ip,
        user_agent: req.headers.get('user-agent') || ''
      });
    }

    return NextResponse.json({
      ok: true,
      requiresEmailConfirmation: !signUpData.session
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'register_failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { isLocked, registerFailure, resetFailures } from '@/lib/server/auth-throttle';

export async function POST(req: Request) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) {
      return NextResponse.json({ ok: false, message: sameOrigin.message }, { status: 403 });
    }

    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) {
      return NextResponse.json({ ok: false, message: csrf.message }, { status: 403 });
    }

    const ip = getClientIp(req);
    const genericLimit = await checkRateLimit({
      key: `auth:superadmin:ip:${ip}`,
      limit: 10,
      windowMs: 60 * 1000,
      blockMs: 10 * 60 * 1000
    });
    if (!genericLimit.allowed) {
      return NextResponse.json({ ok: false, message: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 });
    }

    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ ok: false, message: 'Informe email e senha.' }, { status: 400 });
    }
    const identityKey = `superadmin:${ip}:${String(email).trim().toLowerCase()}`;
    if ((await isLocked(identityKey)).locked) {
      return NextResponse.json({ ok: false, message: 'Acesso temporariamente bloqueado por tentativas invalidas.' }, { status: 429 });
    }

    const supabase = createSupabaseServerClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: String(email).trim(),
      password: String(password)
    });

    if (signInError || !signInData.user) {
      await registerFailure(identityKey, {
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000,
        lockMs: 15 * 60 * 1000
      });
      return NextResponse.json({ ok: false, message: 'Credenciais invalidas.' }, { status: 401 });
    }

    const { data: superAdmin, error: superAdminError } = await supabase
      .from('super_admins')
      .select('id')
      .eq('id', signInData.user.id)
      .maybeSingle();

    if (superAdminError) throw superAdminError;
    if (!superAdmin?.id) {
      await registerFailure(identityKey, {
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000,
        lockMs: 15 * 60 * 1000
      });
      await supabase.auth.signOut();
      return NextResponse.json({ ok: false, message: 'Acesso exclusivo do administrador da plataforma.' }, { status: 403 });
    }

    await resetFailures(identityKey);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'superadmin_login_failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { assertSuperAdminSession, getServiceClientForPrivilegedOps } from '@/lib/auth/superadmin-api';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { validateStrongPassword } from '@/lib/server/security-core';

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ error: sameOrigin.message }, { status: 403 });
    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: 403 });

    const limit = await checkRateLimit({
      key: `api:superadmin:barbershop:reset-password:${getClientIp(req)}`,
      limit: 10,
      windowMs: 60 * 1000,
      blockMs: 10 * 60 * 1000
    });
    if (!limit.allowed) return NextResponse.json({ error: 'Muitas requisicoes. Aguarde.' }, { status: 429 });

    const check = await assertSuperAdminSession();
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status });

    const body = await req.json().catch(() => ({}));
    const password = String(body?.password || '').trim();
    if (!password) {
      return NextResponse.json({ error: 'Informe a nova senha.' }, { status: 400 });
    }
    const passwordCheck = validateStrongPassword(password);
    if (!passwordCheck.ok) {
      return NextResponse.json({ error: `Senha fraca: ${passwordCheck.reasons.join(', ')}` }, { status: 400 });
    }

    const service = getServiceClientForPrivilegedOps();
    const { data: adminUser, error: userError } = await service
      .from('users')
      .select('id,email')
      .eq('barbershop_id', params.id)
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    if (userError) throw userError;
    if (!adminUser?.id) return NextResponse.json({ error: 'Administrador da barbearia nao encontrado.' }, { status: 404 });

    const { error: authError } = await service.auth.admin.updateUserById(adminUser.id, { password });
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'superadmin_reset_password_failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { assertSuperAdminSession, getServiceClientForPrivilegedOps } from '@/lib/auth/superadmin-api';

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  try {
    const check = await assertSuperAdminSession();
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status });

    const body = await req.json().catch(() => ({}));
    const password = String(body?.password || '123456').trim() || '123456';

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

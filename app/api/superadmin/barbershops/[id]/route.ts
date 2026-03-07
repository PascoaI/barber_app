import { NextResponse } from 'next/server';
import { assertSuperAdminSession, getServiceClientForPrivilegedOps } from '@/lib/auth/superadmin-api';
import type { Barbershop } from '@/types/barbershop';

const ALLOWED_STATUS: Array<Barbershop['status']> = ['active', 'trial', 'suspended', 'disabled'];
const ALLOWED_PLAN: Array<Barbershop['plan']> = ['free', 'basic', 'pro', 'enterprise'];

function sanitizeText(value: unknown) {
  return String(value || '').trim();
}

function normalizeStatus(value: unknown, fallback: Barbershop['status']) {
  const normalized = sanitizeText(value).toLowerCase() as Barbershop['status'];
  return ALLOWED_STATUS.includes(normalized) ? normalized : fallback;
}

function normalizePlan(value: unknown, fallback: Barbershop['plan']) {
  const normalized = sanitizeText(value).toLowerCase() as Barbershop['plan'];
  return ALLOWED_PLAN.includes(normalized) ? normalized : fallback;
}

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  try {
    const check = await assertSuperAdminSession();
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status });

    const service = getServiceClientForPrivilegedOps();
    const { data, error } = await service
      .from('barbershops')
      .select('id,name,owner_name,email,phone,address,status,plan,plan_expires_at,created_at,updated_at')
      .eq('id', params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Barbearia nao encontrada.' }, { status: 404 });
    return NextResponse.json({ row: data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'superadmin_get_barbershop_failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const check = await assertSuperAdminSession();
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status });

    const service = getServiceClientForPrivilegedOps();
    const { data: current, error: currentError } = await service
      .from('barbershops')
      .select('id,name,owner_name,email,phone,address,status,plan,plan_expires_at')
      .eq('id', params.id)
      .maybeSingle();
    if (currentError) throw currentError;
    if (!current) return NextResponse.json({ error: 'Barbearia nao encontrada.' }, { status: 404 });

    const body = await req.json();
    const nextEmail = sanitizeText(body?.email || current.email).toLowerCase();
    const nextOwner = sanitizeText(body?.owner_name || current.owner_name);
    const password = sanitizeText(body?.password);

    const patch = {
      name: sanitizeText(body?.name || current.name),
      owner_name: nextOwner,
      email: nextEmail,
      phone: sanitizeText(body?.phone || current.phone),
      address: sanitizeText(body?.address ?? current.address) || null,
      status: normalizeStatus(body?.status, current.status),
      plan: normalizePlan(body?.plan, current.plan),
      plan_expires_at: body?.plan_expires_at || current.plan_expires_at || null,
      updated_at: new Date().toISOString()
    };

    const { data: updated, error: updateError } = await service
      .from('barbershops')
      .update(patch)
      .eq('id', params.id)
      .select('id,name,owner_name,email,phone,address,status,plan,plan_expires_at,created_at,updated_at')
      .single();
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

    const { data: adminUser } = await service
      .from('users')
      .select('id,email')
      .eq('barbershop_id', params.id)
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    if (adminUser?.id) {
      const authPatch: Record<string, unknown> = {
        email: nextEmail,
        user_metadata: { name: nextOwner }
      };
      if (password) authPatch.password = password;
      await service.auth.admin.updateUserById(adminUser.id, authPatch);
      await service
        .from('users')
        .update({
          email: nextEmail,
          name: nextOwner
        })
        .eq('id', adminUser.id);
    }

    return NextResponse.json({ ok: true, row: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'superadmin_update_barbershop_failed' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const check = await assertSuperAdminSession();
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status });

    const service = getServiceClientForPrivilegedOps();
    const { data: adminUser } = await service
      .from('users')
      .select('id')
      .eq('barbershop_id', params.id)
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    const { error } = await service.from('barbershops').delete().eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    if (adminUser?.id) {
      await service.auth.admin.deleteUser(adminUser.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'superadmin_delete_barbershop_failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { assertSuperAdminSession, getServiceClientForPrivilegedOps } from '@/lib/auth/superadmin-api';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import type { Barbershop } from '@/types/barbershop';

const ALLOWED_STATUS: Array<Barbershop['status']> = ['active', 'trial', 'suspended', 'disabled'];
const ALLOWED_PLAN: Array<Barbershop['plan']> = ['free', 'basic', 'pro', 'enterprise'];

function sanitizeText(value: unknown) {
  return String(value || '').trim();
}

function normalizeStatus(value: unknown): Barbershop['status'] {
  const normalized = sanitizeText(value).toLowerCase() as Barbershop['status'];
  return ALLOWED_STATUS.includes(normalized) ? normalized : 'active';
}

function normalizePlan(value: unknown): Barbershop['plan'] {
  const normalized = sanitizeText(value).toLowerCase() as Barbershop['plan'];
  return ALLOWED_PLAN.includes(normalized) ? normalized : 'basic';
}

export async function GET() {
  try {
    const check = await assertSuperAdminSession();
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status });

    const service = getServiceClientForPrivilegedOps();
    const { data, error } = await service
      .from('barbershops')
      .select('id,name,owner_name,email,phone,address,status,plan,plan_expires_at,created_at,updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ rows: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'superadmin_list_barbershops_failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ error: sameOrigin.message }, { status: 403 });

    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: 403 });

    const ip = getClientIp(req);
    const limit = await checkRateLimit({
      key: `api:superadmin:barbershops:create:${ip}`,
      limit: 20,
      windowMs: 60 * 1000,
      blockMs: 5 * 60 * 1000
    });
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Muitas requisicoes. Aguarde um pouco.' }, { status: 429 });
    }

    const check = await assertSuperAdminSession();
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status });

    const body = await req.json();
    const name = sanitizeText(body?.name);
    const ownerName = sanitizeText(body?.owner_name);
    const email = sanitizeText(body?.email).toLowerCase();
    const phone = sanitizeText(body?.phone);
    const password = sanitizeText(body?.password) || '123456';
    const address = sanitizeText(body?.address) || null;
    const status = normalizeStatus(body?.status);
    const plan = normalizePlan(body?.plan);
    const planExpiresAt = body?.plan_expires_at ? String(body.plan_expires_at) : null;

    if (!name || !ownerName || !email || !phone) {
      return NextResponse.json({ error: 'Campos obrigatorios: nome, responsavel, email e telefone.' }, { status: 400 });
    }

    const service = getServiceClientForPrivilegedOps();
    const { data: created, error: insertError } = await service
      .from('barbershops')
      .insert({
        name,
        owner_name: ownerName,
        email,
        phone,
        address,
        status,
        plan,
        plan_expires_at: planExpiresAt
      })
      .select('id,name,owner_name,email,phone,address,status,plan,plan_expires_at,created_at,updated_at')
      .single();

    if (insertError || !created?.id) {
      return NextResponse.json({ error: insertError?.message || 'Falha ao criar barbearia.' }, { status: 400 });
    }

    const { data: authCreated, error: authError } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError || !authCreated.user?.id) {
      await service.from('barbershops').delete().eq('id', created.id);
      return NextResponse.json({ error: authError?.message || 'Falha ao criar usuario admin da barbearia.' }, { status: 400 });
    }

    const { error: userError } = await service.from('users').upsert({
      id: authCreated.user.id,
      barbershop_id: created.id,
      name: ownerName,
      email,
      role: 'admin'
    });

    if (userError) {
      await service.auth.admin.deleteUser(authCreated.user.id);
      await service.from('barbershops').delete().eq('id', created.id);
      return NextResponse.json({ error: userError.message || 'Falha ao vincular admin na barbearia.' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, row: created });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'superadmin_create_barbershop_failed' }, { status: 500 });
  }
}

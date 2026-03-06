import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';
import { validateAppointmentCreation } from '@/lib/server/appointment-core';
import { getOptionalSessionProfile } from '@/lib/server/request-auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const session = await getOptionalSessionProfile(req);
    const { idempotency_key, barber_id } = body || {};

    const tenant_id = session?.tenant_id ?? body?.tenant_id;
    const unit_id = session?.unit_id ?? body?.unit_id;
    const client_id = session?.role === 'client' ? session.id : (body?.client_id ?? session?.id);

    if (!idempotency_key || !tenant_id || !unit_id || !barber_id) {
      return NextResponse.json({ error: 'missing idempotency_key/tenant_id/unit_id/barber_id' }, { status: 400 });
    }

    if (session?.role === 'client' && body?.client_id && String(body.client_id) !== String(session.id)) {
      return NextResponse.json({ error: 'client_scope_mismatch' }, { status: 403 });
    }

    const scopedBody = {
      ...body,
      tenant_id,
      unit_id,
      client_id
    };

    const tenant = encodeURIComponent(String(tenant_id));
    const unit = encodeURIComponent(String(unit_id));

    const existingByIdempotency = await supabaseAdmin.select(
      'appointments',
      `select=*&tenant_id=eq.${tenant}&unit_id=eq.${unit}&idempotency_key=eq.${encodeURIComponent(String(idempotency_key))}&limit=1`
    ) as any[];

    if (existingByIdempotency?.[0]) {
      return NextResponse.json({ ok: true, duplicated: true, appointment: existingByIdempotency[0] });
    }

    const [existingAppointments, blockedSlots] = await Promise.all([
      supabaseAdmin.select(
        'appointments',
        `select=id,start_datetime,end_datetime,status&tenant_id=eq.${tenant}&unit_id=eq.${unit}&barber_id=eq.${encodeURIComponent(String(barber_id))}&status=in.(awaiting_payment,pending,confirmed)`
      ) as Promise<any[]>,
      supabaseAdmin.select(
        'blocked_slots',
        `select=start_datetime,end_datetime&tenant_id=eq.${tenant}&unit_id=eq.${unit}&barber_id=eq.${encodeURIComponent(String(barber_id))}`
      ) as Promise<any[]>
    ]);

    let blockedUntil: string | null = null;
    let subscriptionStatus: string | null = null;

    if (client_id) {
      const clientRows = await supabaseAdmin.select(
        'users',
        `select=blocked_until&id=eq.${encodeURIComponent(String(client_id))}&tenant_id=eq.${tenant}&unit_id=eq.${unit}&limit=1`
      ) as any[];
      blockedUntil = clientRows?.[0]?.blocked_until || null;

      const subscriptions = await supabaseAdmin.select(
        'subscriptions',
        `select=status&user_id=eq.${encodeURIComponent(String(client_id))}&tenant_id=eq.${tenant}&unit_id=eq.${unit}&order=created_at.desc&limit=1`
      ) as any[];
      subscriptionStatus = subscriptions?.[0]?.status || null;
    }

    const validation = validateAppointmentCreation({
      payload: scopedBody,
      existingAppointments: existingAppointments || [],
      blockedSlots: blockedSlots || [],
      blockedUntil,
      subscriptionStatus
    });

    if (!validation.ok) {
      return NextResponse.json({ ok: false, reason: validation.reason }, { status: 409 });
    }

    const created = await supabaseAdmin.insert('appointments', validation.normalized || scopedBody, 'representation') as any[];
    return NextResponse.json({ ok: true, duplicated: false, appointment: created?.[0] || null });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'create_failed' }, { status: 500 });
  }
}

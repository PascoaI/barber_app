import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';
import { validateAppointmentCreation } from '@/lib/server/appointment-core';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { idempotency_key, tenant_id, unit_id, barber_id, client_id } = body || {};
    if (!idempotency_key || !tenant_id || !unit_id || !barber_id) {
      return NextResponse.json({ error: 'missing idempotency_key/tenant_id/unit_id/barber_id' }, { status: 400 });
    }

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
      payload: body,
      existingAppointments: existingAppointments || [],
      blockedSlots: blockedSlots || [],
      blockedUntil,
      subscriptionStatus
    });

    if (!validation.ok) {
      return NextResponse.json({ ok: false, reason: validation.reason }, { status: 409 });
    }

    const created = await supabaseAdmin.insert('appointments', validation.normalized || body, 'representation') as any[];
    return NextResponse.json({ ok: true, duplicated: false, appointment: created?.[0] || null });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'create_failed' }, { status: 500 });
  }
}

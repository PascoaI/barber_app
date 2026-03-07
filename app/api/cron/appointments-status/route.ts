import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';
import { deriveOverdueStatus } from '@/lib/appointments-policy';
import { isValidStatusTransition } from '@/lib/server/appointment-core';

function isAuthorized(req: Request) {
  const expected = process.env.CRON_SECRET || '';
  if (!expected) return false;
  return (req.headers.get('x-cron-secret') || '') === expected;
}

export async function POST(req: Request) {
  try {
    if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized cron call.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const barbershopId = body.barbershop_id || body.tenant_id || body.unit_id;
    if (!barbershopId) return NextResponse.json({ error: 'barbershop_id is required' }, { status: 400 });

    const nowIso = new Date().toISOString();
    const barbershop = encodeURIComponent(String(barbershopId));

    const appointments = await supabaseAdmin.select(
      'appointments',
      `select=id,client_id,status,start_datetime,barbershop_id&barbershop_id=eq.${barbershop}&status=in.(pending,confirmed)&start_datetime=lt.${encodeURIComponent(nowIso)}`
    ) as any[];

    let completed = 0;
    let noShows = 0;
    let skipped = 0;
    for (const apt of appointments || []) {
      const nextStatus = deriveOverdueStatus({ currentStatus: apt.status, startDatetime: apt.start_datetime, wasPaid: apt.status === 'confirmed' });
      if (!isValidStatusTransition(apt.status, nextStatus)) {
        skipped += 1;
        continue;
      }

      await supabaseAdmin.update(
        'appointments',
        `id=eq.${encodeURIComponent(String(apt.id))}&barbershop_id=eq.${barbershop}&status=eq.${encodeURIComponent(String(apt.status))}`,
        { status: nextStatus, updated_at: nowIso, updated_by: 'cron_auto_status' }
      );
      if (nextStatus === 'completed') completed += 1;
      if (nextStatus === 'no_show') noShows += 1;
    }

    const noShowRows = await supabaseAdmin.select(
      'appointments',
      `select=client_id,status&barbershop_id=eq.${barbershop}&status=eq.no_show`
    ) as any[];

    const grouped: Record<string, number> = {};
    (noShowRows || []).forEach((r) => { grouped[String(r.client_id)] = (grouped[String(r.client_id)] || 0) + 1; });

    for (const [clientId, total] of Object.entries(grouped)) {
      if (total < 3) continue;
      const blockedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin.update('users', `id=eq.${encodeURIComponent(clientId)}&barbershop_id=eq.${barbershop}`, { blocked_until: blockedUntil, updated_at: nowIso });
    }

    return NextResponse.json({ ok: true, updated: appointments.length, completed, noShows, skipped });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Cron failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';

const STATUS_BY_EVENT: Record<string, string> = {
  'checkout.session.completed': 'active',
  'invoice.payment_failed': 'past_due',
  'customer.subscription.deleted': 'canceled',
  'customer.subscription.paused': 'paused'
};

export async function POST(req: Request) {
  try {
    const event = await req.json();
    const eventType = event?.type || event?.simulate_event;
    const payload = event?.data?.object || event;
    const status = STATUS_BY_EVENT[eventType];
    if (!status) return NextResponse.json({ ignored: true });

    const { user_id, tenant_id, unit_id, plan_id } = payload || {};
    if (!user_id || !tenant_id || !unit_id) {
      return NextResponse.json({ error: 'Missing tenant context in webhook payload' }, { status: 400 });
    }

    const existing = await supabaseAdmin.select('subscriptions', `select=id,remaining_sessions&user_id=eq.${encodeURIComponent(String(user_id))}&tenant_id=eq.${encodeURIComponent(String(tenant_id))}&unit_id=eq.${encodeURIComponent(String(unit_id))}&order=created_at.desc&limit=1`);
    const row = (existing as any[])?.[0];

    if (row?.id) {
      await supabaseAdmin.update('subscriptions', `id=eq.${encodeURIComponent(String(row.id))}`, { status, updated_at: new Date().toISOString() });
    } else {
      await supabaseAdmin.insert('subscriptions', {
        user_id,
        tenant_id,
        unit_id,
        plan_id: plan_id || null,
        status,
        remaining_sessions: status === 'active' ? 4 : 0,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }, 'minimal');
    }

    return NextResponse.json({ ok: true, status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Webhook error' }, { status: 500 });
  }
}

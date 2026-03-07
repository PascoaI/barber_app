import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, tenant_id, unit_id, plan_id, simulate = 'approved' } = body || {};
    if (!user_id || !tenant_id || !unit_id || !plan_id) {
      return NextResponse.json({ error: 'Missing user_id/tenant_id/unit_id/plan_id' }, { status: 400 });
    }

    const sessionId = `cs_test_${Date.now()}`;
    await supabaseAdmin.insert('subscription_events', {
      user_id,
      tenant_id,
      unit_id,
      plan_id,
      stripe_session_id: sessionId,
      simulation_status: simulate,
      created_at: new Date().toISOString()
    }, 'minimal');

    return NextResponse.json({
      id: sessionId,
      mode: 'test',
      simulate,
      checkout_url: `/client/subscriptions?checkout_session_id=${sessionId}&simulate=${simulate}`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create checkout session' }, { status: 500 });
  }
}

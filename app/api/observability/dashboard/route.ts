import { NextResponse } from 'next/server';
import { getRouteAppSession } from '@/lib/auth/route-session';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const DAY_MS = 24 * 60 * 60 * 1000;

function getWindowIso(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function getDayStartIso() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  const idx = Math.min(ordered.length - 1, Math.max(0, Math.ceil((p / 100) * ordered.length) - 1));
  return Number(ordered[idx] || 0);
}

export async function GET() {
  try {
    const session = await getRouteAppSession();
    if (!session || !['admin', 'super_admin'].includes(session.role)) {
      return NextResponse.json({ ok: false, message: 'Nao autorizado.' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    const last24h = getWindowIso(24);
    const dayStart = getDayStartIso();
    const scopeBarbershopId = session.role === 'super_admin' ? null : session.barbershopId;

    let errorsQuery = supabase
      .from('operational_metrics')
      .select('id', { count: 'exact', head: true })
      .eq('metric_type', 'api_error')
      .gte('occurred_at', last24h);
    if (scopeBarbershopId) errorsQuery = errorsQuery.eq('barbershop_id', scopeBarbershopId);

    let latencyQuery = supabase
      .from('operational_metrics')
      .select('value')
      .eq('metric_type', 'api_latency')
      .gte('occurred_at', last24h);
    if (scopeBarbershopId) latencyQuery = latencyQuery.eq('barbershop_id', scopeBarbershopId);

    let appointmentsQuery = supabase
      .from('appointments')
      .select('status, appointment_date, created_at')
      .gte('created_at', dayStart);
    if (scopeBarbershopId) appointmentsQuery = appointmentsQuery.eq('barbershop_id', scopeBarbershopId);

    let paymentFailuresQuery = supabase
      .from('billing_subscriptions')
      .select('id,status,last_payment_failed_at')
      .gte('last_payment_failed_at', last24h);
    if (scopeBarbershopId) paymentFailuresQuery = paymentFailuresQuery.eq('barbershop_id', scopeBarbershopId);

    const [errorsRes, latencyRes, appointmentsRes, paymentFailuresRes] = await Promise.all([
      errorsQuery,
      latencyQuery,
      appointmentsQuery,
      paymentFailuresQuery
    ]);

    if (errorsRes.error) throw errorsRes.error;
    if (latencyRes.error) throw latencyRes.error;
    if (appointmentsRes.error) throw appointmentsRes.error;
    if (paymentFailuresRes.error) throw paymentFailuresRes.error;

    const latencyValues = (latencyRes.data || [])
      .map((row: any) => Number(row.value || 0))
      .filter((value) => Number.isFinite(value) && value >= 0);

    const appointments = (appointmentsRes.data || []) as Array<{ status: string | null }>;
    const convertibleStatuses = new Set(['pending', 'confirmed', 'scheduled', 'awaiting_payment', 'in_progress', 'completed', 'cancelled', 'canceled', 'no_show']);
    const conversionBase = appointments.filter((row) => convertibleStatuses.has(String(row.status || '').toLowerCase())).length;
    const completedCount = appointments.filter((row) => String(row.status || '').toLowerCase() === 'completed').length;
    const conversionRate = conversionBase > 0 ? (completedCount / conversionBase) * 100 : 0;

    const failedSubscriptions = (paymentFailuresRes.data || []).filter((row: any) =>
      ['past_due', 'unpaid', 'incomplete', 'incomplete_expired'].includes(String(row.status || '').toLowerCase())
    );

    return NextResponse.json({
      ok: true,
      window: {
        since_24h: last24h,
        since_today: dayStart,
        updated_at: new Date().toISOString(),
        window_ms: DAY_MS
      },
      metrics: {
        error_count_24h: Number(errorsRes.count || 0),
        latency_p95_ms_24h: percentile(latencyValues, 95),
        booking_conversion_rate_today: Number(conversionRate.toFixed(2)),
        booking_completed_today: completedCount,
        booking_total_considered_today: conversionBase,
        payment_failures_24h: failedSubscriptions.length
      }
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'dashboard_metrics_failed' }, { status: 500 });
  }
}


import { createSupabaseServiceClient } from '@/lib/supabase/server';

type MetricType = 'api_error' | 'api_latency' | 'booking_conversion' | 'payment_failure' | 'custom';

type MetricParams = {
  metricType: MetricType;
  metricName: string;
  value: number;
  barbershopId?: string | null;
  tags?: Record<string, unknown>;
};

type MetricTags = Record<string, unknown>;

function getServiceClientOrNull() {
  try {
    return createSupabaseServiceClient();
  } catch {
    return null;
  }
}

export async function recordOperationalMetric(params: MetricParams) {
  const service = getServiceClientOrNull();
  if (!service) return;

  const { metricType, metricName, value, barbershopId, tags } = params;
  await service.from('operational_metrics').insert({
    metric_type: metricType,
    metric_name: metricName,
    value,
    barbershop_id: barbershopId || null,
    tags: tags || {}
  });
}

export async function recordApiErrorMetric(params: {
  metricName?: string;
  barbershopId?: string | null;
  tags?: MetricTags;
}) {
  return recordOperationalMetric({
    metricType: 'api_error',
    metricName: params.metricName || 'api.error',
    value: 1,
    barbershopId: params.barbershopId || null,
    tags: params.tags || {}
  });
}

export async function recordApiLatencyMetric(params: {
  metricName: string;
  durationMs: number;
  barbershopId?: string | null;
  tags?: MetricTags;
}) {
  return recordOperationalMetric({
    metricType: 'api_latency',
    metricName: params.metricName,
    value: Number(params.durationMs || 0),
    barbershopId: params.barbershopId || null,
    tags: params.tags || {}
  });
}

export async function recordBusinessMetric(params: {
  metricType?: Exclude<MetricType, 'api_error' | 'api_latency'>;
  metricName: string;
  value?: number;
  barbershopId?: string | null;
  tags?: MetricTags;
}) {
  return recordOperationalMetric({
    metricType: params.metricType || 'custom',
    metricName: params.metricName,
    value: Number(params.value ?? 1),
    barbershopId: params.barbershopId || null,
    tags: params.tags || {}
  });
}


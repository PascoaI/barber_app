import { context as otelContext, trace } from '@opentelemetry/api';

function randomTraceId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

type TraceEndContext = {
  status?: 'ok' | 'error';
  barbershopId?: string | null;
  tags?: Record<string, string | number | boolean | null | undefined>;
};

export function startTrace(name: string) {
  const tracer = trace.getTracer('barberpro-next', '1.0.0');
  const span = tracer.startSpan(name, undefined, otelContext.active());
  const spanContext = span.spanContext();
  const traceId = spanContext.traceId || randomTraceId();
  const startedAt = Date.now();

  return {
    traceId,
    name,
    end(endContext?: TraceEndContext) {
      const durationMs = Date.now() - startedAt;
      const normalizedTags = endContext?.tags || {};
      span.setAttribute('trace.name', name);
      span.setAttribute('trace.id', traceId);
      span.setAttribute('trace.duration_ms', durationMs);
      span.setAttribute('trace.status', endContext?.status || 'ok');
      if (endContext?.barbershopId) {
        span.setAttribute('tenant.barbershop_id', endContext.barbershopId);
      }
      for (const [key, value] of Object.entries(normalizedTags)) {
        if (value === null || value === undefined) continue;
        span.setAttribute(`trace.tag.${key}`, value as string | number | boolean);
      }
      span.end();

      return {
        traceId,
        name,
        durationMs,
        status: endContext?.status || 'ok',
        barbershopId: endContext?.barbershopId || null
      };
    }
  };
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

function isServerRuntime() {
  return typeof window === 'undefined';
}

function fireAndForget(promise: Promise<unknown>) {
  promise.catch(() => {});
}

function toSafeObject(context?: LogContext) {
  if (!context || typeof context !== 'object') return {};
  return context;
}

function captureWithSentry(level: LogLevel, message: string, context?: LogContext) {
  if (!isServerRuntime()) return;
  if (!['warn', 'error'].includes(level)) return;

  fireAndForget((async () => {
    const sentry = await import('@/lib/observability/sentry');
    if (level === 'error') {
      sentry.captureSentryException(new Error(message), toSafeObject(context));
      return;
    }
    sentry.captureSentryMessage(message, 'warning', toSafeObject(context));
  })());
}

function captureOperationalMetric(level: LogLevel, message: string, context?: LogContext) {
  if (!isServerRuntime()) return;
  const safeContext = toSafeObject(context);

  if (level === 'error') {
    fireAndForget((async () => {
      const metrics = await import('@/lib/observability/metrics');
      await metrics.recordApiErrorMetric({
        metricName: 'api.error',
        barbershopId: safeContext.barbershopId as string | null | undefined,
        tags: {
          message,
          traceId: safeContext.traceId
        }
      });
    })());
  }

  if (typeof safeContext.durationMs === 'number') {
    fireAndForget((async () => {
      const metrics = await import('@/lib/observability/metrics');
      await metrics.recordApiLatencyMetric({
        metricName: String(safeContext.name || message || 'api.request'),
        durationMs: Number(safeContext.durationMs),
        barbershopId: safeContext.barbershopId as string | null | undefined,
        tags: {
          traceId: safeContext.traceId
        }
      });
    })());
  }
}

function emit(level: LogLevel, message: string, context?: LogContext) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context || {})
  };

  captureWithSentry(level, message, context);
  captureOperationalMetric(level, message, context);

  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
    return;
  }
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  console.log(line);
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit('debug', message, context),
  info: (message: string, context?: LogContext) => emit('info', message, context),
  warn: (message: string, context?: LogContext) => emit('warn', message, context),
  error: (message: string, context?: LogContext) => emit('error', message, context)
};

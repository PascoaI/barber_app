import * as Sentry from '@sentry/nextjs';

let initialized = false;

function isEnabled() {
  return Boolean(process.env.SENTRY_DSN);
}

function ensureSentryInit() {
  if (initialized || !isEnabled()) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.APP_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.2'),
    replaysOnErrorSampleRate: 0,
    replaysSessionSampleRate: 0
  });
  initialized = true;
}

function withExtraContext(context: Record<string, unknown> | undefined, run: () => void) {
  if (!context || !Object.keys(context).length) {
    run();
    return;
  }

  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(context)) {
      scope.setExtra(key, value as any);
    }
    run();
  });
}

export function captureSentryException(error: unknown, context?: Record<string, unknown>) {
  ensureSentryInit();
  if (!isEnabled()) return;
  withExtraContext(context, () => {
    Sentry.captureException(error);
  });
}

export function captureSentryMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
) {
  ensureSentryInit();
  if (!isEnabled()) return;
  withExtraContext(context, () => {
    Sentry.captureMessage(message, level);
  });
}


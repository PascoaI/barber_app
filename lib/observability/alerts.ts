import { logger } from '@/lib/observability/logger';

export async function sendOperationalAlert(event: string, details: Record<string, unknown>) {
  const webhook = process.env.OPS_ALERT_WEBHOOK_URL;
  if (!webhook) {
    logger.warn('Operational alert skipped (missing OPS_ALERT_WEBHOOK_URL).', { event, ...details });
    return;
  }

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        details,
        at: new Date().toISOString()
      })
    });
  } catch (error: any) {
    logger.error('Failed to send operational alert.', {
      event,
      error: error?.message || 'unknown_error'
    });
  }
}

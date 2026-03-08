const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CRON_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'SENTRY_DSN',
  'OTEL_EXPORTER_OTLP_ENDPOINT',
  'OPS_ALERT_WEBHOOK_URL'
];

const OPTIONAL_BUT_RECOMMENDED = [
  'STRIPE_PRICE_BASIC',
  'STRIPE_PRICE_PRO',
  'STRIPE_PRICE_ENTERPRISE',
  'BILLING_GRACE_DAYS',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'APP_BASE_DOMAIN',
  'DEFAULT_TENANT_SLUG'
];

function check(keys) {
  return keys.filter((key) => !process.env[key] || String(process.env[key]).trim() === '');
}

const missingRequired = check(REQUIRED);
const missingRecommended = check(OPTIONAL_BUT_RECOMMENDED);

if (missingRequired.length) {
  console.error('[env] Missing required vars:');
  missingRequired.forEach((key) => console.error(` - ${key}`));
  if (missingRecommended.length) {
    console.error('\n[env] Missing recommended vars:');
    missingRecommended.forEach((key) => console.error(` - ${key}`));
  }
  process.exit(1);
}

console.log('[env] Required vars: OK');
if (missingRecommended.length) {
  console.log('[env] Recommended vars missing (non-blocking):');
  missingRecommended.forEach((key) => console.log(` - ${key}`));
} else {
  console.log('[env] Recommended vars: OK');
}

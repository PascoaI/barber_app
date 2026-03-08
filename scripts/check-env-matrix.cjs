const targetEnv = String(process.env.TARGET_ENV || process.argv[2] || 'dev').toLowerCase();

const COMMON = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_APP_URL'];
const SECURITY = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'CRON_SECRET'];
const BILLING = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_BASIC', 'STRIPE_PRICE_PRO', 'STRIPE_PRICE_ENTERPRISE'];
const SERVER = ['SUPABASE_SERVICE_ROLE_KEY'];
const OBSERVABILITY = ['SENTRY_DSN'];

const MATRIX = {
  dev: {
    required: [...COMMON],
    recommended: [...SERVER, ...SECURITY, ...BILLING, ...OBSERVABILITY, 'OTEL_EXPORTER_OTLP_ENDPOINT', 'OPS_ALERT_WEBHOOK_URL']
  },
  staging: {
    required: [...COMMON, ...SERVER, ...SECURITY, ...BILLING, ...OBSERVABILITY],
    recommended: ['OTEL_EXPORTER_OTLP_ENDPOINT', 'OPS_ALERT_WEBHOOK_URL']
  },
  prod: {
    required: [...COMMON, ...SERVER, ...SECURITY, ...BILLING, ...OBSERVABILITY, 'OTEL_EXPORTER_OTLP_ENDPOINT', 'OPS_ALERT_WEBHOOK_URL'],
    recommended: []
  }
};

if (!MATRIX[targetEnv]) {
  console.error(`[env-matrix] TARGET_ENV invalido: "${targetEnv}". Use: dev | staging | prod`);
  process.exit(1);
}

function findMissing(keys) {
  return keys.filter((key) => !process.env[key] || String(process.env[key]).trim() === '');
}

const strictMode = process.env.STRICT_ENV_MATRIX !== 'false';
const { required, recommended } = MATRIX[targetEnv];
const missingRequired = findMissing(required);
const missingRecommended = findMissing(recommended);

console.log(`[env-matrix] Ambiente: ${targetEnv}`);
if (missingRequired.length) {
  console.error('[env-matrix] Variaveis obrigatorias ausentes:');
  for (const key of missingRequired) console.error(` - ${key}`);
  if (strictMode) {
    process.exit(1);
  }
}

if (missingRecommended.length) {
  console.log('[env-matrix] Variaveis recomendadas ausentes:');
  for (const key of missingRecommended) console.log(` - ${key}`);
}

if (!missingRequired.length) {
  console.log('[env-matrix] Required vars: OK');
}
if (!missingRecommended.length) {
  console.log('[env-matrix] Recommended vars: OK');
}


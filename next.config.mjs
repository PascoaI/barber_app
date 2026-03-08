/** @type {import('next').NextConfig} */
function assertProductionBootEnv() {
  const shouldEnforce =
    process.env.VERCEL_ENV === 'production' ||
    process.env.ENFORCE_BOOT_ENV === 'true';

  if (!shouldEnforce) return;

  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_APP_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'CRON_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_BASIC',
    'STRIPE_PRICE_PRO',
    'STRIPE_PRICE_ENTERPRISE',
    'SENTRY_DSN',
    'OTEL_EXPORTER_OTLP_ENDPOINT',
    'OPS_ALERT_WEBHOOK_URL'
  ];
  const missing = required.filter((key) => !process.env[key] || String(process.env[key]).trim() === '');

  if (missing.length) {
    throw new Error(`[boot-env] missing required env for production boot: ${missing.join(', ')}`);
  }

  if (process.env.ENABLE_LEGACY_HTML_REWRITES === 'true' || process.env.ENABLE_LEGACY_SLUG_REDIRECTS === 'true') {
    throw new Error('[boot-env] legacy HTML rewrites/slug redirects must stay disabled in production.');
  }
}

assertProductionBootEnv();

const enableLegacyHtmlRewrites = process.env.ENABLE_LEGACY_HTML_REWRITES === 'true';

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ];
  },
  async rewrites() {
    if (!enableLegacyHtmlRewrites) return [];
    return [
      { source: '/:path*.html', destination: '/:path*' },
      { source: '/index.html', destination: '/' }
    ];
  }
};

export default nextConfig;

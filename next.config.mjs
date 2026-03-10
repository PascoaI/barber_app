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

}

assertProductionBootEnv();

const LEGACY_CANONICAL_REDIRECTS = [
  { source: '/index.html', destination: '/' },
  { source: '/booking-location', destination: '/booking/location' },
  { source: '/booking-service', destination: '/booking/service' },
  { source: '/booking-professional', destination: '/booking/professional' },
  { source: '/booking-datetime', destination: '/booking/datetime' },
  { source: '/booking-review', destination: '/booking/review' },
  { source: '/client-home', destination: '/client/home' },
  { source: '/my-schedules', destination: '/client/history' },
  { source: '/client-history', destination: '/client/history' },
  { source: '/client-profile', destination: '/client/profile' },
  { source: '/client-subscriptions', destination: '/client/subscriptions' },
  { source: '/client-loyalty', destination: '/client/loyalty' },
  { source: '/client-notifications', destination: '/client/notifications' },
  { source: '/barber-home', destination: '/barber' },
  { source: '/admin-home', destination: '/admin/home' },
  { source: '/admin-schedules', destination: '/admin/home' },
  { source: '/admin-barbers', destination: '/admin/barbers' },
  { source: '/admin-blocked-slots', destination: '/admin/blocked-slots' },
  { source: '/admin-finance', destination: '/admin/finance' },
  { source: '/admin-settings', destination: '/admin/settings' },
  { source: '/admin-unit-settings', destination: '/admin/settings' },
  { source: '/admin-stock', destination: '/admin/stock' },
  { source: '/admin-subscriptions', destination: '/admin/subscriptions' },
  { source: '/super-admin-login', destination: '/superadmin/login' },
  { source: '/super-admin-tenants', destination: '/superadmin/barbershops' },
  { source: '/super-admin-barbershop-form', destination: '/superadmin/barbershops/new' }
];

const nextConfig = {
  async redirects() {
    const redirects = [
      { source: '/:path*.html', destination: '/:path*', permanent: false }
    ];

    for (const route of LEGACY_CANONICAL_REDIRECTS) {
      redirects.push({
        source: route.source,
        destination: route.destination,
        permanent: false
      });
      if (!route.source.endsWith('.html')) {
        redirects.push({
          source: `${route.source}.html`,
          destination: route.destination,
          permanent: false
        });
      }
    }

    return [
      ...redirects
    ];
  },
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
    return [];
  }
};

export default nextConfig;

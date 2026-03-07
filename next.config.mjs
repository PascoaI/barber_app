/** @type {import('next').NextConfig} */
function assertProductionBootEnv() {
  const shouldEnforce =
    process.env.VERCEL_ENV === 'production' ||
    process.env.ENFORCE_BOOT_ENV === 'true';

  if (!shouldEnforce) return;

  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const missing = required.filter((key) => !process.env[key] || String(process.env[key]).trim() === '');

  if (missing.length) {
    throw new Error(`[boot-env] missing required env for production boot: ${missing.join(', ')}`);
  }
}

assertProductionBootEnv();

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
    return [
      { source: '/:path*.html', destination: '/:path*' },
      { source: '/index.html', destination: '/' }
    ];
  }
};

export default nextConfig;

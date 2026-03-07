const path = process.argv[2];

if (!path) {
  console.error('Usage: node scripts/trigger-cron.cjs <route-path>');
  console.error('Example: node scripts/trigger-cron.cjs /api/cron/billing-retry');
  process.exit(1);
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
const cronSecret = process.env.CRON_SECRET;

if (!appUrl) {
  console.error('Missing NEXT_PUBLIC_APP_URL or APP_URL');
  process.exit(1);
}

if (!cronSecret) {
  console.error('Missing CRON_SECRET');
  process.exit(1);
}

const target = `${String(appUrl).replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

fetch(target, {
  method: 'POST',
  headers: {
    'x-cron-secret': cronSecret,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
})
  .then(async (res) => {
    const raw = await res.text();
    let parsed = raw;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // keep as text
    }
    if (!res.ok) {
      console.error('[cron] request failed', { status: res.status, body: parsed });
      process.exit(1);
    }
    console.log('[cron] request ok', { status: res.status, body: parsed });
  })
  .catch((error) => {
    console.error('[cron] request error', error?.message || error);
    process.exit(1);
  });

#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^"(.*)"$/, '$1');
    if (!process.env[key]) process.env[key] = value;
  }
}

async function checkTable(baseUrl, serviceKey, table) {
  const url = `${baseUrl}/rest/v1/${table}?select=*&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`
    }
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`FAIL ${table}: ${res.status}`);
    console.error(body);
    return false;
  }
  console.log(`PASS ${table}: ${res.status}`);
  return true;
}

async function main() {
  loadEnvFile(path.join(root, '.env.local'));

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceKey) {
    console.error('FAIL missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const health = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`
    }
  });
  if (!health.ok) {
    console.error(`FAIL Supabase REST unavailable (${health.status})`);
    console.error(await health.text());
    process.exit(1);
  }
  console.log(`PASS Supabase REST reachable (${health.status})`);

  const tables = ['appointments', 'blocked_slots', 'users', 'subscriptions', 'unit_settings'];
  let failed = 0;
  for (const table of tables) {
    const ok = await checkTable(supabaseUrl, serviceKey, table);
    if (!ok) failed += 1;
  }

  if (failed > 0) process.exit(1);
  console.log('PASS Supabase readiness OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

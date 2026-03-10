#!/usr/bin/env node
const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(label, cmd, required = true, extraEnv = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmd, { cwd: root, stdio: 'inherit', shell: true, env: { ...process.env, ...extraEnv } });
    p.on('close', (code) => {
      const ok = (code || 0) === 0;
      console.log(`[${ok ? 'PASS' : (required ? 'FAIL' : 'WARN')}] ${label}`);
      resolve({ ok, required });
    });
  });
}

async function main() {
  let fail = 0;

  const checks = [
    ['check:utf8', `${npmCmd} run check:utf8`, true],
    ['check:legacy:build-sync', `${npmCmd} run check:legacy:build-sync`, true],
    ['check:parity', `${npmCmd} run check:parity`, true],
    ['npm run lint', `${npmCmd} run lint`, true],
    ['npm run typecheck', `${npmCmd} run typecheck`, true],
    ['npm test', `${npmCmd} test`, true],
    ['npm run build', `${npmCmd} run build`, true],
    ['npm run test:e2e', `${npmCmd} run test:e2e`, true, { PLAYWRIGHT_PORT: process.env.PLAYWRIGHT_PORT || '4273' }],
    ['npm run check:agenda:full', `${npmCmd} run check:agenda:full`, true],
    [
      'npm run env:check:matrix (dev)',
      `${npmCmd} run env:check:matrix`,
      true,
      {
        TARGET_ENV: 'dev',
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dev-anon-key',
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:4173'
      }
    ],
    ['npm run check:supabase', `${npmCmd} run check:supabase`, false]
  ];

  for (const [label, cmd, required, extraEnv] of checks) {
    const { ok } = await run(label, cmd, required, extraEnv);
    if (!ok && required) fail += 1;
  }

  console.log('[manual] validar em staging:');
  console.log(' - POST /api/appointments/validate-slot');
  console.log(' - POST /api/appointments/create');
  console.log(' - POST /api/cron/appointments-status');
  console.log(' - telas login/registro/cliente/admin/barbeiro');

  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

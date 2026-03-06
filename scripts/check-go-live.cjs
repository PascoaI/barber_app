#!/usr/bin/env node
const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(label, cmd, required = true) {
  return new Promise((resolve) => {
    const p = spawn(cmd, { cwd: root, stdio: 'inherit', shell: true });
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
    ['check:parity', 'npm run check:parity', true],
    ['npm test', `${npmCmd} test`, true],
    ['npm run build', `${npmCmd} run build`, false],
    ['npm run lint', `${npmCmd} run lint`, false],
    ['npm run check:agenda:full', `${npmCmd} run check:agenda:full`, true],
    ['npm run check:supabase', `${npmCmd} run check:supabase`, false]
  ];

  for (const [label, cmd, required] of checks) {
    const { ok } = await run(label, cmd, required);
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

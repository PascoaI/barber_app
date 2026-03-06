#!/usr/bin/env node
const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(label, args, required = true) {
  return new Promise((resolve) => {
    const p = spawn(`${npmCmd} ${args.join(' ')}`, { cwd: root, stdio: 'inherit', shell: true });
    p.on('close', (code) => {
      const ok = (code || 0) === 0;
      const icon = ok ? 'PASS' : (required ? 'FAIL' : 'WARN');
      console.log(`[${icon}] ${label}`);
      resolve({ ok, required });
    });
  });
}

async function main() {
  let fail = 0;

  const checks = [
    ['check:parity', ['run', 'check:parity'], true],
    ['test', ['test'], true],
    ['check:agenda', ['run', 'check:agenda'], true]
  ];

  for (const [label, args, required] of checks) {
    const { ok } = await run(label, args, required);
    if (!ok && required) fail += 1;
  }

  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

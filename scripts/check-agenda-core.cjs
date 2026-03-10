#!/usr/bin/env node
const { spawn, execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const PORT = Number(process.env.CHECK_AGENDA_PORT || 3011);

function run(cmdLine, opts = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmdLine, { cwd: root, stdio: 'inherit', shell: true, ...opts });
    p.on('close', (code) => resolve(code || 0));
  });
}

function postJson(route, payload) {
  return fetch(`http://127.0.0.1:${PORT}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {})
  }).then(async (res) => ({ status: res.status, body: await res.text() }));
}

async function waitForServer(ms = 60000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    try {
      await fetch(`http://127.0.0.1:${PORT}/`);
      return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  fs.rmSync(path.join(root, '.next'), { recursive: true, force: true });
  try {
    if (process.platform === 'win32') {
      execSync(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${PORT} ^| findstr LISTENING') do taskkill /PID %a /F`, { stdio: 'ignore', shell: true });
    } else {
      execSync(`lsof -ti tcp:${PORT} | xargs kill -9`, { stdio: 'ignore', shell: true });
    }
  } catch {}

  console.log('[agenda] parity');
  if (await run('node scripts/check-parity.cjs')) process.exit(1);

  console.log('[agenda] build');
  if (await run(`${npmCmd} run build`)) process.exit(1);

  console.log('[agenda] start dev server');
  const dev = spawn(`${npmCmd} run dev -- --port ${PORT}`, { cwd: root, stdio: 'ignore', shell: true });

  try {
    const ok = await waitForServer(60000);
    if (!ok) {
      console.error('[agenda] failed to start dev server');
      process.exit(1);
    }

    console.log('[agenda] endpoint sanity');
    const a = await postJson('/api/appointments/validate-slot', {});
    const b = await postJson('/api/cron/appointments-status', {});
    const allowedValidate = new Set([400, 401, 403]);
    const allowedCron = new Set([400, 401, 403]);
    if (!allowedValidate.has(a.status) || !allowedCron.has(b.status)) {
      console.error('expected auth/validation response statuses for empty payloads');
      console.error({ a, b });
      process.exit(1);
    }
    console.log('[agenda] OK');
  } finally {
    dev.kill();
    try {
      if (process.platform === 'win32') {
        execSync(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${PORT} ^| findstr LISTENING') do taskkill /PID %a /F`, { stdio: 'ignore', shell: true });
      } else {
        execSync(`lsof -ti tcp:${PORT} | xargs kill -9`, { stdio: 'ignore', shell: true });
      }
    } catch {}
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

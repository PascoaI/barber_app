#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
let status = 0;

function fail(msg) {
  console.error(msg);
  status = 1;
}

function sameFile(a, b) {
  if (!fs.existsSync(a) || !fs.existsSync(b)) return false;
  const ab = fs.readFileSync(a);
  const bb = fs.readFileSync(b);
  return Buffer.compare(ab, bb) === 0;
}

const legacyDir = path.join(root, 'legacy');
const legacyFiles = fs.readdirSync(legacyDir).filter((f) => f.endsWith('.html')).sort();

console.log('[parity] checking root/*.html <-> legacy/*.html');
for (const base of legacyFiles) {
  const legacyFile = path.join(legacyDir, base);
  const rootFile = path.join(root, base);
  if (!fs.existsSync(rootFile)) {
    fail(`[parity][ERROR] missing root copy for legacy/${base}`);
    continue;
  }
  if (!sameFile(legacyFile, rootFile)) fail(`[parity][ERROR] mismatch: ${base} differs between root and legacy/`);
}

console.log('[parity] checking script.js mirror');
if (!sameFile(path.join(root, 'script.js'), path.join(root, 'public', 'script.js'))) {
  fail('[parity][ERROR] script.js and public/script.js differ');
}

console.log('[parity] checking styles.css mirror');
if (!sameFile(path.join(root, 'styles.css'), path.join(root, 'public', 'styles.css'))) {
  fail('[parity][ERROR] styles.css and public/styles.css differ');
}

if (status !== 0) {
  console.error('[parity] FAILED');
  process.exit(1);
}

console.log('[parity] OK - all mirrored files are synchronized');

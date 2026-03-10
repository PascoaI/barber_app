#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const legacyDir = path.join(root, 'legacy');
const publicDir = path.join(root, 'public');

function copyFile(src, dst) {
  fs.copyFileSync(src, dst);
  console.log(`[sync] ${path.relative(root, src)} -> ${path.relative(root, dst)}`);
}

function syncLegacyHtml() {
  if (!fs.existsSync(legacyDir)) return;
  const legacyHtml = fs.readdirSync(legacyDir).filter((f) => f.endsWith('.html'));
  legacyHtml.forEach((file) => {
    const rootFile = path.join(root, file);
    const legacyFile = path.join(legacyDir, file);
    if (!fs.existsSync(rootFile)) {
      console.warn(`[sync][warn] missing root file for ${file}; skipped`);
      return;
    }
    copyFile(rootFile, legacyFile);
  });
}

function syncPublicMirrors() {
  const mirrors = [
    ['script.js', path.join('public', 'script.js')],
    ['styles.css', path.join('public', 'styles.css')]
  ];
  mirrors.forEach(([from, to]) => {
    const src = path.join(root, from);
    const dst = path.join(root, to);
    if (!fs.existsSync(src)) {
      console.warn(`[sync][warn] missing source ${from}; skipped`);
      return;
    }
    if (!fs.existsSync(path.dirname(dst))) {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
    }
    copyFile(src, dst);
  });
}

syncLegacyHtml();
syncPublicMirrors();
console.log('[sync] parity mirrors synchronized');

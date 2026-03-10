#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const textFileRegex = /\.(md|html|css|js|cjs|mjs|ts|tsx|json|sql|yml|yaml)$/i;
const ignoredDirs = new Set(['.git', '.next', 'node_modules', 'test-results']);
const suspiciousRegex = /\u00C3[\u0080-\u00BF]|\u00E2\u20AC[\u0090-\u00BF]|\u00C2(?=\S)|\uFFFD/g;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
      continue;
    }
    if (textFileRegex.test(entry.name)) files.push(full);
  }
  return files;
}

let failures = 0;

for (const file of walk(root)) {
  const rel = path.relative(root, file);
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!suspiciousRegex.test(line)) continue;
    failures += 1;
    const snippet = line.trim().slice(0, 140);
    console.error(`[utf8][ERROR] ${rel}:${i + 1}: ${snippet}`);
  }
}

if (failures > 0) {
  console.error(`[utf8] FAILED with ${failures} suspicious sequence(s). Run: npm run normalize:legacy-encoding`);
  process.exit(1);
}

console.log('[utf8] OK - no suspicious encoding artifacts found');

#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const textFileRegex = /\.(md|html|css|js|cjs|mjs|ts|tsx|json|sql|yml|yaml)$/i;
const ignoredDirs = new Set(['.git', '.next', 'node_modules', 'test-results']);
const suspiciousRegex = /\u00C3[\u0080-\u00BF]|\u00E2\u20AC[\u0090-\u00BF]|\u00C2(?=\S)|\uFFFD/g;

const directFixes = new Map([
  ['\u00E2\u20AC\u201D', '\u2014'],
  ['\u00E2\u20AC\u201C', '\u2013'],
  ['\u00E2\u20AC\u02DC', '\u2018'],
  ['\u00E2\u20AC\u2122', '\u2019'],
  ['\u00E2\u20AC\u0153', '\u201C'],
  ['\u00E2\u20AC\x9D', '\u201D'],
  ['\u00E2\u20AC\u00A2', '\u2022'],
  ['\u00E2\u2020\u0090', '\u2190'],
  ['\u00C2\u00A0', ' ']
]);

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

function issueScore(input) {
  const matches = input.match(suspiciousRegex);
  return matches ? matches.length : 0;
}

function applyDirectFixes(input) {
  let output = input;
  for (const [bad, good] of directFixes.entries()) output = output.split(bad).join(good);
  return output;
}

function normalizeFile(raw) {
  let best = applyDirectFixes(raw.normalize('NFC'));

  const latin1Decoded = Buffer.from(raw, 'latin1').toString('utf8');
  const candidate = applyDirectFixes(latin1Decoded).normalize('NFC');
  if (issueScore(candidate) < issueScore(best)) best = candidate;

  return best;
}

const files = walk(root);
let changed = 0;

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const normalized = normalizeFile(raw);
  if (normalized !== raw) {
    fs.writeFileSync(file, normalized, 'utf8');
    changed += 1;
  }
}

console.log(`[encoding] checked ${files.length} files, updated ${changed}`);

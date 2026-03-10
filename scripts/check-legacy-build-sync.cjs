#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'legacy-src', 'script');
const rootBundle = path.join(root, 'script.js');
const publicBundle = path.join(root, 'public', 'script.js');

if (!fs.existsSync(sourceDir)) {
  console.log('[legacy-build-sync] skipped: legacy-src/script not found');
  process.exit(0);
}

const sourceFiles = fs
  .readdirSync(sourceDir)
  .filter((name) => name.endsWith('.js'))
  .sort((a, b) => a.localeCompare(b, 'en'));

if (sourceFiles.length === 0) {
  console.error('[legacy-build-sync][ERROR] no source modules found in legacy-src/script');
  process.exit(1);
}

const banner = '// AUTO-GENERATED FILE. Source: legacy-src/script/*.js\n';
const expectedBody = sourceFiles
  .map((file) => fs.readFileSync(path.join(sourceDir, file), 'utf8').trimEnd())
  .join('\n\n');
const expected = `${banner}\n${expectedBody}\n`;

function assertEqual(filePath, expectedContent) {
  if (!fs.existsSync(filePath)) {
    console.error(`[legacy-build-sync][ERROR] missing file: ${path.relative(root, filePath)}`);
    return false;
  }

  const actual = fs.readFileSync(filePath, 'utf8');
  if (actual === expectedContent) return true;

  console.error(`[legacy-build-sync][ERROR] out of sync: ${path.relative(root, filePath)}`);
  return false;
}

let ok = true;
ok = assertEqual(rootBundle, expected) && ok;
ok = assertEqual(publicBundle, expected) && ok;

if (!ok) {
  console.error('[legacy-build-sync] FAILED. Run: npm run build:legacy-script');
  process.exit(1);
}

console.log(`[legacy-build-sync] OK - ${sourceFiles.length} module(s) in sync`);

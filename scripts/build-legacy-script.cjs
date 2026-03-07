#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'legacy-src', 'script');
const outputRoot = path.join(root, 'script.js');
const outputPublic = path.join(root, 'public', 'script.js');

if (!fs.existsSync(sourceDir)) {
  console.error(`[legacy-build] missing source dir: ${sourceDir}`);
  process.exit(1);
}

const files = fs
  .readdirSync(sourceDir)
  .filter((f) => f.endsWith('.js'))
  .sort((a, b) => a.localeCompare(b, 'en'));

if (!files.length) {
  console.error('[legacy-build] no module files found.');
  process.exit(1);
}

const banner = '// AUTO-GENERATED FILE. Source: legacy-src/script/*.js\n';
const body = files
  .map((file) => fs.readFileSync(path.join(sourceDir, file), 'utf8').trimEnd())
  .join('\n\n');

const finalContent = `${banner}\n${body}\n`;

fs.writeFileSync(outputRoot, finalContent, 'utf8');
fs.writeFileSync(outputPublic, finalContent, 'utf8');

console.log(`[legacy-build] built ${files.length} modules -> script.js + public/script.js`);

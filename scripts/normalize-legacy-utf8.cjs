#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

const fixMap = new Map([
  ['â†', '←'],
  ['â€¢', '•'],
  ['â€”', '—'],
  ['â€“', '–'],
  ['Ã¡', 'á'],
  ['Ã ', 'à'],
  ['Ã¢', 'â'],
  ['Ã£', 'ã'],
  ['Ã©', 'é'],
  ['Ãª', 'ê'],
  ['Ã­', 'í'],
  ['Ã³', 'ó'],
  ['Ã´', 'ô'],
  ['Ãµ', 'õ'],
  ['Ãº', 'ú'],
  ['Ã§', 'ç'],
  ['Ã', 'Á'],
  ['Ã€', 'À'],
  ['Ã‚', 'Â'],
  ['Ãƒ', 'Ã'],
  ['Ã‰', 'É'],
  ['ÃŠ', 'Ê'],
  ['Ã', 'Í'],
  ['Ã“', 'Ó'],
  ['Ã”', 'Ô'],
  ['Ã•', 'Õ'],
  ['Ãš', 'Ú'],
  ['Ã‡', 'Ç'],
  ['NÃ£o', 'Não'],
  ['invÃ¡l', 'invál'],
  ['nÃ£o', 'não'],
  ['operaÃ§', 'operaç'],
  ['aÃ§', 'aç'],
  ['Ã§Ã£o', 'ção'],
  ['Ã§Ãµes', 'ções']
]);

function collectFiles(dir, filterFn, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, filterFn, acc);
    else if (filterFn(full)) acc.push(full);
  }
  return acc;
}

const rootHtml = fs
  .readdirSync(root)
  .filter((f) => f.endsWith('.html'))
  .map((f) => path.join(root, f));

const legacyHtml = collectFiles(path.join(root, 'legacy'), (f) => f.endsWith('.html'));
const legacyJsCss = [
  path.join(root, 'script.js'),
  path.join(root, 'styles.css'),
  path.join(root, 'public', 'script.js'),
  path.join(root, 'public', 'styles.css')
];
const moduleJs = collectFiles(path.join(root, 'legacy-src'), (f) => f.endsWith('.js'));

const files = [...rootHtml, ...legacyHtml, ...legacyJsCss, ...moduleJs].filter((f) => fs.existsSync(f));

let changed = 0;

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  let normalized = raw.normalize('NFC');
  for (const [bad, good] of fixMap.entries()) normalized = normalized.split(bad).join(good);
  if (normalized !== raw) {
    fs.writeFileSync(file, normalized, 'utf8');
    changed += 1;
  }
}

console.log(`[encoding] checked ${files.length} files, updated ${changed}`);

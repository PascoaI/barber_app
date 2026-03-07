const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

if (!fs.existsSync(migrationsDir)) {
  console.error('[migrations] Directory not found:', migrationsDir);
  process.exit(1);
}

const files = fs
  .readdirSync(migrationsDir)
  .filter((name) => name.endsWith('.sql'))
  .sort();

if (!files.length) {
  console.error('[migrations] No migration files found.');
  process.exit(1);
}

const invalid = files.filter((name) => !/^\d{14}_[a-z0-9_]+\.sql$/i.test(name));
if (invalid.length) {
  console.error('[migrations] Invalid file naming:');
  invalid.forEach((name) => console.error(` - ${name}`));
  process.exit(1);
}

const sorted = [...files].sort();
const isOrdered = files.every((file, index) => file === sorted[index]);
if (!isOrdered) {
  console.error('[migrations] Files are not lexicographically ordered.');
  process.exit(1);
}

const duplicatedTimestamps = [];
const seen = new Set();
for (const file of files) {
  const ts = file.slice(0, 14);
  if (seen.has(ts)) duplicatedTimestamps.push(ts);
  seen.add(ts);
}
if (duplicatedTimestamps.length) {
  console.error('[migrations] Duplicate timestamp prefixes found:', [...new Set(duplicatedTimestamps)].join(', '));
  process.exit(1);
}

console.log('[migrations] OK:', files.length, 'files');

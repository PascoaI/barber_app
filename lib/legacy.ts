import fs from 'node:fs';
import path from 'node:path';

const LEGACY_DIR = path.join(process.cwd(), 'legacy');

export function listLegacyPages() {
  return fs
    .readdirSync(LEGACY_DIR)
    .filter((f) => f.endsWith('.html'))
    .map((f) => f.replace('.html', ''));
}

export function getLegacyHtml(pageName: string) {
  const normalized = pageName.replace(/^\/+|\.html$/g, '').trim() || 'index';
  const file = path.join(LEGACY_DIR, `${normalized}.html`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf-8');
}

export function getLegacyBody(pageName: string) {
  const html = getLegacyHtml(pageName);
  if (!html) return null;
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  return body
    .replace(/<script[^>]*src=["']script\.js["'][^>]*><\/script>/gi, '')
    .replace(/<script[^>]*src=["']https:\/\/cdn\.tailwindcss\.com["'][^>]*><\/script>/gi, '')
    .replace(/<link[^>]*href=["']styles\.css["'][^>]*>/gi, '')
    .replace(/<script>[\s\S]*?tailwind\.config[\s\S]*?<\/script>/gi, '');
}

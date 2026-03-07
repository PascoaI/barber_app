export const CSRF_COOKIE_NAME = 'barberpro_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

export function getCookieValue(cookieHeader: string | null, key: string) {
  if (!cookieHeader) return '';
  const found = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${key}=`));
  return found ? decodeURIComponent(found.slice(key.length + 1)) : '';
}

export function validateCsrfFromRequest(req: Request) {
  const cookieToken = getCookieValue(req.headers.get('cookie'), CSRF_COOKIE_NAME);
  const headerToken = req.headers.get(CSRF_HEADER_NAME) || '';
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return { ok: false as const, message: 'CSRF token invalido.' };
  }
  return { ok: true as const };
}

export function validateSameOrigin(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const requestOrigin = req.headers.get('origin') || '';
  if (!appUrl || !requestOrigin) return { ok: true as const };

  try {
    const appHost = new URL(appUrl).host;
    const originHost = new URL(requestOrigin).host;
    if (appHost !== originHost) {
      return { ok: false as const, message: 'Origem nao permitida.' };
    }
  } catch {
    return { ok: false as const, message: 'Origem invalida.' };
  }

  return { ok: true as const };
}

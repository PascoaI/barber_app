'use client';

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/security/csrf';

function readCookie(name: string) {
  if (typeof document === 'undefined') return '';
  const found = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.slice(name.length + 1)) : '';
}

export function getCsrfToken() {
  return readCookie(CSRF_COOKIE_NAME);
}

export function withCsrfHeaders(init?: RequestInit): RequestInit {
  const token = getCsrfToken();
  return {
    ...(init || {}),
    headers: {
      ...(init?.headers || {}),
      [CSRF_HEADER_NAME]: token
    }
  };
}

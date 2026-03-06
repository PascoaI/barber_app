'use client';

import { useMemo } from 'react';

export function useRoleFromCookie() {
  return useMemo(() => {
    if (typeof document === 'undefined') return '';
    const roleCookie = document.cookie
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('barberpro_role='));
    if (!roleCookie) return '';
    return decodeURIComponent(roleCookie.split('=').slice(1).join('=') || '');
  }, []);
}

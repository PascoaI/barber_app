'use client';

import { useEffect } from 'react';
import { withCsrfHeaders } from '@/lib/security/csrf-client';

export function useAdminAccessAudit(pathname: string) {
  useEffect(() => {
    if (!pathname) return;
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/superadmin')) return;

    const key = `audit:${pathname}`;
    if (typeof window !== 'undefined' && window.sessionStorage.getItem(key)) return;

    void fetch('/api/audit/access', withCsrfHeaders({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname })
    }))
      .finally(() => {
        if (typeof window !== 'undefined') window.sessionStorage.setItem(key, '1');
      });
  }, [pathname]);
}

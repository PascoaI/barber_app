import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getMiddlewareSession } from '@/lib/auth/middleware-session';
import { CSRF_COOKIE_NAME } from '@/lib/security/csrf';

function redirectTo(path: string, req: NextRequest) {
  return NextResponse.redirect(new URL(path, req.url));
}

function applySecurityHeaders(res: NextResponse) {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/api/healthz') {
    return NextResponse.next();
  }

  if (process.env.NODE_ENV === 'production' && pathname.endsWith('.html')) {
    const normalized = pathname === '/index.html' ? '/' : pathname.replace(/\.html$/i, '');
    return redirectTo(normalized || '/', req);
  }

  const { res, session, authAvailable, reason } = await getMiddlewareSession(req);
  const csrfToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (!csrfToken) {
    res.cookies.set(CSRF_COOKIE_NAME, crypto.randomUUID(), {
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 12
    });
  }

  if (!authAvailable) {
    res.headers.set('x-auth-fallback', reason || 'auth_unavailable');
  }

  if (pathname.startsWith('/superadmin')) {
    if (pathname === '/superadmin/login') {
      applySecurityHeaders(res);
      return res;
    }
    if (session?.role !== 'super_admin') return redirectTo('/superadmin/login', req);
  }

  if (pathname.startsWith('/admin')) {
    if (!session || !['admin', 'super_admin'].includes(session.role)) return redirectTo('/login', req);
  }

  if (pathname.startsWith('/barber')) {
    if (!session || session.role !== 'barber') return redirectTo('/login', req);
  }

  applySecurityHeaders(res);
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/healthz).*)']
};

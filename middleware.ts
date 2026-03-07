import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getMiddlewareSession } from '@/lib/auth/middleware-session';

function redirectTo(path: string, req: NextRequest) {
  return NextResponse.redirect(new URL(path, req.url));
}

export async function middleware(req: NextRequest) {
  const { res, session } = await getMiddlewareSession(req);
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/superadmin')) {
    if (pathname === '/superadmin/login') return res;
    if (session?.role !== 'super_admin') return redirectTo('/superadmin/login', req);
  }

  if (pathname.startsWith('/admin')) {
    if (!session || !['admin', 'super_admin'].includes(session.role)) return redirectTo('/login', req);
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*']
};

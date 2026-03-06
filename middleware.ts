import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function redirectTo(path: string, req: NextRequest) {
  return NextResponse.redirect(new URL(path, req.url));
}

export function middleware(req: NextRequest) {
  const role = req.cookies.get('barberpro_role')?.value || '';
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/superadmin')) {
    if (pathname === '/superadmin/login') return NextResponse.next();
    if (role !== 'super_admin') return redirectTo('/superadmin/login', req);
  }

  if (pathname.startsWith('/admin')) {
    if (!['admin', 'super_admin'].includes(role)) return redirectTo('/login', req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*']
};

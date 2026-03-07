import { NextResponse } from 'next/server';
import { assertSuperAdminSession } from '@/lib/auth/superadmin-api';

export async function GET() {
  try {
    const check = await assertSuperAdminSession();
    if (!check.ok) {
      return NextResponse.json({ authenticated: false }, { status: check.status });
    }
    return NextResponse.json({
      authenticated: true,
      email: check.superAdmin.email || check.user.email || ''
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error?.message || 'session_check_failed' }, { status: 500 });
  }
}

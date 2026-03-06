import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdminRole, isSuperAdminRole } from './roles';

export function getRoleFromCookie() {
  return cookies().get('barberpro_role')?.value || '';
}

export function requireAdminRoute() {
  const role = getRoleFromCookie();
  if (!isAdminRole(role)) redirect('/login');
}

export function requireSuperAdminRoute() {
  const role = getRoleFromCookie();
  if (!isSuperAdminRole(role)) redirect('/superadmin/login');
}

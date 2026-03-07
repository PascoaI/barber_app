import { requireAppSession } from '@/lib/auth/server-session';

export async function requireAdminRoute() {
  await requireAppSession(['admin', 'super_admin']);
}

export async function requireSuperAdminRoute() {
  await requireAppSession(['super_admin']);
}

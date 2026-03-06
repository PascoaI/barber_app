export const ROLES = {
  CLIENT: 'client',
  ADMIN: 'admin',
  BARBER: 'barber',
  SUPER_ADMIN: 'super_admin'
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export function isAdminRole(role?: string | null) {
  return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
}

export function isSuperAdminRole(role?: string | null) {
  return role === ROLES.SUPER_ADMIN;
}

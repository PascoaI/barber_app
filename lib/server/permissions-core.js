function resolveRedirectByRole(input) {
  const isSuperAdmin = Boolean(input?.isSuperAdmin);
  const role = String(input?.role || '').toLowerCase();

  if (isSuperAdmin) return '/superadmin/dashboard';
  if (role === 'admin') return '/admin/home';
  if (role === 'barber') return '/barber';
  return '/client/home';
}

function canAccessRoute(input) {
  const role = String(input?.role || '').toLowerCase();
  const pathname = String(input?.pathname || '');
  if (pathname.startsWith('/superadmin')) return role === 'super_admin';
  if (pathname.startsWith('/admin')) return role === 'admin' || role === 'super_admin';
  if (pathname.startsWith('/barber')) return role === 'barber';
  return true;
}

module.exports = {
  resolveRedirectByRole,
  canAccessRoute
};

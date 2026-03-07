import { notFound, redirect } from 'next/navigation';

const enableLegacySlugRedirects = process.env.ENABLE_LEGACY_SLUG_REDIRECTS !== 'false';

const LEGACY_REDIRECTS: Record<string, string> = {
  login: '/login',
  register: '/register',
  booking: '/booking',
  'booking-service': '/booking/service',
  'booking-professional': '/booking/professional',
  'booking-datetime': '/booking/datetime',
  'booking-location': '/booking/location',
  'booking-review': '/booking/review',
  'client-home': '/client/home',
  'client-history': '/client/history',
  'client-profile': '/client/profile',
  'client-subscriptions': '/client/subscriptions',
  'client-loyalty': '/client/loyalty',
  'client-notifications': '/client/notifications',
  'barber-home': '/barber',
  'admin-home': '/admin/home',
  'admin-barbers': '/admin/barbers',
  'admin-finance': '/admin/finance',
  'admin-settings': '/admin/settings',
  'admin-stock': '/admin/stock',
  'admin-subscriptions': '/admin/subscriptions',
  'admin-blocked-slots': '/admin/blocked-slots',
  'super-admin-login': '/superadmin/login',
  'super-admin-tenants': '/superadmin/barbershops',
  'super-admin-barbershop-form': '/superadmin/barbershops/new'
};

export function generateStaticParams() {
  return Object.keys(LEGACY_REDIRECTS).map((slug) => ({ slug }));
}

export default function GenericLegacyRoute({ params }: { params: { slug: string } }) {
  if (!enableLegacySlugRedirects) notFound();
  const target = LEGACY_REDIRECTS[params.slug];
  if (!target) notFound();
  redirect(target);
}

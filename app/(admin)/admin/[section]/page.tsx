import { notFound } from 'next/navigation';
import LegacyRoutePage from '@/app/_components/LegacyRoutePage';
import AdminHomePage from '@/app/admin-home/page';
import AdminSettingsPage from '@/app/admin-settings/page';

const LEGACY_BY_SECTION: Record<string, string> = {
  barbers: 'admin-barbers',
  stock: 'admin-stock',
  finance: 'admin-finance',
  subscriptions: 'admin-subscriptions',
  'blocked-slots': 'admin-blocked-slots'
};

export default function AdminDomainPage({ params }: { params: { section: string } }) {
  const section = params.section;

  if (section === 'home') return <AdminHomePage />;
  if (section === 'settings') return <AdminSettingsPage />;

  const legacySlug = LEGACY_BY_SECTION[section];
  if (!legacySlug) return notFound();
  return <LegacyRoutePage slug={legacySlug} />;
}

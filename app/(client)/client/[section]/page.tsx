import { notFound } from 'next/navigation';
import LegacyRoutePage from '@/app/_components/LegacyRoutePage';
import ClientHomePage from '@/app/client-home/page';
import ClientProfilePage from '@/app/client-profile/page';
import ClientHistoryPage from '@/app/client-history/page';
import ClientSubscriptionsPage from '@/app/client-subscriptions/page';

const LEGACY_BY_SECTION: Record<string, string> = {
  loyalty: 'client-loyalty',
  notifications: 'client-notifications'
};

export default function ClientDomainPage({ params }: { params: { section: string } }) {
  const section = params.section;

  if (section === 'home') return <ClientHomePage />;
  if (section === 'profile') return <ClientProfilePage />;
  if (section === 'history') return <ClientHistoryPage />;
  if (section === 'subscriptions') return <ClientSubscriptionsPage />;

  const legacySlug = LEGACY_BY_SECTION[section];
  if (!legacySlug) return notFound();
  return <LegacyRoutePage slug={legacySlug} />;
}

import { notFound } from 'next/navigation';
import LegacyRoutePage from '@/app/_components/LegacyRoutePage';

const SLUG_BY_SECTION: Record<string, string> = {
  '': 'booking',
  service: 'booking-service',
  datetime: 'booking-datetime',
  location: 'booking-location',
  professional: 'booking-professional',
  review: 'booking-review'
};

export default function BookingDomainPage({ params }: { params: { section?: string[] } }) {
  const key = params.section?.[0] || '';
  const slug = SLUG_BY_SECTION[key];
  if (!slug) return notFound();
  return <LegacyRoutePage slug={slug} />;
}

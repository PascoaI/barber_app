import { notFound } from 'next/navigation';
import LegacyPage from './LegacyPage';
import { getLegacyBody } from '@/lib/legacy';

export default function LegacyRoutePage({ slug }: { slug: string }) {
  const body = getLegacyBody(slug);
  if (!body) notFound();
  return <LegacyPage bodyHtml={body} />;
}

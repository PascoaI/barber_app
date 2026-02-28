import { notFound } from 'next/navigation';
import LegacyPage from './_components/LegacyPage';
import { getLegacyBody } from '@/lib/legacy';

export default function HomePage() {
  const body = getLegacyBody('index');
  if (!body) notFound();
  return <LegacyPage bodyHtml={body} />;
}

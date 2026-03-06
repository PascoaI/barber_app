import { notFound } from 'next/navigation';
import LegacyPage from '../_components/LegacyPage';
import { getLegacyBody } from '@/lib/legacy';

export default function LoginPage() {
  const body = getLegacyBody('login');
  if (!body) notFound();
  return <LegacyPage bodyHtml={body} />;
}

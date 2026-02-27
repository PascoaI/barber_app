import { notFound } from 'next/navigation';
import LegacyPage from '../_components/LegacyPage';
import { getLegacyBody } from '@/lib/legacy';

export default function RegisterPage() {
  const body = getLegacyBody('register');
  if (!body) notFound();
  return <LegacyPage bodyHtml={body} />;
}

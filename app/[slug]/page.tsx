import { notFound } from 'next/navigation';
import LegacyPage from '../_components/LegacyPage';
import { getLegacyBody, listLegacyPages } from '@/lib/legacy';

export function generateStaticParams() {
  return listLegacyPages()
    .filter((name) => name !== 'index')
    .map((name) => ({ slug: name }));
}

export default function GenericLegacyRoute({ params }: { params: { slug: string } }) {
  const body = getLegacyBody(params.slug);
  if (!body) notFound();
  return <LegacyPage bodyHtml={body} />;
}

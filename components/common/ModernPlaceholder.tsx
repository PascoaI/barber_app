import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export function ModernPlaceholder({ title, description, ctaHref = '/admin/home', ctaLabel = 'Voltar ao dashboard' }: Props) {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4">
      <Card className="border-borderc/80 bg-gradient-to-br from-slate-950/75 via-slate-900/70 to-slate-950/80">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-text-secondary">{description}</p>
        </CardHeader>
        <CardContent>
          <Link
            href={ctaHref}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 font-semibold text-zinc-900 transition-all duration-200 hover:brightness-95"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

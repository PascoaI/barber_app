'use client';

import { ArrowLeft, House, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { signOutPlatformSession } from '@/services/superadmin';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function SuperAdminShell({ title, subtitle, children }: Props) {
  const router = useRouter();

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4">
      <Card className="overflow-hidden border-borderc/80 bg-gradient-to-br from-slate-950/75 via-slate-900/70 to-slate-950/80">
        <CardHeader className="grid gap-4 border-b border-borderc/70">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" className="inline-flex items-center gap-2" onClick={() => router.push('/')}>
                <House className="h-4 w-4" /> Home
              </Button>
              <Button type="button" variant="outline" className="inline-flex items-center gap-2" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
            </div>
            <Button
              type="button"
              variant="destructive"
              className="inline-flex items-center gap-2"
              onClick={() => {
                signOutPlatformSession();
                router.push('/superadmin/login');
              }}
            >
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            {subtitle ? <p className="mt-1 text-sm text-text-secondary">{subtitle}</p> : null}
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">{children}</CardContent>
      </Card>
    </div>
  );
}

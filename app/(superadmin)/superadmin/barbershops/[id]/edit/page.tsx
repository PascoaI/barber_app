'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { BarbershopForm, SuperAdminShell } from '@/components/superadmin';
import { findPlatformBarbershop, isSuperAdminSession, savePlatformBarbershop } from '@/services/superadmin';
import type { Barbershop } from '@/types/barbershop';

export default function SuperAdminBarbershopEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);

  useEffect(() => {
    void (async () => {
      if (!(await isSuperAdminSession())) {
        router.replace('/superadmin/login');
        return;
      }

      const row = await findPlatformBarbershop(params.id);
      if (!row) {
        router.replace('/superadmin/barbershops');
        return;
      }

      setBarbershop(row);
    })();
  }, [params.id, router]);

  if (!barbershop) return null;

  return (
    <SuperAdminShell title="Editar Barbearia" subtitle={`Atualize os dados de ${barbershop.name}.`}>
      <BarbershopForm
        initial={barbershop}
        submitLabel="Salvar alteracoes"
        onSubmit={async (data) => {
          const result = await savePlatformBarbershop(data, params.id);
          if (!result.ok) throw new Error(result.message);
          toast('Barbearia atualizada com sucesso.');
          router.push('/superadmin/barbershops');
        }}
        onCancel={() => router.push('/superadmin/barbershops')}
      />
    </SuperAdminShell>
  );
}

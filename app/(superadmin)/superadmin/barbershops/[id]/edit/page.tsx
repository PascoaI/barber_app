'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { BarbershopForm, SuperAdminShell } from '@/components/superadmin';
import { findPlatformBarbershop, isSuperAdminSession, savePlatformBarbershop } from '@/services/superadmin';

export default function SuperAdminBarbershopEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const barbershop = useMemo(() => findPlatformBarbershop(params.id), [params.id]);

  useEffect(() => {
    if (!isSuperAdminSession()) {
      router.replace('/superadmin/login');
      return;
    }
    if (!barbershop) router.replace('/superadmin/barbershops');
  }, [router, barbershop]);

  if (!barbershop) return null;

  return (
    <SuperAdminShell title="Editar Barbearia" subtitle={`Atualize os dados de ${barbershop.name}.`}>
      <BarbershopForm
        initial={barbershop}
        submitLabel="Salvar alterações"
        onSubmit={async (data) => {
          const result = savePlatformBarbershop(data, params.id);
          if (!result.ok) throw new Error(result.message);
          toast('Barbearia atualizada com sucesso.');
          router.push('/superadmin/barbershops');
        }}
        onCancel={() => router.push('/superadmin/barbershops')}
      />
    </SuperAdminShell>
  );
}

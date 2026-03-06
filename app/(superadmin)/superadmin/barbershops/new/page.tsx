'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { BarbershopForm, SuperAdminShell } from '@/components/superadmin';
import { isSuperAdminSession, savePlatformBarbershop } from '@/services/superadmin';

export default function SuperAdminBarbershopNewPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isSuperAdminSession()) router.replace('/superadmin/login');
  }, [router]);

  return (
    <SuperAdminShell title="Adicionar Barbearia" subtitle="Cadastro de nova barbearia na plataforma.">
      <BarbershopForm
        submitLabel="Cadastrar barbearia"
        onSubmit={async (data) => {
          const result = savePlatformBarbershop(data);
          if (!result.ok) throw new Error(result.message);
          toast('Barbearia cadastrada com sucesso.');
          router.push('/superadmin/barbershops');
        }}
        onCancel={() => router.push('/superadmin/barbershops')}
      />
    </SuperAdminShell>
  );
}

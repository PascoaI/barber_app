import { ModernPlaceholder } from '@/components/common/ModernPlaceholder';

export default function BarberEntryPage() {
  return (
    <ModernPlaceholder
      title="Painel do barbeiro"
      description="Modulo do barbeiro em migracao para App Router e autenticao server-side."
      ctaHref="/login"
      ctaLabel="Voltar ao login"
    />
  );
}

import { ModernPlaceholder } from '@/components/common/ModernPlaceholder';

export default function BookingEntryPage() {
  return (
    <ModernPlaceholder
      title="Novo agendamento"
      description="Fluxo de booking em migracao do script legado para wizard React com APIs seguras."
      ctaHref="/client/home"
      ctaLabel="Ir para painel do cliente"
    />
  );
}

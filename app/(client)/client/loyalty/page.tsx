import { ModernPlaceholder } from '@/components/common/ModernPlaceholder';

export default function ClientLoyaltyPage() {
  return (
    <ModernPlaceholder
      title="Fidelidade"
      description="Modulo de fidelidade em migracao do legado para componentes React com dados segregados por tenant."
      ctaHref="/client/home"
      ctaLabel="Voltar ao painel do cliente"
    />
  );
}

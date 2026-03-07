import { ModernPlaceholder } from '@/components/common/ModernPlaceholder';

export default function BookingReviewPage() {
  return (
    <ModernPlaceholder
      title="Revisao do agendamento"
      description="Confirmacao final em migracao para fluxo idempotente com API Next.js."
      ctaHref="/booking"
      ctaLabel="Voltar ao inicio do booking"
    />
  );
}

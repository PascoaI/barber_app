import { ModernPlaceholder } from '@/components/common/ModernPlaceholder';

export default function BookingProfessionalPage() {
  return (
    <ModernPlaceholder
      title="Escolha do profissional"
      description="Etapa de profissional em migracao para consultas tenant-aware com RLS."
      ctaHref="/booking"
      ctaLabel="Voltar ao inicio do booking"
    />
  );
}

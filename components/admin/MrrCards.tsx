import { KpiCard } from '@/components/admin/KpiCard';

export function MrrCards({ mrr, activeSubscribers, forecast }: { mrr: number; activeSubscribers: number; forecast: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <KpiCard title="MRR" value={`R$ ${mrr.toFixed(2)}`} hint="Receita recorrente mensal" />
      <KpiCard title="Assinantes ativos" value={String(activeSubscribers)} />
      <KpiCard title="Faturamento previsto" value={`R$ ${forecast.toFixed(2)}`} />
    </div>
  );
}

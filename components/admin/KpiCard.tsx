import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function KpiCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
        {hint ? <small className="text-text-secondary">{hint}</small> : null}
      </CardContent>
    </Card>
  );
}

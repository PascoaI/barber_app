import { ReactNode } from 'react';

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-borderc p-6 text-center grid gap-2 bg-surface/60">
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-text-secondary">{description}</p>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}

export function CardSkeleton() {
  return <div className="h-24 w-full rounded-xl bg-slate-200/70 animate-pulse" />;
}

export function TableSkeleton() {
  return (
    <div className="grid gap-2">
      {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 rounded-lg bg-slate-200/70 animate-pulse" />)}
    </div>
  );
}

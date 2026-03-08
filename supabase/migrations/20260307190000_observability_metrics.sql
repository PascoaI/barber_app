-- Observability metrics for runtime error/latency/business dashboards

create table if not exists public.operational_metrics (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid references public.barbershops(id) on delete set null,
  metric_type text not null check (metric_type in ('api_error', 'api_latency', 'booking_conversion', 'payment_failure', 'custom')),
  metric_name text not null,
  value numeric(14,2) not null default 0,
  tags jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_operational_metrics_metric_type
  on public.operational_metrics(metric_type, occurred_at desc);

create index if not exists idx_operational_metrics_barbershop
  on public.operational_metrics(barbershop_id, occurred_at desc);

alter table public.operational_metrics enable row level security;

drop policy if exists p_operational_metrics_insert on public.operational_metrics;
create policy p_operational_metrics_insert on public.operational_metrics
for insert
with check (
  public.is_super_admin()
  or barbershop_id = public.current_barbershop_id()
);

drop policy if exists p_operational_metrics_select on public.operational_metrics;
create policy p_operational_metrics_select on public.operational_metrics
for select
using (
  public.is_super_admin()
  or barbershop_id = public.current_barbershop_id()
);


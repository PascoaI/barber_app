-- Stripe runtime tables (idempotency, retries and reconciliation)

alter table public.barbershops
  add column if not exists stripe_customer_id text unique;

create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_price_id text,
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (barbershop_id)
);

create index if not exists idx_billing_subscriptions_barbershop on public.billing_subscriptions(barbershop_id);
create index if not exists idx_billing_subscriptions_status on public.billing_subscriptions(status);

drop trigger if exists trg_billing_subscriptions_updated_at on public.billing_subscriptions;
create trigger trg_billing_subscriptions_updated_at
before update on public.billing_subscriptions
for each row execute function public.set_updated_at();

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'processed', 'failed')),
  retries integer not null default 0,
  last_error text,
  next_retry_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_billing_events_status_retry on public.billing_events(status, next_retry_at);

drop trigger if exists trg_billing_events_updated_at on public.billing_events;
create trigger trg_billing_events_updated_at
before update on public.billing_events
for each row execute function public.set_updated_at();

alter table public.billing_subscriptions enable row level security;
alter table public.billing_events enable row level security;

drop policy if exists p_billing_subscriptions_all on public.billing_subscriptions;
create policy p_billing_subscriptions_all on public.billing_subscriptions
for all
using (public.is_super_admin() or barbershop_id = public.current_barbershop_id())
with check (public.is_super_admin() or barbershop_id = public.current_barbershop_id());

drop policy if exists p_billing_events_superadmin on public.billing_events;
create policy p_billing_events_superadmin on public.billing_events
for all
using (public.is_super_admin())
with check (public.is_super_admin());

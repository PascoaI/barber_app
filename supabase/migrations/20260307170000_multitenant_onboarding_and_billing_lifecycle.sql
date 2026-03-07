-- Multi-tenant onboarding fields + billing lifecycle hardening

alter table public.barbershops
  add column if not exists slug text,
  add column if not exists invite_code text;

update public.barbershops
set slug = lower(
  concat(
    coalesce(
      nullif(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), ''),
      'barbershop'
    ),
    '-',
    substring(replace(id::text, '-', '') from 1 for 6)
  )
)
where slug is null;

update public.barbershops
set invite_code = upper(substring(replace(id::text, '-', '') from 1 for 8))
where invite_code is null;

create unique index if not exists idx_barbershops_slug_unique
  on public.barbershops (lower(slug))
  where slug is not null;

create unique index if not exists idx_barbershops_invite_code_unique
  on public.barbershops (lower(invite_code))
  where invite_code is not null;

alter table public.billing_subscriptions
  add column if not exists plan text,
  add column if not exists billing_cycle text,
  add column if not exists current_period_start timestamptz,
  add column if not exists grace_until timestamptz,
  add column if not exists grace_days integer not null default 3,
  add column if not exists last_payment_failed_at timestamptz,
  add column if not exists last_payment_succeeded_at timestamptz;

update public.billing_subscriptions
set plan = coalesce(plan, 'basic')
where plan is null;

update public.billing_subscriptions
set billing_cycle = coalesce(billing_cycle, 'month')
where billing_cycle is null;

alter table public.billing_subscriptions
  alter column plan set default 'basic',
  alter column billing_cycle set default 'month';

create index if not exists idx_billing_subscriptions_plan
  on public.billing_subscriptions(plan);

create index if not exists idx_billing_subscriptions_grace_until
  on public.billing_subscriptions(grace_until);

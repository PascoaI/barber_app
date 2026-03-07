-- Compliance and security support tables (LGPD baseline)

create table if not exists public.consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  barbershop_id uuid references public.barbershops(id) on delete set null,
  terms_version text not null,
  privacy_version text not null,
  accepted_terms boolean not null default false,
  accepted_privacy boolean not null default false,
  accepted_at timestamptz not null default timezone('utc', now()),
  ip_address text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_consent_events_user on public.consent_events(user_id);
create index if not exists idx_consent_events_barbershop on public.consent_events(barbershop_id);

create table if not exists public.client_privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  barbershop_id uuid references public.barbershops(id) on delete set null,
  request_type text not null check (request_type in ('anonymize', 'delete')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'done')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_client_privacy_requests_updated_at on public.client_privacy_requests;
create trigger trg_client_privacy_requests_updated_at
before update on public.client_privacy_requests
for each row execute function public.set_updated_at();

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  barbershop_id uuid references public.barbershops(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_barbershop on public.audit_logs(barbershop_id);
create index if not exists idx_audit_logs_user on public.audit_logs(user_id);

alter table public.consent_events enable row level security;
alter table public.client_privacy_requests enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists p_consent_events_all on public.consent_events;
create policy p_consent_events_all on public.consent_events
for all
using (
  public.is_super_admin()
  or user_id = auth.uid()
  or barbershop_id = public.current_barbershop_id()
)
with check (
  public.is_super_admin()
  or user_id = auth.uid()
  or barbershop_id = public.current_barbershop_id()
);

drop policy if exists p_client_privacy_requests_all on public.client_privacy_requests;
create policy p_client_privacy_requests_all on public.client_privacy_requests
for all
using (
  public.is_super_admin()
  or user_id = auth.uid()
  or barbershop_id = public.current_barbershop_id()
)
with check (
  public.is_super_admin()
  or user_id = auth.uid()
  or barbershop_id = public.current_barbershop_id()
);

drop policy if exists p_audit_logs_insert on public.audit_logs;
create policy p_audit_logs_insert on public.audit_logs
for insert
with check (
  public.is_super_admin()
  or user_id = auth.uid()
  or barbershop_id = public.current_barbershop_id()
);

drop policy if exists p_audit_logs_select on public.audit_logs;
create policy p_audit_logs_select on public.audit_logs
for select
using (
  public.is_super_admin()
  or user_id = auth.uid()
  or barbershop_id = public.current_barbershop_id()
);

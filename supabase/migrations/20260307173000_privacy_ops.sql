-- LGPD operational pipeline: exports + processing metadata

alter table public.client_privacy_requests
  add column if not exists processed_at timestamptz,
  add column if not exists result jsonb;

create table if not exists public.privacy_exports (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.client_privacy_requests(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  barbershop_id uuid references public.barbershops(id) on delete set null,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_privacy_exports_request
  on public.privacy_exports(request_id);

create index if not exists idx_privacy_exports_user
  on public.privacy_exports(user_id);

alter table public.privacy_exports enable row level security;

drop policy if exists p_privacy_exports_insert on public.privacy_exports;
create policy p_privacy_exports_insert on public.privacy_exports
for insert
with check (
  public.is_super_admin()
  or user_id = auth.uid()
  or barbershop_id = public.current_barbershop_id()
);

drop policy if exists p_privacy_exports_select on public.privacy_exports;
create policy p_privacy_exports_select on public.privacy_exports
for select
using (
  public.is_super_admin()
  or user_id = auth.uid()
  or barbershop_id = public.current_barbershop_id()
);

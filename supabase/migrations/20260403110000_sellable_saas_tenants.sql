create table if not exists public.tenants (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_tenants_updated_at on public.tenants;
create trigger trg_tenants_updated_at
before update on public.tenants
for each row execute function public.set_updated_at();

insert into public.tenants (id, name, slug, status, created_at, updated_at)
select
  b.id,
  b.name,
  coalesce(nullif(b.slug, ''), lower(regexp_replace(b.name, '[^a-zA-Z0-9]+', '-', 'g'))),
  case when b.status in ('active', 'trial') then 'active' else 'inactive' end,
  b.created_at,
  coalesce(b.updated_at, b.created_at)
from public.barbershops b
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  status = excluded.status,
  updated_at = timezone('utc', now());

alter table public.users add column if not exists tenant_id uuid;
alter table public.barbers add column if not exists tenant_id uuid;
alter table public.services add column if not exists tenant_id uuid;
alter table public.clients add column if not exists tenant_id uuid;
alter table public.appointments add column if not exists tenant_id uuid;
alter table public.blocked_slots add column if not exists tenant_id uuid;
alter table public.products add column if not exists tenant_id uuid;
alter table public.sales add column if not exists tenant_id uuid;
alter table public.sale_items add column if not exists tenant_id uuid;
alter table public.subscriptions add column if not exists tenant_id uuid;
alter table public.notifications add column if not exists tenant_id uuid;
alter table public.consent_events add column if not exists tenant_id uuid;
alter table public.client_privacy_requests add column if not exists tenant_id uuid;
alter table public.audit_logs add column if not exists tenant_id uuid;

update public.users set tenant_id = coalesce(tenant_id, barbershop_id);
update public.barbers set tenant_id = coalesce(tenant_id, barbershop_id);
update public.services set tenant_id = coalesce(tenant_id, barbershop_id);
update public.clients set tenant_id = coalesce(tenant_id, barbershop_id);
update public.appointments set tenant_id = coalesce(tenant_id, barbershop_id);
update public.blocked_slots set tenant_id = coalesce(tenant_id, barbershop_id);
update public.products set tenant_id = coalesce(tenant_id, barbershop_id);
update public.sales set tenant_id = coalesce(tenant_id, barbershop_id);
update public.sale_items set tenant_id = coalesce(tenant_id, barbershop_id);
update public.subscriptions set tenant_id = coalesce(tenant_id, barbershop_id);
update public.notifications set tenant_id = coalesce(tenant_id, barbershop_id);
update public.consent_events set tenant_id = coalesce(tenant_id, barbershop_id);
update public.client_privacy_requests set tenant_id = coalesce(tenant_id, barbershop_id);
update public.audit_logs set tenant_id = coalesce(tenant_id, barbershop_id);

alter table public.users
  add constraint users_tenant_id_fkey
  foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.barbers
  add constraint barbers_tenant_id_fkey
  foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.services
  add constraint services_tenant_id_fkey
  foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.clients
  add constraint clients_tenant_id_fkey
  foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.appointments
  add constraint appointments_tenant_id_fkey
  foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.blocked_slots
  add constraint blocked_slots_tenant_id_fkey
  foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.products
  add constraint products_tenant_id_fkey
  foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.sales
  add constraint sales_tenant_id_fkey
  foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.sale_items
  add constraint sale_items_tenant_id_fkey
  foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.subscriptions
  add constraint subscriptions_tenant_id_fkey
  foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.notifications
  add constraint notifications_tenant_id_fkey
  foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.consent_events
  add constraint consent_events_tenant_id_fkey
  foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.client_privacy_requests
  add constraint client_privacy_requests_tenant_id_fkey
  foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.audit_logs
  add constraint audit_logs_tenant_id_fkey
  foreign key (tenant_id) references public.tenants(id) on delete set null;

create index if not exists idx_users_tenant_id on public.users(tenant_id);
create index if not exists idx_barbers_tenant_id on public.barbers(tenant_id);
create index if not exists idx_services_tenant_id on public.services(tenant_id);
create index if not exists idx_clients_tenant_id on public.clients(tenant_id);
create index if not exists idx_appointments_tenant_id on public.appointments(tenant_id);
create index if not exists idx_blocked_slots_tenant_id on public.blocked_slots(tenant_id);
create index if not exists idx_products_tenant_id on public.products(tenant_id);
create index if not exists idx_sales_tenant_id on public.sales(tenant_id);
create index if not exists idx_sale_items_tenant_id on public.sale_items(tenant_id);
create index if not exists idx_subscriptions_tenant_id on public.subscriptions(tenant_id);
create index if not exists idx_notifications_tenant_id on public.notifications(tenant_id);
create index if not exists idx_audit_logs_tenant_id on public.audit_logs(tenant_id);

create table if not exists public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  barbershop_name text not null,
  logo_url text,
  branding_primary text not null default '#c69a45',
  branding_secondary text not null default '#0f172a',
  business_hours jsonb not null default '{"monday":{"enabled":true,"open":"09:00","close":"19:00"},"tuesday":{"enabled":true,"open":"09:00","close":"19:00"},"wednesday":{"enabled":true,"open":"09:00","close":"19:00"},"thursday":{"enabled":true,"open":"09:00","close":"19:00"},"friday":{"enabled":true,"open":"09:00","close":"19:00"},"saturday":{"enabled":true,"open":"09:00","close":"17:00"},"sunday":{"enabled":false,"open":"09:00","close":"13:00"}}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_tenant_settings_updated_at on public.tenant_settings;
create trigger trg_tenant_settings_updated_at
before update on public.tenant_settings
for each row execute function public.set_updated_at();

insert into public.tenant_settings (tenant_id, barbershop_name, created_at, updated_at)
select t.id, t.name, t.created_at, t.updated_at
from public.tenants t
on conflict (tenant_id) do update
set
  barbershop_name = excluded.barbershop_name,
  updated_at = timezone('utc', now());

create table if not exists public.tenant_onboarding_requests (
  id uuid primary key default gen_random_uuid(),
  barbershop_name text not null,
  owner_name text not null,
  email text not null,
  phone text not null,
  city text not null,
  state text not null,
  barbers_count integer,
  notes text,
  requested_slug text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  rejection_reason text,
  tenant_id uuid references public.tenants(id) on delete set null,
  created_admin_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_tenant_onboarding_requests_updated_at on public.tenant_onboarding_requests;
create trigger trg_tenant_onboarding_requests_updated_at
before update on public.tenant_onboarding_requests
for each row execute function public.set_updated_at();

create index if not exists idx_tenant_onboarding_requests_status on public.tenant_onboarding_requests(status, created_at desc);
create unique index if not exists idx_tenant_onboarding_requests_pending_email
  on public.tenant_onboarding_requests(lower(email))
  where status = 'pending';

alter table public.tenants enable row level security;
alter table public.tenant_settings enable row level security;
alter table public.tenant_onboarding_requests enable row level security;

drop policy if exists p_tenants_select on public.tenants;
create policy p_tenants_select on public.tenants
for select
using (
  public.is_super_admin()
  or id = public.current_barbershop_id()
);

drop policy if exists p_tenants_all on public.tenants;
create policy p_tenants_all on public.tenants
for all
using (
  public.is_super_admin()
  or id = public.current_barbershop_id()
)
with check (
  public.is_super_admin()
  or id = public.current_barbershop_id()
);

drop policy if exists p_tenant_settings_all on public.tenant_settings;
create policy p_tenant_settings_all on public.tenant_settings
for all
using (
  public.is_super_admin()
  or tenant_id = public.current_barbershop_id()
)
with check (
  public.is_super_admin()
  or tenant_id = public.current_barbershop_id()
);

drop policy if exists p_tenant_onboarding_requests_insert on public.tenant_onboarding_requests;
create policy p_tenant_onboarding_requests_insert on public.tenant_onboarding_requests
for insert
with check (true);

drop policy if exists p_tenant_onboarding_requests_select on public.tenant_onboarding_requests;
create policy p_tenant_onboarding_requests_select on public.tenant_onboarding_requests
for select
using (public.is_super_admin());

drop policy if exists p_tenant_onboarding_requests_update on public.tenant_onboarding_requests;
create policy p_tenant_onboarding_requests_update on public.tenant_onboarding_requests
for update
using (public.is_super_admin())
with check (public.is_super_admin());

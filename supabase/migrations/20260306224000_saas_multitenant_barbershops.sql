-- SaaS multi-tenant schema for barbershops (Supabase/PostgreSQL)
-- Core rule: every operational table carries barbershop_id for tenant isolation.

create extension if not exists pgcrypto;

-- ============================================================================
-- 1) Helper functions
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ============================================================================
-- 2) Core platform tables
-- ============================================================================

create table if not exists public.barbershops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_name text not null,
  email text not null unique,
  phone text not null,
  address text,
  status text not null default 'trial'
    check (status in ('active', 'trial', 'suspended', 'disabled')),
  plan text not null default 'free'
    check (plan in ('free', 'basic', 'pro', 'enterprise')),
  plan_expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_barbershops_updated_at on public.barbershops;
create trigger trg_barbershops_updated_at
before update on public.barbershops
for each row execute function public.set_updated_at();

create index if not exists idx_barbershops_status on public.barbershops(status);
create index if not exists idx_barbershops_plan on public.barbershops(plan);
create index if not exists idx_barbershops_plan_expires_at on public.barbershops(plan_expires_at);

create table if not exists public.super_admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

-- ============================================================================
-- 3) Tenant operational tables
-- ============================================================================

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('admin', 'barber', 'client')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (barbershop_id, email),
  unique (barbershop_id, id)
);

create index if not exists idx_users_barbershop_id on public.users(barbershop_id);
create index if not exists idx_users_role on public.users(role);

create table if not exists public.barbers (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  name text not null,
  phone text,
  photo_url text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (barbershop_id, id)
);

create index if not exists idx_barbers_barbershop_id on public.barbers(barbershop_id);
create index if not exists idx_barbers_active on public.barbers(active);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10,2) not null check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (barbershop_id, id)
);

create index if not exists idx_services_barbershop_id on public.services(barbershop_id);
create index if not exists idx_services_active on public.services(active);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  birthday date,
  created_at timestamptz not null default timezone('utc', now()),
  unique (barbershop_id, id)
);

create index if not exists idx_clients_barbershop_id on public.clients(barbershop_id);
create unique index if not exists idx_clients_barbershop_email_unique
  on public.clients(barbershop_id, lower(email))
  where email is not null;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  client_id uuid not null,
  barber_id uuid not null,
  service_id uuid not null,
  appointment_date timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint fk_appointments_client
    foreign key (barbershop_id, client_id)
    references public.clients(barbershop_id, id)
    on delete restrict,
  constraint fk_appointments_barber
    foreign key (barbershop_id, barber_id)
    references public.barbers(barbershop_id, id)
    on delete restrict,
  constraint fk_appointments_service
    foreign key (barbershop_id, service_id)
    references public.services(barbershop_id, id)
    on delete restrict
);

create index if not exists idx_appointments_barbershop_id on public.appointments(barbershop_id);
create index if not exists idx_appointments_date on public.appointments(appointment_date);
create index if not exists idx_appointments_status on public.appointments(status);
create index if not exists idx_appointments_barber_date on public.appointments(barbershop_id, barber_id, appointment_date);

create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  barber_id uuid not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  reason text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint chk_blocked_slots_time check (end_time > start_time),
  constraint fk_blocked_slots_barber
    foreign key (barbershop_id, barber_id)
    references public.barbers(barbershop_id, id)
    on delete cascade
);

create index if not exists idx_blocked_slots_barbershop_id on public.blocked_slots(barbershop_id);
create index if not exists idx_blocked_slots_barber_time on public.blocked_slots(barbershop_id, barber_id, start_time, end_time);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (barbershop_id, id)
);

create index if not exists idx_products_barbershop_id on public.products(barbershop_id);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  client_id uuid,
  total_price numeric(10,2) not null check (total_price >= 0),
  payment_method text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (barbershop_id, id),
  constraint fk_sales_client
    foreign key (barbershop_id, client_id)
    references public.clients(barbershop_id, id)
    on delete set null
);

create index if not exists idx_sales_barbershop_id on public.sales(barbershop_id);
create index if not exists idx_sales_created_at on public.sales(created_at);

-- NOTE: barbershop_id is intentionally included here to preserve tenant isolation.
create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  sale_id uuid not null,
  product_id uuid not null,
  quantity integer not null check (quantity > 0),
  price numeric(10,2) not null check (price >= 0),
  constraint fk_sale_items_sale
    foreign key (barbershop_id, sale_id)
    references public.sales(barbershop_id, id)
    on delete cascade,
  constraint fk_sale_items_product
    foreign key (barbershop_id, product_id)
    references public.products(barbershop_id, id)
    on delete restrict
);

create index if not exists idx_sale_items_barbershop_id on public.sale_items(barbershop_id);
create index if not exists idx_sale_items_sale_id on public.sale_items(sale_id);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  plan text not null check (plan in ('free', 'basic', 'pro', 'enterprise')),
  status text not null check (status in ('active', 'trial', 'suspended', 'disabled')),
  started_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_subscriptions_barbershop_id on public.subscriptions(barbershop_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_expires_at on public.subscriptions(expires_at);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  client_id uuid not null,
  type text not null,
  message text not null,
  sent_at timestamptz not null default timezone('utc', now()),
  constraint fk_notifications_client
    foreign key (barbershop_id, client_id)
    references public.clients(barbershop_id, id)
    on delete cascade
);

create index if not exists idx_notifications_barbershop_id on public.notifications(barbershop_id);
create index if not exists idx_notifications_sent_at on public.notifications(sent_at);

-- ============================================================================
-- 4) Auth context helper functions (depends on users/super_admins)
-- ============================================================================

create or replace function public.current_barbershop_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.barbershop_id
  from public.users u
  where u.id = auth.uid()
  limit 1;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.super_admins sa
    where sa.id = auth.uid()
  );
$$;

grant execute on function public.current_barbershop_id() to authenticated;
grant execute on function public.is_super_admin() to authenticated;

-- ============================================================================
-- 5) RLS baseline
-- ============================================================================

alter table public.super_admins enable row level security;
alter table public.barbershops enable row level security;
alter table public.users enable row level security;
alter table public.barbers enable row level security;
alter table public.services enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;

-- super_admins
drop policy if exists p_super_admins_select on public.super_admins;
create policy p_super_admins_select on public.super_admins
for select
using (id = auth.uid() or public.is_super_admin());

drop policy if exists p_super_admins_all on public.super_admins;
create policy p_super_admins_all on public.super_admins
for all
using (public.is_super_admin())
with check (public.is_super_admin());

-- barbershops
drop policy if exists p_barbershops_select on public.barbershops;
create policy p_barbershops_select on public.barbershops
for select
using (public.is_super_admin() or id = public.current_barbershop_id());

drop policy if exists p_barbershops_insert on public.barbershops;
create policy p_barbershops_insert on public.barbershops
for insert
with check (public.is_super_admin());

drop policy if exists p_barbershops_update on public.barbershops;
create policy p_barbershops_update on public.barbershops
for update
using (public.is_super_admin() or id = public.current_barbershop_id())
with check (public.is_super_admin() or id = public.current_barbershop_id());

drop policy if exists p_barbershops_delete on public.barbershops;
create policy p_barbershops_delete on public.barbershops
for delete
using (public.is_super_admin());

-- generic tenant policies (super admin OR same barbershop)
drop policy if exists p_users_select on public.users;
create policy p_users_select on public.users
for select
using (public.is_super_admin() or barbershop_id = public.current_barbershop_id());

drop policy if exists p_users_insert on public.users;
create policy p_users_insert on public.users
for insert
with check (public.is_super_admin() or barbershop_id = public.current_barbershop_id());

drop policy if exists p_users_update on public.users;
create policy p_users_update on public.users
for update
using (public.is_super_admin() or barbershop_id = public.current_barbershop_id())
with check (public.is_super_admin() or barbershop_id = public.current_barbershop_id());

drop policy if exists p_users_delete on public.users;
create policy p_users_delete on public.users
for delete
using (public.is_super_admin() or barbershop_id = public.current_barbershop_id());

drop policy if exists p_barbers_all on public.barbers;
create policy p_barbers_all on public.barbers
for all
using (public.is_super_admin() or barbershop_id = public.current_barbershop_id())
with check (public.is_super_admin() or barbershop_id = public.current_barbershop_id());

drop policy if exists p_services_all on public.services;
create policy p_services_all on public.services
for all
using (public.is_super_admin() or barbershop_id = public.current_barbershop_id())
with check (public.is_super_admin() or barbershop_id = public.current_barbershop_id());

drop policy if exists p_clients_all on public.clients;
create policy p_clients_all on public.clients
for all
using (public.is_super_admin() or barbershop_id = public.current_barbershop_id())
with check (public.is_super_admin() or barbershop_id = public.current_barbershop_id());

drop policy if exists p_appointments_all on public.appointments;
create policy p_appointments_all on public.appointments
for all
using (public.is_super_admin() or barbershop_id = public.current_barbershop_id())
with check (public.is_super_admin() or barbershop_id = public.current_barbershop_id());

drop policy if exists p_blocked_slots_all on public.blocked_slots;
create policy p_blocked_slots_all on public.blocked_slots
for all
using (public.is_super_admin() or barbershop_id = public.current_barbershop_id())
with check (public.is_super_admin() or barbershop_id = public.current_barbershop_id());

drop policy if exists p_products_all on public.products;
create policy p_products_all on public.products
for all
using (public.is_super_admin() or barbershop_id = public.current_barbershop_id())
with check (public.is_super_admin() or barbershop_id = public.current_barbershop_id());

drop policy if exists p_sales_all on public.sales;
create policy p_sales_all on public.sales
for all
using (public.is_super_admin() or barbershop_id = public.current_barbershop_id())
with check (public.is_super_admin() or barbershop_id = public.current_barbershop_id());

drop policy if exists p_sale_items_all on public.sale_items;
create policy p_sale_items_all on public.sale_items
for all
using (public.is_super_admin() or barbershop_id = public.current_barbershop_id())
with check (public.is_super_admin() or barbershop_id = public.current_barbershop_id());

drop policy if exists p_subscriptions_all on public.subscriptions;
create policy p_subscriptions_all on public.subscriptions
for all
using (public.is_super_admin() or barbershop_id = public.current_barbershop_id())
with check (public.is_super_admin() or barbershop_id = public.current_barbershop_id());

drop policy if exists p_notifications_all on public.notifications;
create policy p_notifications_all on public.notifications
for all
using (public.is_super_admin() or barbershop_id = public.current_barbershop_id())
with check (public.is_super_admin() or barbershop_id = public.current_barbershop_id());

-- Optional hardening (service_role bypasses RLS automatically)
revoke all on table public.super_admins from anon;
revoke all on table public.barbershops from anon;
revoke all on table public.users from anon;
revoke all on table public.barbers from anon;
revoke all on table public.services from anon;
revoke all on table public.clients from anon;
revoke all on table public.appointments from anon;
revoke all on table public.blocked_slots from anon;
revoke all on table public.products from anon;
revoke all on table public.sales from anon;
revoke all on table public.sale_items from anon;
revoke all on table public.subscriptions from anon;
revoke all on table public.notifications from anon;

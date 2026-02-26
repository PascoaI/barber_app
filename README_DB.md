# Banco de dados (FASE 2 – SaaS Ready)

Este front-end funciona com `localStorage`, mas já está modelado para backend real com Supabase/Postgres.

## Módulos cobertos no modelo
- Multi-unidade e multi-tenant
- RBAC (`client`, `barber`, `admin`, `super_admin`)
- Agenda avançada com status e pré-pagamento
- Bloqueio manual de horários
- Financeiro e comissão
- Fidelização
- Estoque
- Assinaturas de clientes
- Notificações
- Reviews
- Auditoria

## SQL recomendado (Supabase/Postgres)

```sql
create table if not exists tenants (
  id text primary key,
  name text not null,
  subscription_plan_id text,
  subscription_status text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists platform_plans (
  id text primary key,
  name text not null,
  max_units int not null,
  max_barbers int not null,
  analytics_enabled boolean default true,
  loyalty_enabled boolean default true,
  stock_enabled boolean default true,
  subscription_enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists units (
  id text primary key,
  tenant_id text not null,
  name text not null,
  city text,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists unit_settings (
  unit_id text primary key,
  opening_time time not null,
  closing_time time not null,
  slot_interval_minutes int not null,
  cancellation_limit_hours int not null,
  loyalty_enabled boolean default true,
  prepayment_enabled boolean default false,
  no_show_block_days int default 2,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists users (
  id bigint generated always as identity primary key,
  unit_id text not null,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('client','barber','admin','super_admin')),
  full_name text not null,
  blocked_until timestamptz,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists barbers (
  id text primary key,
  unit_id text not null,
  name text not null,
  commission_percentage numeric not null default 40,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists services (
  id text primary key,
  unit_id text not null,
  name text not null,
  duration_minutes int not null,
  price numeric not null,
  barber_id text,
  requires_pre_payment boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists blocked_slots (
  id text primary key,
  unit_id text not null,
  barber_id text not null,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists appointments (
  id text primary key,
  tenant_id text,
  unit_id text not null,
  client_email text,
  client_name text,
  service_id text not null,
  service_name text not null,
  service_price numeric not null,
  duration_minutes int not null,
  barber_id text,
  barber_name text,
  city text,
  branch text,
  address text,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  status text not null check (status in ('awaiting_payment','pending','confirmed','canceled','completed','no_show')),
  requires_pre_payment boolean default false,
  payment_due_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  updated_by text,
  deleted_at timestamptz
);

create table if not exists payments (
  id text primary key,
  unit_id text not null,
  appointment_id text not null,
  payment_method text not null check (payment_method in ('cash','pix','card')),
  amount numeric not null,
  paid_at timestamptz,
  status text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists commissions (
  id text primary key,
  unit_id text not null,
  barber_id text not null,
  appointment_id text not null,
  commission_amount numeric not null,
  calculated_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists products (
  id text primary key,
  unit_id text not null,
  name text not null,
  quantity numeric not null,
  minimum_stock numeric not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists product_movements (
  id text primary key,
  unit_id text not null,
  product_id text not null,
  type text not null check (type in ('in','out')),
  quantity numeric not null,
  reason text,
  related_appointment_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists subscription_plans (
  id text primary key,
  unit_id text not null,
  name text not null,
  price numeric not null,
  sessions_per_month int not null,
  duration_days int not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists subscriptions (
  id text primary key,
  unit_id text not null,
  user_id text not null,
  plan_id text not null,
  remaining_sessions int not null,
  expires_at timestamptz not null,
  status text not null check (status in ('active','expired','canceled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists loyalty_points (
  unit_id text not null,
  user_id text not null,
  points_balance int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (unit_id, user_id)
);

create table if not exists loyalty_transactions (
  id text primary key,
  unit_id text not null,
  user_id text not null,
  appointment_id text,
  points_earned int not null default 0,
  points_used int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists reviews (
  id text primary key,
  unit_id text not null,
  appointment_id text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists notifications (
  id text primary key,
  unit_id text not null,
  user_id text,
  type text not null check (type in ('confirmation','reminder','cancellation')),
  status text not null check (status in ('pending','sent','failed')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  related_appointment_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  tenant_id text,
  unit_id text,
  actor_email text,
  action text not null,
  entity_type text,
  entity_id text,
  payload jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_appointments_date on appointments (appointment_date);
create index if not exists idx_appointments_barber on appointments (barber_id);
create index if not exists idx_appointments_unit on appointments (unit_id);
create index if not exists idx_appointments_status on appointments (status);
create index if not exists idx_notifications_unit on notifications (unit_id);
create index if not exists idx_barbers_unit on barbers (unit_id);
create index if not exists idx_products_unit on products (unit_id);
create index if not exists idx_units_tenant on units (tenant_id);
```

## Integração opcional
No `script.js`, preencher `DB_CONFIG.supabaseUrl` e `DB_CONFIG.supabaseAnonKey`.

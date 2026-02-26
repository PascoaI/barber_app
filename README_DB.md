# Banco de dados (SaaS-ready) — Supabase Free

Este projeto já está preparado para operar em `localStorage`, mas a estrutura abaixo deixa pronto para usar Supabase Free com multi-unidade, RBAC e auditoria.

## 1) Criar projeto no Supabase
- https://supabase.com
- Criar projeto free.

## 2) Executar SQL base

```sql
create table if not exists units (
  id text primary key,
  name text not null,
  city text,
  address text,
  created_at timestamptz default now()
);

create table if not exists users (
  id bigint generated always as identity primary key,
  unit_id text not null,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('client','barber','admin','super_admin')),
  full_name text not null,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists barbers (
  id text primary key,
  unit_id text not null,
  name text not null,
  commission_percentage numeric not null default 40,
  active boolean default true,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists services (
  id text primary key,
  unit_id text not null,
  name text not null,
  duration_minutes int not null,
  price numeric not null,
  barber_id text,
  created_at timestamptz default now(),
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
  created_by text,
  deleted_at timestamptz
);

create table if not exists appointments (
  id text primary key,
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
  status text not null check (status in ('pending','confirmed','canceled','completed','no_show')),
  created_at timestamptz default now(),
  created_by text,
  updated_at timestamptz,
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
  status text not null
);

create table if not exists commissions (
  id text primary key,
  unit_id text not null,
  barber_id text not null,
  appointment_id text not null,
  commission_amount numeric not null,
  calculated_at timestamptz not null
);

create table if not exists loyalty_points (
  unit_id text not null,
  user_id text not null,
  points_balance int not null default 0,
  primary key (unit_id, user_id)
);

create table if not exists loyalty_transactions (
  id text primary key,
  unit_id text not null,
  user_id text not null,
  appointment_id text,
  points_earned int not null default 0,
  points_used int not null default 0,
  created_at timestamptz default now()
);

create table if not exists reviews (
  id text primary key,
  unit_id text not null,
  appointment_id text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id bigint generated always as identity primary key,
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
```

## 3) Configurar integração opcional
No `script.js` preencha `DB_CONFIG.supabaseUrl` e `DB_CONFIG.supabaseAnonKey`.

## Permissões de agenda
- `admin`/`super_admin`: visualizam todos os agendamentos da unidade.
- `barber`: visualiza apenas sua própria agenda (`barber_id`).
- `client`: visualiza apenas seus próprios agendamentos.

## Fidelização
- Regra atual: **1 ponto por R$1** em agendamento `completed`.
- Conversão sugerida: **100 pontos = 1 corte grátis**.

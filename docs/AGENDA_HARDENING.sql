-- Agenda hardening helpers (PostgreSQL / Supabase)
-- 1) Idempotency per tenant + unit
create unique index if not exists appointments_tenant_unit_idempotency_uq
  on public.appointments (tenant_id, unit_id, idempotency_key)
  where idempotency_key is not null;

-- 2) No overlapping active appointments per barber (pending/confirmed/awaiting_payment)
create extension if not exists btree_gist;

alter table public.appointments
  add constraint appointments_no_overlap_active
  exclude using gist (
    tenant_id with =,
    unit_id with =,
    barber_id with =,
    tstzrange(start_datetime, end_datetime, '[)') with &&
  )
  where (status in ('awaiting_payment', 'pending', 'confirmed'));

-- 3) Basic data integrity in UTC timestamps
alter table public.appointments
  add constraint appointments_valid_range_chk
  check (end_datetime > start_datetime);

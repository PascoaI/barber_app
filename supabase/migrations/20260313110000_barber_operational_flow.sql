-- Barber operational flow hardening
-- Adds operational columns and expands appointment status states.

alter table public.appointments
  add column if not exists status_reason text,
  add column if not exists delay_minutes integer,
  add column if not exists delay_reason text,
  add column if not exists transferred_from_barber_id uuid,
  add column if not exists transferred_to_barber_id uuid,
  add column if not exists rescheduled_from timestamptz,
  add column if not exists rescheduled_by text;

do $$
declare
  r record;
begin
  -- Existing databases may have different check-constraint names for status.
  -- Drop only check constraints that mention "status" on appointments.
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'appointments'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%status%'
  loop
    execute format('alter table public.appointments drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table public.appointments
  add constraint appointments_status_check
  check (
    status in (
      'scheduled',
      'awaiting_payment',
      'pending',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled',
      'canceled',
      'no_show'
    )
  );

alter table public.appointments
  add constraint appointments_delay_minutes_check
  check (delay_minutes is null or delay_minutes >= 0);

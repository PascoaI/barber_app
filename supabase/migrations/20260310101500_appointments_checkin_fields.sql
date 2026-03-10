alter table public.appointments
  add column if not exists check_in_time timestamptz,
  add column if not exists check_in_by text,
  add column if not exists service_completed_at timestamptz;

create index if not exists idx_appointments_check_in_time
  on public.appointments(check_in_time);

create index if not exists idx_appointments_service_completed_at
  on public.appointments(service_completed_at);

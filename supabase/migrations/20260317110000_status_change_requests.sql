-- Status change requests workflow (barber -> admin approval)

create table if not exists public.status_change_requests (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  barber_id uuid,
  barber_name text,
  barber_email text,
  client_id uuid,
  client_name text,
  client_email text,
  current_status text not null,
  requested_status text not null,
  reason text,
  requested_by_user_id uuid,
  requested_at timestamptz not null default now(),
  status text not null default 'pending',
  reviewed_by_user_id uuid,
  reviewed_by_name text,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint status_change_requests_status_check check (status in ('pending', 'approved', 'rejected')),
  constraint status_change_requests_requested_status_check check (requested_status in ('confirmed', 'no_show', 'canceled'))
);

create index if not exists idx_status_change_requests_barbershop on public.status_change_requests (barbershop_id, status, requested_at desc);
create index if not exists idx_status_change_requests_appointment on public.status_change_requests (appointment_id);

alter table public.status_change_requests enable row level security;

drop policy if exists status_change_requests_select_same_barbershop on public.status_change_requests;
create policy status_change_requests_select_same_barbershop
  on public.status_change_requests
  for select
  using (
    barbershop_id in (
      select u.barbershop_id
      from public.users u
      where u.id = auth.uid()
    )
  );

drop policy if exists status_change_requests_insert_barber on public.status_change_requests;
create policy status_change_requests_insert_barber
  on public.status_change_requests
  for insert
  with check (
    barbershop_id in (
      select u.barbershop_id
      from public.users u
      where u.id = auth.uid()
        and u.role in ('barber', 'admin', 'super_admin')
    )
  );

drop policy if exists status_change_requests_update_admin on public.status_change_requests;
create policy status_change_requests_update_admin
  on public.status_change_requests
  for update
  using (
    barbershop_id in (
      select u.barbershop_id
      from public.users u
      where u.id = auth.uid()
        and u.role in ('admin', 'super_admin')
    )
  )
  with check (
    barbershop_id in (
      select u.barbershop_id
      from public.users u
      where u.id = auth.uid()
        and u.role in ('admin', 'super_admin')
    )
  );

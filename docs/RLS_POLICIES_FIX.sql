-- Users: permitir update apenas no próprio registro
alter table public.users enable row level security;

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Unit settings: admin/super_admin só da própria unidade
alter table public.unit_settings enable row level security;

drop policy if exists "unit_settings_update_by_unit_admin" on public.unit_settings;
create policy "unit_settings_update_by_unit_admin"
on public.unit_settings
for update
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.unit_id = unit_settings.unit_id
      and u.role in ('admin', 'super_admin')
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.unit_id = unit_settings.unit_id
      and u.role in ('admin', 'super_admin')
  )
);

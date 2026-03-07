-- Seed V2 (idempotent) for SaaS multi-tenant schema.
-- Creates a trial barbershop and demo operational records.
-- If matching auth users already exist, it also links:
--   - 1 superadmin  -> public.super_admins
--   - 1 admin user  -> public.users (role=admin)

do $$
declare
  v_barbershop_id uuid := '11111111-1111-1111-1111-111111111111';
  v_subscription_id uuid := '21111111-1111-1111-1111-111111111111';
  v_barber_id uuid := '31111111-1111-1111-1111-111111111111';
  v_service_id uuid := '41111111-1111-1111-1111-111111111111';
  v_client_id uuid := '51111111-1111-1111-1111-111111111111';
  v_product_id uuid := '61111111-1111-1111-1111-111111111111';
  v_super_admin_auth_id uuid;
  v_admin_auth_id uuid;
begin
  -- 1) Demo tenant (trial)
  insert into public.barbershops (
    id,
    name,
    owner_name,
    email,
    phone,
    address,
    status,
    plan,
    plan_expires_at
  ) values (
    v_barbershop_id,
    'Barbearia Demo Tenant',
    'Owner Demo',
    'tenant.demo@barberpro.app',
    '(11) 99999-0000',
    'Rua Demo, 100 - Sao Paulo, SP',
    'trial',
    'basic',
    timezone('utc', now()) + interval '14 days'
  )
  on conflict (id) do update
  set
    name = excluded.name,
    owner_name = excluded.owner_name,
    email = excluded.email,
    phone = excluded.phone,
    address = excluded.address,
    status = excluded.status,
    plan = excluded.plan,
    plan_expires_at = excluded.plan_expires_at;

  -- 2) Subscription snapshot for the tenant
  insert into public.subscriptions (
    id,
    barbershop_id,
    plan,
    status,
    started_at,
    expires_at
  ) values (
    v_subscription_id,
    v_barbershop_id,
    'basic',
    'trial',
    timezone('utc', now()),
    timezone('utc', now()) + interval '14 days'
  )
  on conflict (id) do update
  set
    barbershop_id = excluded.barbershop_id,
    plan = excluded.plan,
    status = excluded.status,
    started_at = excluded.started_at,
    expires_at = excluded.expires_at;

  -- 3) Operational demo records
  insert into public.barbers (
    id,
    barbershop_id,
    name,
    phone,
    active
  ) values (
    v_barber_id,
    v_barbershop_id,
    'Barbeiro Demo',
    '(11) 98888-0000',
    true
  )
  on conflict (id) do update
  set
    barbershop_id = excluded.barbershop_id,
    name = excluded.name,
    phone = excluded.phone,
    active = excluded.active;

  insert into public.services (
    id,
    barbershop_id,
    name,
    description,
    duration_minutes,
    price,
    active
  ) values (
    v_service_id,
    v_barbershop_id,
    'Corte Demo',
    'Servico de demonstracao para ambiente SaaS',
    45,
    79.90,
    true
  )
  on conflict (id) do update
  set
    barbershop_id = excluded.barbershop_id,
    name = excluded.name,
    description = excluded.description,
    duration_minutes = excluded.duration_minutes,
    price = excluded.price,
    active = excluded.active;

  insert into public.clients (
    id,
    barbershop_id,
    name,
    phone,
    email
  ) values (
    v_client_id,
    v_barbershop_id,
    'Cliente Demo',
    '(11) 97777-0000',
    'cliente.demo@barberpro.app'
  )
  on conflict (id) do update
  set
    barbershop_id = excluded.barbershop_id,
    name = excluded.name,
    phone = excluded.phone,
    email = excluded.email;

  insert into public.products (
    id,
    barbershop_id,
    name,
    price,
    stock_quantity
  ) values (
    v_product_id,
    v_barbershop_id,
    'Pomada Demo',
    39.90,
    25
  )
  on conflict (id) do update
  set
    barbershop_id = excluded.barbershop_id,
    name = excluded.name,
    price = excluded.price,
    stock_quantity = excluded.stock_quantity;

  -- 4) SuperAdmin seed (only if auth user already exists)
  select id
  into v_super_admin_auth_id
  from auth.users
  where lower(email) = 'superadmin@barberpro.app'
  limit 1;

  if v_super_admin_auth_id is not null then
    insert into public.super_admins (id, email)
    values (v_super_admin_auth_id, 'superadmin@barberpro.app')
    on conflict (id) do update
    set email = excluded.email;
  end if;

  -- 5) Admin seed (only if auth user already exists)
  select id
  into v_admin_auth_id
  from auth.users
  where lower(email) = 'admin.demo@barberpro.app'
  limit 1;

  if v_admin_auth_id is not null then
    insert into public.users (
      id,
      barbershop_id,
      name,
      email,
      role
    ) values (
      v_admin_auth_id,
      v_barbershop_id,
      'Admin Demo',
      'admin.demo@barberpro.app',
      'admin'
    )
    on conflict (id) do update
    set
      barbershop_id = excluded.barbershop_id,
      name = excluded.name,
      email = excluded.email,
      role = excluded.role;
  end if;
end $$;

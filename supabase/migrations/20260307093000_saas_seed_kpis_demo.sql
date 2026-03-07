-- Seed V3: transactional demo data for dashboards/KPIs (idempotent).
-- Depends on seed V2 tenant ids.

do $$
declare
  v_barbershop_id uuid := '11111111-1111-1111-1111-111111111111';
  v_barber_id uuid := '31111111-1111-1111-1111-111111111111';
  v_service_id uuid := '41111111-1111-1111-1111-111111111111';
  v_client_id uuid := '51111111-1111-1111-1111-111111111111';
  v_product_id uuid := '61111111-1111-1111-1111-111111111111';

  v_appointment_1 uuid := '71111111-1111-1111-1111-111111111111';
  v_appointment_2 uuid := '71111111-1111-1111-1111-111111111112';
  v_appointment_3 uuid := '71111111-1111-1111-1111-111111111113';
  v_appointment_4 uuid := '71111111-1111-1111-1111-111111111114';

  v_sale_1 uuid := '81111111-1111-1111-1111-111111111111';
  v_sale_2 uuid := '81111111-1111-1111-1111-111111111112';
  v_sale_item_1 uuid := '91111111-1111-1111-1111-111111111111';
  v_sale_item_2 uuid := '91111111-1111-1111-1111-111111111112';

  v_blocked_slot uuid := 'a1111111-1111-1111-1111-111111111111';
  v_notification_1 uuid := 'b1111111-1111-1111-1111-111111111111';
  v_notification_2 uuid := 'b1111111-1111-1111-1111-111111111112';

  v_now timestamptz := timezone('utc', now());
  v_has_base_data boolean;
begin
  select exists (
    select 1
    from public.barbershops bs
    where bs.id = v_barbershop_id
  )
  and exists (select 1 from public.barbers b where b.id = v_barber_id and b.barbershop_id = v_barbershop_id)
  and exists (select 1 from public.services s where s.id = v_service_id and s.barbershop_id = v_barbershop_id)
  and exists (select 1 from public.clients c where c.id = v_client_id and c.barbershop_id = v_barbershop_id)
  and exists (select 1 from public.products p where p.id = v_product_id and p.barbershop_id = v_barbershop_id)
  into v_has_base_data;

  if not v_has_base_data then
    raise notice 'Seed V3 skipped: execute seed V2 first (base tenant records missing).';
    return;
  end if;

  -- Appointments timeline: scheduled, completed, cancelled, no_show
  insert into public.appointments (
    id, barbershop_id, client_id, barber_id, service_id, appointment_date, status, notes
  ) values
    (v_appointment_1, v_barbershop_id, v_client_id, v_barber_id, v_service_id, date_trunc('day', v_now) + interval '2 hour', 'scheduled', 'Agendamento futuro para demo'),
    (v_appointment_2, v_barbershop_id, v_client_id, v_barber_id, v_service_id, date_trunc('day', v_now) - interval '1 day' + interval '4 hour', 'completed', 'Atendimento concluido'),
    (v_appointment_3, v_barbershop_id, v_client_id, v_barber_id, v_service_id, date_trunc('day', v_now) - interval '2 day' + interval '3 hour', 'cancelled', 'Cancelado pelo cliente'),
    (v_appointment_4, v_barbershop_id, v_client_id, v_barber_id, v_service_id, date_trunc('day', v_now) - interval '3 day' + interval '2 hour', 'no_show', 'Cliente nao compareceu')
  on conflict (id) do update
  set
    barbershop_id = excluded.barbershop_id,
    client_id = excluded.client_id,
    barber_id = excluded.barber_id,
    service_id = excluded.service_id,
    appointment_date = excluded.appointment_date,
    status = excluded.status,
    notes = excluded.notes;

  -- Blocked slot (e.g., lunch break)
  insert into public.blocked_slots (
    id, barbershop_id, barber_id, start_time, end_time, reason
  ) values (
    v_blocked_slot,
    v_barbershop_id,
    v_barber_id,
    date_trunc('day', v_now) + interval '12 hour',
    date_trunc('day', v_now) + interval '13 hour',
    'Horario de almoco (demo)'
  )
  on conflict (id) do update
  set
    barbershop_id = excluded.barbershop_id,
    barber_id = excluded.barber_id,
    start_time = excluded.start_time,
    end_time = excluded.end_time,
    reason = excluded.reason;

  -- Sales
  insert into public.sales (
    id, barbershop_id, client_id, total_price, payment_method, created_at
  ) values
    (v_sale_1, v_barbershop_id, v_client_id, 79.90, 'pix', v_now - interval '1 day'),
    (v_sale_2, v_barbershop_id, v_client_id, 119.80, 'credit_card', v_now - interval '2 day')
  on conflict (id) do update
  set
    barbershop_id = excluded.barbershop_id,
    client_id = excluded.client_id,
    total_price = excluded.total_price,
    payment_method = excluded.payment_method,
    created_at = excluded.created_at;

  insert into public.sale_items (
    id, barbershop_id, sale_id, product_id, quantity, price
  ) values
    (v_sale_item_1, v_barbershop_id, v_sale_1, v_product_id, 1, 39.90),
    (v_sale_item_2, v_barbershop_id, v_sale_2, v_product_id, 2, 39.90)
  on conflict (id) do update
  set
    barbershop_id = excluded.barbershop_id,
    sale_id = excluded.sale_id,
    product_id = excluded.product_id,
    quantity = excluded.quantity,
    price = excluded.price;

  -- Notifications
  insert into public.notifications (
    id, barbershop_id, client_id, type, message, sent_at
  ) values
    (v_notification_1, v_barbershop_id, v_client_id, 'reminder', 'Lembrete: voce tem horario marcado hoje.', v_now - interval '2 hour'),
    (v_notification_2, v_barbershop_id, v_client_id, 'promotion', 'Promo demo: 10% de desconto em produtos selecionados.', v_now - interval '1 day')
  on conflict (id) do update
  set
    barbershop_id = excluded.barbershop_id,
    client_id = excluded.client_id,
    type = excluded.type,
    message = excluded.message,
    sent_at = excluded.sent_at;
end $$;

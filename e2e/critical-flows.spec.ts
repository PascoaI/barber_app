import { expect, test } from '@playwright/test';

async function login(page: any, email: string, password: string) {
  await page.goto('/login.html');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
}

test('login + permissoes por perfil', async ({ page }) => {
  await page.goto('/admin-home.html');
  await expect(page).toHaveURL(/login\.html(\?.*)?$/);

  await login(page, 'cliente@barber.com', '123456');
  await expect(page).toHaveURL(/client-home\.html$/);

  await page.goto('/admin-home.html');
  await expect(page).toHaveURL(/client-home\.html$/);
});

test('agendamento completo e cancelamento via interface', async ({ page }) => {
  await login(page, 'cliente@barber.com', '123456');
  await expect(page).toHaveURL(/client-home\.html$/);

  await page.goto('/booking-location.html');
  await page.selectOption('#city', { index: 1 });
  await page.selectOption('#branch', { index: 1 });
  await page.click('#location-form button[type="submit"]');
  await expect(page).toHaveURL(/booking-service\.html$/);

  await page.locator('#services-grid .service-card').first().click();
  await page.click('#service-next');
  await expect(page).toHaveURL(/booking-professional\.html$/);

  await page.locator('#professionals-grid .pro-card').first().click();
  await page.click('#professional-next');
  await expect(page).toHaveURL(/booking-datetime\.html$/);

  const totalDateOptions = await page.locator('#date option').count();
  let slotSelected = false;
  for (let optionIndex = totalDateOptions - 1; optionIndex >= 1; optionIndex -= 1) {
    await page.selectOption('#date', { index: optionIndex });
    await page.waitForTimeout(150);
    const availableSlots = page.locator('#time-grid .time-slot:not(:disabled)');
    if ((await availableSlots.count()) > 0) {
      await availableSlots.first().click();
      slotSelected = true;
      break;
    }
  }
  expect(slotSelected).toBeTruthy();
  await page.click('#confirm-booking');
  await expect(page).toHaveURL(/booking-review\.html$/);

  await page.click('#review-action');
  await expect(page.locator('#booking-success-modal')).toHaveClass(/is-open/);
  await page.click('#booking-success-home');
  await expect(page).toHaveURL(/client-home\.html$/);

  await page.goto('/my-schedules.html');
  const cancelButton = page.locator('[data-cancel]').first();
  await expect(cancelButton).toBeVisible();
  const canceledAppointmentId = await cancelButton.getAttribute('data-cancel');
  await cancelButton.click();
  await page.click('[data-modal-confirm]');
  await page.reload();
  await expect(page.locator(`[data-cancel="${canceledAppointmentId}"]`)).toHaveCount(0);
});

test('no-show automatico para agendamento confirmado no passado', async ({ page }) => {
  await page.addInitScript(() => {
    const now = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + 30 * 60 * 1000);
    const appointmentDate = now.toISOString().slice(0, 10);
    const startTime = now.toTimeString().slice(0, 5);
    const endTime = end.toTimeString().slice(0, 5);

    localStorage.setItem('barberpro_session', JSON.stringify({
      email: 'admin@barber.com',
      role: 'admin',
      name: 'Administrador',
      barberId: null,
      unit_id: 'unit_bom_fim',
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    }));

    localStorage.setItem('barberpro_appointments', JSON.stringify([{
      id: `apt_no_show_${Date.now()}`,
      unit_id: 'unit_bom_fim',
      tenant_id: 'tenant_barberpro_demo',
      client_email: 'cliente@barber.com',
      client_name: 'Cliente',
      service_id: 'corte',
      service_name: 'Corte',
      service_price: 72,
      duration_minutes: 30,
      barber_id: 'pedro',
      barber_name: 'Pedro',
      city: 'Porto Alegre',
      branch: 'Bom Fim',
      appointment_date: appointmentDate,
      start_time: startTime,
      end_time: endTime,
      start_datetime: now.toISOString(),
      end_datetime: end.toISOString(),
      status: 'confirmed',
      requires_pre_payment: false,
      payment_due_at: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      created_by: 'admin@barber.com',
      updated_by: 'admin@barber.com',
      idempotency_key: `idem_no_show_${Date.now()}`
    }]));
    localStorage.setItem('barberpro_payments', JSON.stringify([]));
  });

  await page.goto('/admin-schedules.html');
  await expect(page.locator('.status-badge')).toContainText('no_show');
});

test('cobranca/assinatura via fluxo de planos', async ({ page }) => {
  await login(page, 'cliente@barber.com', '123456');
  await expect(page).toHaveURL(/client-home\.html$/);

  await page.goto('/client-subscriptions.html');
  const subscribe = page.locator('[data-subscribe]').first();
  await expect(subscribe).toBeVisible();
  await subscribe.click();
  await page.click('[data-modal-confirm]');

  await expect(page.locator('text=Assinatura ativa')).toBeVisible();
});

test('login rapido por dica clicavel', async ({ page }) => {
  await page.goto('/login.html');
  const hint = page.locator('[data-login-email="cliente@barber.com"]');
  await expect(hint).toBeVisible();
  await hint.click();
  await expect(page).toHaveURL(/client-home\.html$/);
});

test('barber home aplica filtro de data e conclui servico', async ({ page }) => {
  await page.addInitScript(() => {
    const now = new Date();
    const today = new Date(now.getTime() + 60 * 60 * 1000);
    today.setSeconds(0, 0);
    const todayEnd = new Date(today.getTime() + 30 * 60 * 1000);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setSeconds(0, 0);
    const yesterdayEnd = new Date(yesterday.getTime() + 30 * 60 * 1000);

    const toDate = (d: Date) => d.toISOString().slice(0, 10);
    const toTime = (d: Date) => d.toTimeString().slice(0, 5);

    localStorage.setItem('barberpro_session', JSON.stringify({
      email: 'pedro@barber.com',
      role: 'barber',
      name: 'Pedro',
      barberId: 'pedro',
      unit_id: 'unit_bom_fim',
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    }));

    localStorage.setItem('barberpro_appointments', JSON.stringify([
      {
        id: `apt_barber_today_${Date.now()}`,
        unit_id: 'unit_bom_fim',
        tenant_id: 'tenant_barberpro_demo',
        client_email: 'cliente@barber.com',
        client_name: 'Cliente Hoje',
        service_id: 'corte',
        service_name: 'Corte',
        service_price: 72,
        duration_minutes: 30,
        barber_id: 'pedro',
        barber_name: 'Pedro',
        city: 'Porto Alegre',
        branch: 'Bom Fim',
        appointment_date: toDate(today),
        start_time: toTime(today),
        end_time: toTime(todayEnd),
        start_datetime: today.toISOString(),
        end_datetime: todayEnd.toISOString(),
        status: 'pending',
        requires_pre_payment: false,
        payment_due_at: null,
        notes: 'Observacao teste hoje',
        created_at: today.toISOString(),
        updated_at: today.toISOString(),
        created_by: 'admin@barber.com',
        updated_by: 'admin@barber.com',
        idempotency_key: `idem_barber_today_${Date.now()}`
      },
      {
        id: `apt_barber_yesterday_${Date.now()}`,
        unit_id: 'unit_bom_fim',
        tenant_id: 'tenant_barberpro_demo',
        client_email: 'cliente@barber.com',
        client_name: 'Cliente Ontem',
        service_id: 'barba',
        service_name: 'Barba',
        service_price: 54,
        duration_minutes: 30,
        barber_id: 'pedro',
        barber_name: 'Pedro',
        city: 'Porto Alegre',
        branch: 'Bom Fim',
        appointment_date: toDate(yesterday),
        start_time: toTime(yesterday),
        end_time: toTime(yesterdayEnd),
        start_datetime: yesterday.toISOString(),
        end_datetime: yesterdayEnd.toISOString(),
        status: 'confirmed',
        requires_pre_payment: false,
        payment_due_at: null,
        notes: 'Observacao teste ontem',
        created_at: yesterday.toISOString(),
        updated_at: yesterday.toISOString(),
        created_by: 'admin@barber.com',
        updated_by: 'admin@barber.com',
        idempotency_key: `idem_barber_yesterday_${Date.now()}`
      }
    ]));
  });

  await page.goto('/barber-home.html');
  await expect(page.locator('#barber-agenda-count')).toContainText('1 de 2');
  await expect(page.locator('text=Cliente Hoje')).toBeVisible();

  await page.click('#barber-agenda-yesterday-btn');
  await expect(page.locator('text=Cliente Ontem')).toBeVisible();
  await expect(page.locator('#barber-agenda-count')).toContainText('1 de 2');

  await page.click('#barber-agenda-today-btn');
  const concludeEnabled = page.locator('[data-barber-conclude]:not([disabled])').first();
  await expect(concludeEnabled).toBeVisible();
  await concludeEnabled.click();
  const modalConfirm = page.locator('[data-modal-confirm]');
  if (await modalConfirm.count()) {
    await modalConfirm.click();
  }
  await expect(page.locator('.barber-badge.status-completed').first()).toContainText(/CONCLU/i);
});


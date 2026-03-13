function initSuperAdminBarbershopFormPage() {
  const form = document.getElementById('superadmin-barbershop-form');
  if (!form) return;
  if (!requireRole(['super_admin'], 'super-admin-login.html')) return;

  const feedbackEl = document.getElementById('superadmin-feedback');
  const editIdEl = document.getElementById('sa-edit-id');
  const nameEl = document.getElementById('sa-name');
  const ownerEl = document.getElementById('sa-owner-name');
  const emailEl = document.getElementById('sa-email');
  const phoneEl = document.getElementById('sa-phone');
  const passwordEl = document.getElementById('sa-password');
  const addressEl = document.getElementById('sa-address');
  const planEl = document.getElementById('sa-plan');
  const planExpiresEl = document.getElementById('sa-plan-expires-at');
  const statusEl = document.getElementById('sa-status');
  const submitBtn = document.getElementById('sa-submit');
  const cancelBtn = document.getElementById('sa-cancel');

  if (!nameEl || !ownerEl || !emailEl || !phoneEl || !passwordEl || !statusEl || !planEl || !planExpiresEl || !submitBtn || !cancelBtn || !editIdEl) return;

  const allowedStatus = new Set(['active', 'trial', 'suspended', 'disabled']);
  const allowedPlan = new Set(['free', 'basic', 'pro', 'enterprise']);
  const normalizeStatus = (value) => (allowedStatus.has(value) ? value : 'active');
  const normalizePlan = (value) => (allowedPlan.has(value) ? value : 'basic');
  const toDateInput = (iso) => {
    const d = new Date(iso || 0);
    if (!Number.isFinite(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  };

  const upsertAdminUserForShop = (shop, passwordOverride = '') => {
    const users = getPlatformUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === shop.email.toLowerCase());
    const password = passwordOverride || String(shop.password_hash || '').replace(/^plain:/, '') || '123456';
    const payload = {
      email: shop.email,
      password,
      role: 'admin',
      name: shop.owner_name || 'Administrador',
      unit_id: shop.id,
      barbershop_id: shop.id
    };
    if (idx >= 0) users[idx] = { ...users[idx], ...payload };
    else users.push(payload);
    savePlatformUsers(users);
  };

  const syncTenantFromShop = (shop) => {
    const tenants = getJson(STORAGE_KEYS.tenants, []);
    const idx = tenants.findIndex((t) => t.id === shop.tenant_id || t.id === shop.id);
    const payload = {
      id: shop.tenant_id || shop.id,
      name: shop.name,
      subscription_plan_id: normalizePlan(shop.plan || (tenants[idx] && tenants[idx].subscription_plan_id) || 'basic'),
      subscription_status: shop.status === 'disabled' ? 'disabled' : shop.status === 'suspended' ? 'suspended' : 'active',
      created_at: (tenants[idx] && tenants[idx].created_at) || shop.created_at || nowIso(),
      updated_at: nowIso()
    };
    if (idx >= 0) tenants[idx] = { ...tenants[idx], ...payload };
    else tenants.unshift(payload);
    setJson(STORAGE_KEYS.tenants, tenants);
  };

  const resetForm = () => {
    editIdEl.value = '';
    form.reset();
    statusEl.value = 'active';
    planEl.value = 'basic';
    planExpiresEl.value = '';
    submitBtn.textContent = 'Cadastrar barbearia';
  };

  resetForm();

  const params = new URLSearchParams(window.location.search);
  const pathMatch = window.location.pathname.match(/\/superadmin\/barbershops\/([^/]+)\/edit\/?$/i);
  const editId = params.get('id') || (pathMatch ? decodeURIComponent(pathMatch[1]) : '');
  if (editId) {
    const current = getBarbershops().find((x) => x.id === editId);
    if (current) {
      editIdEl.value = current.id;
      nameEl.value = current.name || '';
      ownerEl.value = current.owner_name || '';
      emailEl.value = current.email || '';
      phoneEl.value = current.phone || '';
      passwordEl.value = '';
      if (addressEl) addressEl.value = current.address || '';
      planEl.value = normalizePlan(current.plan || 'basic');
      planExpiresEl.value = toDateInput(current.plan_expires_at);
      statusEl.value = normalizeStatus(current.status || 'active');
      submitBtn.textContent = 'Salvar alteracoes';
    }
  }

  cancelBtn.addEventListener('click', () => {
    window.location.href = 'super-admin-tenants.html';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rows = getBarbershops();
    const isEdit = !!editIdEl.value;
    const existingIdx = rows.findIndex((x) => x.id === editIdEl.value);
    const incomingEmail = sanitizeText(emailEl.value).toLowerCase();

    const duplicated = rows.some((x) => x.email.toLowerCase() === incomingEmail && x.id !== editIdEl.value);
    if (duplicated) {
      if (feedbackEl) feedbackEl.textContent = 'Ja existe uma barbearia com este email.';
      return;
    }

    const createdId = isEdit
      ? editIdEl.value
      : `shop_${slugify(nameEl.value || ownerEl.value || `novo-${Date.now()}`)}_${Date.now().toString().slice(-6)}`;

    const passwordRaw = sanitizeText(passwordEl.value) || (isEdit ? String(rows[existingIdx]?.password_hash || '').replace(/^plain:/, '') : '123456');

    const payload = {
      id: createdId,
      barbershop_id: createdId,
      tenant_id: createdId,
      name: sanitizeText(nameEl.value),
      owner_name: sanitizeText(ownerEl.value),
      email: incomingEmail,
      phone: sanitizeText(phoneEl.value),
      password_hash: `plain:${passwordRaw}`,
      address: sanitizeText(addressEl?.value || ''),
      status: normalizeStatus(statusEl.value),
      plan: normalizePlan(planEl.value),
      plan_expires_at: planExpiresEl.value ? `${planExpiresEl.value}T23:59:59.000Z` : null,
      created_at: isEdit && existingIdx >= 0 ? rows[existingIdx].created_at : nowIso(),
      updated_at: nowIso()
    };

    if (isEdit && existingIdx >= 0) rows[existingIdx] = payload;
    else rows.unshift(payload);

    saveBarbershops(rows);
    syncTenantFromShop(payload);
    upsertAdminUserForShop(payload, passwordRaw);
    logAudit(isEdit ? 'superadmin_barbershop_updated' : 'superadmin_barbershop_created', { barbershop_id: payload.id, status: payload.status });

    await alertAction(isEdit ? 'Barbearia atualizada com sucesso.' : 'Barbearia cadastrada com sucesso.', { title: 'Operacao concluida' });
    window.location.href = 'super-admin-tenants.html';
  });
}

function initAdminFinanceModuleCards() {
  return;
}

function initBarberHomePage() {
  if (!document.title.includes('Painel Barbeiro')) return;
  if (!requireRole(['barber'], 'login.html')) return;

  const agendaRoot = document.getElementById('barber-home-agenda');
  const todayEl = document.getElementById('barber-earnings-today');
  const weekEl = document.getElementById('barber-earnings-week');
  const agendaCountEl = document.getElementById('barber-agenda-count');
  const agendaDateFilterEl = document.getElementById('barber-agenda-date-filter');
  const agendaYesterdayBtn = document.getElementById('barber-agenda-yesterday-btn');
  const agendaTodayBtn = document.getElementById('barber-agenda-today-btn');
  if (!agendaRoot) return;

  const session = getSession();
  const now = new Date();
  const toInputDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const dateKeyFromIso = (value) => {
    const parsed = new Date(value || '');
    if (Number.isNaN(parsed.getTime())) return '';
    return toInputDate(parsed);
  };
  let selectedDate = toInputDate(now);

  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const weekStart = new Date(dayStart);
  weekStart.setDate(dayStart.getDate() - ((dayStart.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const toDate = (value) => {
    const parsed = new Date(value || '');
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const statusBadgeClass = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'completed') return 'status-completed';
    if (normalized === 'in_progress') return 'status-pending';
    if (normalized === 'confirmed') return 'status-confirmed';
    if (normalized === 'pending') return 'status-pending';
    if (normalized === 'awaiting_payment') return 'status-awaiting_payment';
    if (normalized === 'no_show') return 'status-no_show';
    if (normalized === 'canceled') return 'status-canceled';
    return '';
  };

  const statusIcon = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'completed') return '*';
    if (normalized === 'in_progress') return '>>';
    if (normalized === 'confirmed' || normalized === 'pending' || normalized === 'awaiting_payment') return '~';
    if (normalized === 'no_show' || normalized === 'canceled') return '!';
    return '-';
  };

  const activeBarber = getBarbers().find((b) => {
    const sameId = String(b.id || '') === String(session?.barberId || session?.id || '');
    const sameEmail = String(b.email || '').toLowerCase() === String(session?.email || '').toLowerCase();
    return sameId || sameEmail;
  });

  const render = () => {
    const baseRows = getAppointments()
      .filter((a) => {
        const sameBarberId = String(a.barber_id || '') === String(activeBarber?.id || session?.barberId || '');
        const sameBarberName = String(a.barber_name || '').toLowerCase() === String(activeBarber?.name || '').toLowerCase();
        return sameBarberId || sameBarberName;
      })
      .sort((a, b) => new Date(a.start_datetime || 0) - new Date(b.start_datetime || 0));
    const rows = baseRows.filter((a) => dateKeyFromIso(a.start_datetime) === selectedDate);

    if (agendaCountEl) {
      agendaCountEl.textContent = `${rows.length} de ${baseRows.length}`;
    }

    const completedRows = rows.filter((a) => String(a.status || '').toLowerCase() === 'completed');
    const earningsToday = completedRows
      .filter((a) => {
        const date = toDate(a.start_datetime);
        return date && date >= dayStart && date < dayEnd;
      })
      .reduce((sum, a) => sum + Number(a.service_price || 0), 0);

    const earningsWeek = completedRows
      .filter((a) => {
        const date = toDate(a.start_datetime);
        return date && date >= weekStart && date < weekEnd;
      })
      .reduce((sum, a) => sum + Number(a.service_price || 0), 0);

    if (todayEl) todayEl.textContent = asCurrency(earningsToday);
    if (weekEl) weekEl.textContent = asCurrency(earningsWeek);

    if (!rows.length) {
      agendaRoot.innerHTML = `
        <article class="barber-appointment-card">
          <h3 class="barber-appointment-title">Sem agendamentos vinculados</h3>
          <p class="text-sm text-text-secondary mt-1">Quando novos atendimentos forem vinculados ao seu nome, eles aparecerao aqui.</p>
        </article>
      `;
      return;
    }

    agendaRoot.innerHTML = rows.map((a) => {
      const status = String(a.status || '').toLowerCase();
      const canStart = ['pending', 'confirmed'].includes(status);
      const canConclude = ['in_progress', 'pending', 'confirmed'].includes(status);
      const canNoShow = ['awaiting_payment', 'pending', 'confirmed', 'in_progress'].includes(status);
      const canCancel = ['awaiting_payment', 'pending', 'confirmed', 'in_progress'].includes(status);
      const canDelay = ['awaiting_payment', 'pending', 'confirmed', 'in_progress'].includes(status);
      const canReschedule = ['awaiting_payment', 'pending', 'confirmed', 'no_show'].includes(status);
      const canTransfer = ['awaiting_payment', 'pending', 'confirmed', 'in_progress', 'no_show'].includes(status);
      const createdAt = new Date(a.created_at || a.start_datetime || 0).toLocaleString('pt-BR');
      const hasReason = !!String(a.status_reason || '').trim();
      const hasDelay = Number(a.delay_minutes || 0) > 0;
      return `
        <article class="barber-appointment-card">
          <div class="barber-appointment-header">
            <div class="grid gap-1.5">
              <p class="barber-appointment-title">${a.service_name || 'Servico'}</p>
              <p class="text-xs text-text-secondary">Cliente: <strong class="text-text-primary">${a.client_name || '-'}</strong></p>
              <p class="text-xs text-text-secondary">Atendimento: <strong class="text-text-primary">${formatBookingDateTime(a.appointment_date, a.start_time)}</strong></p>
              <p class="text-xs text-text-secondary">Criado em: <strong class="text-text-primary">${createdAt}</strong></p>
              <p class="text-xs text-text-secondary">Valor: <strong class="text-primary">${asCurrency(a.service_price || 0)}</strong></p>
              <p class="text-xs text-text-secondary">Observacoes: <strong class="text-text-primary">${a.notes ? String(a.notes) : 'Sem observacoes registradas.'}</strong></p>
              ${hasReason ? `<p class="text-xs text-text-secondary">Motivo status: <strong class="text-text-primary">${sanitizeText(a.status_reason)}</strong></p>` : ''}
              ${hasDelay ? `<p class="text-xs text-text-secondary">Atraso: <strong class="text-text-primary">${Number(a.delay_minutes)} min${a.delay_reason ? ` (${sanitizeText(a.delay_reason)})` : ''}</strong></p>` : ''}
            </div>
            <div class="flex flex-col items-start gap-2 md:items-end">
              <span class="barber-badge ${statusBadgeClass(a.status)}"><span aria-hidden="true">${statusIcon(a.status)}</span>${getBookingStatusLabel(a.status).toUpperCase()}</span>
              <span class="barber-badge">ID: ${String(a.id || '').slice(0, 8)}</span>
            </div>
          </div>
          <div class="barber-appointment-actions">
            <p>Acoes operacionais sem sair da agenda.</p>
            <div class="grid gap-2 md:grid-cols-3">
              <button type="button" class="button button-secondary min-h-10 w-full" data-barber-start="${a.id}" ${canStart ? '' : 'disabled'}>Iniciar</button>
              <button type="button" class="button button-primary min-h-10 w-full" data-barber-conclude="${a.id}" ${canConclude ? '' : 'disabled'}>${canConclude ? 'Concluir' : 'Finalizado'}</button>
              <button type="button" class="button button-secondary min-h-10 w-full" data-barber-more="${a.id}" aria-expanded="false">Mais acoes</button>
            </div>
            <div class="hidden grid gap-2 md:grid-cols-3" data-barber-more-panel="${a.id}">
              <button type="button" class="button button-secondary min-h-10 w-full" data-barber-no-show="${a.id}" ${canNoShow ? '' : 'disabled'}>No-show</button>
              <button type="button" class="button button-secondary min-h-10 w-full" data-barber-cancel="${a.id}" ${canCancel ? '' : 'disabled'}>Cancelar</button>
              <button type="button" class="button button-secondary min-h-10 w-full" data-barber-delay="${a.id}" ${canDelay ? '' : 'disabled'}>Atraso</button>
              <button type="button" class="button button-secondary min-h-10 w-full" data-barber-reschedule="${a.id}" ${canReschedule ? '' : 'disabled'}>Remarcar</button>
              <button type="button" class="button button-secondary min-h-10 w-full md:col-span-2" data-barber-transfer="${a.id}" ${canTransfer ? '' : 'disabled'}>Transferir</button>
              <button type="button" class="button button-secondary min-h-10 w-full" data-barber-context="${a.id}">Contexto cliente</button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    const getAppointmentById = (id) => getAppointments().find((x) => String(x.id) === String(id));

    agendaRoot.querySelectorAll('[data-barber-more]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.getAttribute('data-barber-more');
        if (!id) return;
        const panel = agendaRoot.querySelector(`[data-barber-more-panel="${id}"]`);
        if (!panel) return;
        const opening = panel.classList.contains('hidden');
        panel.classList.toggle('hidden', !opening);
        button.setAttribute('aria-expanded', opening ? 'true' : 'false');
        button.textContent = opening ? 'Ocultar acoes' : 'Mais acoes';
      });
    });

    agendaRoot.querySelectorAll('[data-barber-start]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-barber-start');
        if (!id) return;
        updateAppointmentStatus(id, 'in_progress');
        await alertAction('Atendimento iniciado.');
        render();
      });
    });

    agendaRoot.querySelectorAll('[data-barber-conclude]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-barber-conclude');
        if (!id) return;
        updateAppointmentStatus(id, 'completed');
        await alertAction('Servico concluido com sucesso.', { title: 'Atendimento finalizado' });
        render();
      });
    });

    agendaRoot.querySelectorAll('[data-barber-no-show]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-barber-no-show');
        if (!id) return;
        const reason = sanitizeText(window.prompt('Informe o motivo do no-show:') || '');
        if (!reason) {
          await alertAction('Motivo e obrigatorio para no-show.');
          return;
        }
        updateAppointmentStatus(id, 'no_show', { status_reason: reason });
        await alertAction('No-show registrado.');
        render();
      });
    });

    agendaRoot.querySelectorAll('[data-barber-cancel]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-barber-cancel');
        if (!id) return;
        const reason = sanitizeText(window.prompt('Informe o motivo do cancelamento:') || '');
        if (!reason) {
          await alertAction('Motivo e obrigatorio para cancelamento.');
          return;
        }
        updateAppointmentStatus(id, 'canceled', { status_reason: reason });
        await alertAction('Atendimento cancelado.');
        render();
      });
    });

    agendaRoot.querySelectorAll('[data-barber-delay]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-barber-delay');
        if (!id) return;
        const row = getAppointmentById(id);
        if (!row) return;
        const minutesRaw = String(window.prompt('Quantos minutos de atraso?', String(row.delay_minutes || 10)) || '').trim();
        const delayMinutes = Number(minutesRaw);
        if (!Number.isFinite(delayMinutes) || delayMinutes < 1) {
          await alertAction('Informe um numero valido de minutos.');
          return;
        }
        const reason = sanitizeText(window.prompt('Motivo do atraso (opcional):', String(row.delay_reason || '')) || '');
        updateAppointmentStatus(id, String(row.status || 'pending'), { delay_minutes: delayMinutes, delay_reason: reason || null });
        await alertAction('Atraso registrado.');
        render();
      });
    });

    agendaRoot.querySelectorAll('[data-barber-reschedule]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-barber-reschedule');
        if (!id) return;
        const row = getAppointmentById(id);
        if (!row) return;
        const nextDate = sanitizeText(window.prompt('Nova data (AAAA-MM-DD):', row.appointment_date || '') || '');
        const nextTime = sanitizeText(window.prompt('Novo horario (HH:MM):', row.start_time || '') || '');
        if (!nextDate || !nextTime) return;
        const duration = Number(row.duration_minutes || 30);
        const available = isSlotAvailable({ barberId: row.barber_id, date: nextDate, time: nextTime, serviceDuration: duration, editingAppointmentId: row.id });
        if (!available) {
          await alertAction('Horario indisponivel para este profissional.');
          return;
        }
        const start = toDate(nextDate, nextTime);
        const end = addMinutes(start, duration);
        const nextStatus = String(row.status || '') === 'no_show' ? 'confirmed' : String(row.status || 'pending');
        updateAppointmentStatus(id, nextStatus, {
          appointment_date: nextDate,
          start_time: nextTime,
          end_time: end.toTimeString().slice(0, 5),
          start_datetime: start.toISOString(),
          end_datetime: end.toISOString(),
          rescheduled_from: row.start_datetime || null,
          rescheduled_by: getSession()?.email || 'barber',
          delay_minutes: 0,
          delay_reason: null
        });
        await alertAction('Atendimento remarcado.');
        render();
      });
    });

    agendaRoot.querySelectorAll('[data-barber-transfer]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-barber-transfer');
        if (!id) return;
        const row = getAppointmentById(id);
        if (!row) return;
        const candidates = getBarbers(true).filter((b) => String(b.id) !== String(row.barber_id));
        if (!candidates.length) {
          await alertAction('Nao ha outro barbeiro ativo para transferencia.');
          return;
        }
        const listText = candidates.map((b) => `${b.id} - ${b.name}`).join('\n');
        const toBarberId = sanitizeText(window.prompt(`Informe o ID do barbeiro destino:\n${listText}`, String(candidates[0].id || '')) || '');
        const nextBarber = candidates.find((b) => String(b.id) === String(toBarberId));
        if (!nextBarber) {
          await alertAction('Barbeiro destino invalido.');
          return;
        }
        const dateInput = sanitizeText(window.prompt('Nova data (AAAA-MM-DD, vazio = manter):', row.appointment_date || '') || '');
        const timeInput = sanitizeText(window.prompt('Novo horario (HH:MM, vazio = manter):', row.start_time || '') || '');
        const nextDate = dateInput || row.appointment_date;
        const nextTime = timeInput || row.start_time;
        const duration = Number(row.duration_minutes || 30);
        const available = isSlotAvailable({ barberId: nextBarber.id, date: nextDate, time: nextTime, serviceDuration: duration, editingAppointmentId: row.id });
        if (!available) {
          await alertAction('Horario indisponivel para transferencia.');
          return;
        }
        const start = toDate(nextDate, nextTime);
        const end = addMinutes(start, duration);
        const nextStatus = String(row.status || '') === 'no_show' ? 'confirmed' : String(row.status || 'pending');
        updateAppointmentStatus(id, nextStatus, {
          barber_id: nextBarber.id,
          barber_name: nextBarber.name,
          appointment_date: nextDate,
          start_time: nextTime,
          end_time: end.toTimeString().slice(0, 5),
          start_datetime: start.toISOString(),
          end_datetime: end.toISOString(),
          transferred_from_barber_id: row.barber_id || null,
          transferred_to_barber_id: nextBarber.id,
          rescheduled_by: getSession()?.email || 'barber'
        });
        await alertAction('Atendimento transferido com sucesso.');
        render();
      });
    });

    agendaRoot.querySelectorAll('[data-barber-context]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-barber-context');
        if (!id) return;
        const row = getAppointmentById(id);
        if (!row) return;
        const all = getAppointments().filter((a) => String(a.client_email || '').toLowerCase() === String(row.client_email || '').toLowerCase());
        const recent = all
          .filter((a) => String(a.status || '') === 'completed')
          .sort((a, b) => new Date(b.start_datetime || 0) - new Date(a.start_datetime || 0))
          .slice(0, 3)
          .map((a) => `- ${a.service_name} (${formatBookingDateTime(a.appointment_date, a.start_time)})`)
          .join('\n');
        const historyCount = all.length;
        const message = [
          `Cliente: ${row.client_name || '-'}`,
          `Total de atendimentos: ${historyCount}`,
          `Ultimos servicos:`,
          recent || '- Sem historico concluido.',
          '',
          `Observacoes deste atendimento: ${row.notes ? String(row.notes) : 'Sem observacoes.'}`
        ].join('\n');
        await alertAction(message, { title: 'Contexto do cliente', confirmText: 'Fechar' });
        render();
      });
    });
  };

  if (agendaDateFilterEl) {
    agendaDateFilterEl.value = selectedDate;
    agendaDateFilterEl.addEventListener('change', () => {
      selectedDate = agendaDateFilterEl.value || toInputDate(new Date());
      render();
    });
  }

  if (agendaTodayBtn) {
    agendaTodayBtn.addEventListener('click', () => {
      selectedDate = toInputDate(new Date());
      if (agendaDateFilterEl) agendaDateFilterEl.value = selectedDate;
      render();
    });
  }

  if (agendaYesterdayBtn) {
    agendaYesterdayBtn.addEventListener('click', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      selectedDate = toInputDate(yesterday);
      if (agendaDateFilterEl) agendaDateFilterEl.value = selectedDate;
      render();
    });
  }

  render();
}

function dbEnabled() {
  return Boolean(DB_CONFIG.supabaseUrl && DB_CONFIG.supabaseAnonKey);
}

function ensureDbSchemaNote() {
  if (dbEnabled()) {
    // placeholder para integração backend real / transações
  }
}



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
    if (normalized === 'confirmed') return 'status-confirmed';
    if (normalized === 'pending') return 'status-pending';
    if (normalized === 'awaiting_payment') return 'status-awaiting_payment';
    if (normalized === 'no_show') return 'status-no_show';
    if (normalized === 'canceled') return 'status-canceled';
    return '';
  };

  const statusIcon = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'completed') return '●';
    if (normalized === 'confirmed' || normalized === 'pending' || normalized === 'awaiting_payment') return '◷';
    if (normalized === 'no_show' || normalized === 'canceled') return '▲';
    return '○';
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
      const canConclude = ['pending', 'confirmed'].includes(String(a.status || '').toLowerCase());
      const createdAt = new Date(a.created_at || a.start_datetime || 0).toLocaleString('pt-BR');
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
            </div>
            <div class="flex flex-col items-start gap-2 md:items-end">
              <span class="barber-badge ${statusBadgeClass(a.status)}"><span aria-hidden="true">${statusIcon(a.status)}</span>${getBookingStatusLabel(a.status).toUpperCase()}</span>
              <span class="barber-badge">ID: ${String(a.id || '').slice(0, 8)}</span>
            </div>
          </div>
          <div class="barber-appointment-actions">
            <p>Concluir habilitado para status pendente ou confirmado.</p>
            <button type="button" class="button button-primary min-h-10 w-full md:w-auto" data-barber-conclude="${a.id}" ${canConclude ? '' : 'disabled'}>${canConclude ? 'Concluir Servico' : 'Servico finalizado'}</button>
          </div>
        </article>
      `;
    }).join('');

    agendaRoot.querySelectorAll('[data-barber-conclude]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-barber-conclude');
        if (!id) return;
        updateAppointmentStatus(id, 'completed');
        await alertAction('Servico concluido com sucesso.', { title: 'Atendimento finalizado' });
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



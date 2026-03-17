function getLegacyLoginHints() {
  const platformHints = getPlatformUsers()
    .filter((u) => u && u.role !== 'super_admin')
    .map((u) => ({
      email: String(u.email || '').trim().toLowerCase(),
      role: String(u.role || '').trim().toLowerCase(),
      password: String(u.password || '')
    }));

  const barberHints = getBarbers()
    .filter((b) => b && b.active && b.email)
    .map((b) => ({
      email: String(b.email || '').trim().toLowerCase(),
      role: 'barber',
      password: String(b.password || '')
    }));

  const byEmail = new Map();
  [...platformHints, ...barberHints].forEach((item) => {
    if (!item.email || byEmail.has(item.email)) return;
    byEmail.set(item.email, item);
  });
  return Array.from(byEmail.values()).sort((a, b) => a.email.localeCompare(b.email));
}

function roleHintLabel(role) {
  if (role === 'admin') return 'Admin';
  if (role === 'barber') return 'Barbeiro';
  if (role === 'client') return 'Cliente';
  return 'Usuario';
}

function renderLegacyLoginHints() {
  const root = document.getElementById('legacy-login-hints');
  if (!root) return;
  const hints = getLegacyLoginHints();
  if (!hints.length) {
    root.innerHTML = '';
    return;
  }

  root.innerHTML = `
    <div class="rounded-xl border border-borderc/80 bg-slate-950/40 p-3 grid gap-2">
      <p class="text-xs uppercase tracking-wide text-text-secondary font-semibold">Dicas de login (sem SuperAdmin)</p>
      <div class="grid gap-1.5">
        ${hints.map((item) => `
          <button type="button" class="legacy-login-hint-btn flex w-full items-center justify-between gap-2 rounded-lg border border-borderc/70 bg-slate-900/40 px-2 py-1.5 text-left transition hover:border-primary/50 hover:bg-slate-900/65" data-login-email="${item.email}" data-login-password="${item.password || ''}">
            <span class="text-xs text-text-secondary truncate">${item.email}</span>
            <span class="text-[10px] uppercase tracking-wide rounded-full border border-borderc/80 px-2 py-0.5 text-text-secondary">${roleHintLabel(item.role)}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function initLoginPage() {
  const form = document.querySelector('form.auth-form');
  if (!form) return;
  const feedback = document.getElementById('login-feedback');
  renderLegacyLoginHints();

  const attemptLogin = (emailRaw, passwordRaw) => {
    const email = normalizeCredential(emailRaw).toLowerCase();
    const password = normalizeCredential(passwordRaw);

    const base = getPlatformUsers().find((u) => normalizeCredential(u.email).toLowerCase() === email && normalizeCredential(u.password) === password);
    const barber = getBarbers().find((b) => normalizeCredential(b.email).toLowerCase() === email && normalizeCredential(b.password) === password && b.active);

    const user = base || (barber ? { email: barber.email, password: barber.password, role: 'barber', name: barber.name, barberId: barber.id, unit_id: barber.unit_id } : null);

    if (!user) {
      if (feedback) feedback.textContent = 'Credenciais inválidas.';
      return;
    }

    if (user.role === 'super_admin') {
      if (feedback) feedback.textContent = 'Use o acesso exclusivo do administrador da plataforma.';
      return;
    }

    if (user.role === 'admin') {
      const shop = getBarbershops().find((s) => s.email.toLowerCase() === user.email.toLowerCase() || s.id === user.unit_id);
      if (shop && ['suspended', 'disabled'].includes(shop.status)) {
        if (feedback) feedback.textContent = shop.status === 'suspended' ? 'Acesso desta barbearia está suspenso.' : 'Acesso desta barbearia está desativado.';
        return;
      }
    }

    setSession(user);
    const redirect = new URLSearchParams(window.location.search).get('redirect');
    if (redirect) return (window.location.href = redirect);

    if (user.role === 'client') window.location.href = 'client-home.html';
    else if (user.role === 'barber') window.location.href = 'barber-home.html';
    else if (user.role === 'super_admin') window.location.href = 'super-admin-tenants.html';
    else window.location.href = 'admin-home.html';
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailRaw = document.getElementById('email')?.value || '';
    const passwordRaw = document.getElementById('password')?.value || '';
    attemptLogin(emailRaw, passwordRaw);
  });

  document.querySelectorAll('.legacy-login-hint-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const emailRaw = button.getAttribute('data-login-email') || '';
      const passwordRaw = button.getAttribute('data-login-password') || '';
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      if (emailInput) emailInput.value = emailRaw;
      if (passwordInput) passwordInput.value = passwordRaw;
      attemptLogin(emailRaw, passwordRaw);
    });
  });
}

function initSuperAdminLoginPage() {
  const form = document.getElementById('superadmin-login-form');
  if (!form) return;
  const feedback = document.getElementById('superadmin-login-feedback');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailRaw = document.getElementById('superadmin-email')?.value || '';
    const passwordRaw = document.getElementById('superadmin-password')?.value || '';
    const email = normalizeCredential(emailRaw).toLowerCase();
    const password = normalizeCredential(passwordRaw);

    const user = getPlatformUsers().find((u) => u.role === 'super_admin' && normalizeCredential(u.email).toLowerCase() === email && normalizeCredential(u.password) === password);
    if (!user) {
      if (feedback) feedback.textContent = 'Credenciais do SuperAdmin inválidas.';
      return;
    }

    setSession(user);
    window.location.href = 'super-admin-tenants.html';
  });
}

function initLocationPage() {
  const form = document.getElementById('location-form');
  if (!form) return;
  const cityEl = document.getElementById('city');
  const branchEl = document.getElementById('branch');
  const b = ensureBookingConsistency();

  populateSelect(cityEl, BASE_DATA.cities, 'Selecione a cidade');

  const isEditMode = new URLSearchParams(window.location.search).get('edit') === 'location';

  cityEl.addEventListener('change', () => {
    const city = BASE_DATA.cities.find((c) => c.id === cityEl.value);
    branchEl.disabled = !city;
    populateSelect(branchEl, city ? city.branches : [], 'Selecione a unidade');
    if (isEditMode) saveBooking({ city: cityEl.value, branch: '' });
    else saveBooking({ city: cityEl.value, branch: '', service: '', professional: '', date: '', time: '', edit_appointment_id: null });
  });
  branchEl.addEventListener('change', () => {
    if (isEditMode) saveBooking({ branch: branchEl.value });
    else saveBooking({ branch: branchEl.value, service: '', professional: '', date: '', time: '', edit_appointment_id: null });
  });

  if (b.city) {
    cityEl.value = b.city;
    cityEl.dispatchEvent(new Event('change'));
    if (b.branch) branchEl.value = b.branch;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!cityEl.value || !branchEl.value) return;
    saveBooking({ city: cityEl.value, branch: branchEl.value });
    window.location.href = isEditMode ? 'booking-review.html' : 'booking-service.html';
  });
}

function initServicePage() {
  const grid = document.getElementById('services-grid');
  const nextBtn = document.getElementById('service-next');
  if (!grid || !nextBtn) return;
  const b = ensureBookingConsistency();
  if (!b.city || !b.branch) return (window.location.href = 'booking-location.html');
  const isEditMode = new URLSearchParams(window.location.search).get('edit') === 'service';

  getServices().forEach((s) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `service-card ${b.service === s.id ? 'active' : ''}`;
    card.innerHTML = `<span class="service-bg">${s.emoji}</span><span class="service-title">${s.name}</span><span class="service-price">${asCurrency(s.price)} · ${s.duration_minutes} min</span>`;
    card.addEventListener('click', () => {
      if (isEditMode) saveBooking({ service: s.id });
      else saveBooking({ service: s.id, professional: '', date: '', time: '' });
      [...grid.querySelectorAll('.service-card')].forEach((x) => x.classList.remove('active'));
      card.classList.add('active');
      nextBtn.disabled = false;
    });
    grid.appendChild(card);
  });

  nextBtn.disabled = !b.service;
  nextBtn.addEventListener('click', () => {
    if (!getBooking().service) return;
    window.location.href = isEditMode ? 'booking-review.html' : 'booking-professional.html';
  });
}

function initProfessionalPage() {
  const grid = document.getElementById('professionals-grid');
  const nextBtn = document.getElementById('professional-next');
  if (!grid || !nextBtn) return;
  const b = ensureBookingConsistency();
  if (!b.service) return (window.location.href = 'booking-service.html');
  const isEditMode = new URLSearchParams(window.location.search).get('edit') === 'professional';

  const pros = [...getBarbers(true), { id: 'sem-preferencia', name: 'Sem preferência', avatar: '⭐' }];
  pros.forEach((p) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `pro-card ${b.professional === p.id ? 'active' : ''}`;
    card.innerHTML = `<span class="pro-avatar">${p.avatar}</span><span class="pro-name">${p.name}</span>`;
    card.addEventListener('click', () => {
      if (isEditMode) saveBooking({ professional: p.id });
      else saveBooking({ professional: p.id, date: '', time: '' });
      [...grid.querySelectorAll('.pro-card')].forEach((x) => x.classList.remove('active'));
      card.classList.add('active');
      nextBtn.disabled = false;
    });
    grid.appendChild(card);
  });

  nextBtn.disabled = !b.professional;
  nextBtn.addEventListener('click', () => {
    if (!getBooking().professional) return;
    window.location.href = isEditMode ? 'booking-review.html' : 'booking-datetime.html';
  });
}

function initDatetimePage() {
  const form = document.getElementById('datetime-form');
  if (!form) return;
  const dateEl = document.getElementById('date');
  const grid = document.getElementById('time-grid');
  const button = document.getElementById('confirm-booking');

  const b = ensureBookingConsistency();
  if (!b.professional || !b.service) return (window.location.href = 'booking-professional.html');
  const service = getServiceById(b.service);
  const summaryServiceEl = document.getElementById('summary-service');
  const summaryPriceEl = document.getElementById('summary-price');
  const summaryLocationEl = document.getElementById('summary-location');
  const summaryProfessionalEl = document.getElementById('summary-professional');
  const summaryTimeEl = document.getElementById('summary-time');

  populateSelect(dateEl, getNextDays(), 'Selecione uma data');
  if (b.date) dateEl.value = b.date;

  function renderSummary() {
    const cur = getBooking();
    const city = BASE_DATA.cities.find((c) => c.id === cur.city);
    const branch = city?.branches.find((x) => x.id === cur.branch);
    const selectedService = getServiceById(cur.service);
    const selectedProfessional = cur.professional === 'sem-preferencia' ? { name: 'Sem preferência' } : getBarbers().find((x) => x.id === cur.professional);
    if (summaryServiceEl) summaryServiceEl.textContent = `Serviço: ${selectedService?.name || '-'}`;
    if (summaryPriceEl) summaryPriceEl.textContent = `Valor a partir de: ${asCurrency(selectedService?.price || 0)}`;
    if (summaryLocationEl) summaryLocationEl.textContent = `Local: ${branch?.name || '-'}`;
    if (summaryProfessionalEl) summaryProfessionalEl.textContent = `Profissional: ${selectedProfessional?.name || '-'}`;
    if (summaryTimeEl) summaryTimeEl.textContent = `Horário: ${cur.time || '-'}`;
  }

  function render() {
    const cur = getBooking();
    grid.innerHTML = '';

    getTimeslots().forEach((time) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `time-slot ${cur.time === time ? 'active' : ''}`;
      btn.textContent = time;

      let available = false;
      if (cur.date) {
        if (cur.professional === 'sem-preferencia') {
          available = getBarbers(true).some((barber) => isSlotAvailable({ barberId: barber.id, date: cur.date, time, serviceDuration: service.duration_minutes }));
        } else {
          available = isSlotAvailable({ barberId: cur.professional, date: cur.date, time, serviceDuration: service.duration_minutes });
        }
      }

      btn.disabled = !available;
      btn.addEventListener('click', () => {
        saveBooking({ time });
        render();
        button.disabled = !(getBooking().date && getBooking().time);
      });

      grid.appendChild(btn);
    });
    renderSummary();
  }

  dateEl.addEventListener('change', () => {
    saveBooking({ date: dateEl.value, time: '' });
    render();
    button.disabled = true;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!getBooking().date || !getBooking().time) return;
    window.location.href = 'booking-review.html';
  });

  render();
  button.disabled = !(getBooking().date && getBooking().time);
}

function initBookingReviewPage() {
  const list = document.getElementById('review-list');
  const action = document.getElementById('review-action');
  if (!list || !action) return;
  const b = getBooking();
  if (!(b.city && b.branch && b.service && b.professional && b.date && b.time)) return (window.location.href = 'booking-location.html');

  const city = BASE_DATA.cities.find((c) => c.id === b.city);
  const branch = city?.branches.find((x) => x.id === b.branch);
  const service = getServiceById(b.service);
  const barber = [...getBarbers(true), { id: 'sem-preferencia', name: 'Sem preferência' }].find((x) => x.id === b.professional);

  list.innerHTML = [
    ['🌍', city?.name, 'Região', 'booking-location.html?edit=location'],
    ['📍', branch?.name, 'Unidade', 'booking-location.html?edit=location'],
    ['💈', `${service?.name} (${service?.duration_minutes} min)`, 'Serviço', 'booking-service.html?edit=service'],
    ['👤', barber?.name, 'Profissional', 'booking-professional.html?edit=professional'],
    ['📅', formatBookingDateTime(b.date, b.time), 'Data e hora', 'booking-datetime.html?edit=datetime']
  ]
    .map((row) => `<article class="review-item"><div class="review-icon">${row[0]}</div><div><h3>${row[1] || '-'}</h3><p>${row[2]}</p></div><a class="review-edit" href="${row[3]}">Alterar</a></article>`)
    .join('');

  document.getElementById('review-price').textContent = `A partir de ${asCurrency(service?.price || 0)}`;
  document.getElementById('review-address').textContent = branch?.address || '-';
  const noPrefNotice = document.getElementById('review-no-preference');
  const feedback = document.getElementById('review-feedback');
  if (noPrefNotice) noPrefNotice.style.display = b.professional === 'sem-preferencia' ? 'block' : 'none';

  const session = getSession();
  if (!session) {
    action.textContent = 'Efetuar login para continuar';
    action.disabled = false;
  } else if (!hasRole('client')) {
    action.textContent = 'Perfil administrativo não agenda por esta tela';
    action.disabled = true;
  } else {
    action.textContent = 'Confirmar agendamento';
    action.disabled = false;
  }

  const enforceReviewUnblockedState = () => {
    const txt = String(action.textContent || '').toLowerCase();
    if (txt.includes('bloqueado') || txt.includes('blocked')) {
      action.textContent = 'Confirmar agendamento';
      action.disabled = false;
    }
  };
  enforceReviewUnblockedState();
  try {
    const observer = new MutationObserver(() => enforceReviewUnblockedState());
    observer.observe(action, { childList: true, characterData: true, subtree: true, attributes: true });
  } catch {}

  const successModal = document.getElementById('booking-success-modal');
  const successHomeBtn = document.getElementById('booking-success-home');

  action.addEventListener('click', async () => {
    const currentSession = getSession();
    if (!currentSession) return (window.location.href = 'login.html?redirect=booking-review.html');
    if (!hasRole('client')) return;
    const apt = createAppointmentFromBooking();
    if (!apt) {
      if (feedback) feedback.textContent = 'Horário indisponível ou dados inválidos. Volte e selecione outro horário/profissional.';
      action.textContent = 'Horário indisponível. Escolha outro.';
      return;
    }

    const bookingSnapshot = getBooking();
    const validation = await validateSlotServerSide({
      tenant_id: APP_CONFIG.tenantId,
      unit_id: APP_CONFIG.unitId,
      barber_id: apt.barber_id,
      start_datetime: apt.start_datetime,
      duration_minutes: Number(apt.duration_minutes || 0),
      editing_appointment_id: bookingSnapshot.edit_appointment_id || null
    });
    if (!validation.ok) {
      if (!isTechnicalValidationReason(validation.reason)) {
        if (feedback) feedback.textContent = `Horário indisponível (${validation.reason || 'server_validation'}).`;
        action.textContent = 'Horário indisponível. Escolha outro.';
        return;
      }
      if (feedback) feedback.textContent = 'Validação do servidor indisponível no momento. Tentando concluir mesmo assim.';
    }

    const serverCreation = await createAppointmentServerSide(apt);
    if (!serverCreation.ok) {
      if (isHardBusinessCreateReason(serverCreation.reason)) {
        if (feedback) feedback.textContent = `Horário indisponível (${serverCreation.reason}).`;
        action.textContent = 'Horário indisponível. Escolha outro.';
        return;
      }
      if (feedback) feedback.textContent = `Agendamento salvo localmente. Falha na sincronização com servidor (${serverCreation.reason}).`;
    } else {
      logAudit('appointment_server_synced', { appointment_id: apt.id, server_appointment_id: serverCreation.appointment?.id || null });
    }

    const rows = getAppointments();
    const duplicated = rows.find((r) => r.idempotency_key && r.idempotency_key === apt.idempotency_key);
    if (duplicated) {
      if (feedback) feedback.textContent = 'Agendamento já confirmado anteriormente para este horário.';
      action.disabled = true;
      return;
    }
    const editId = getBooking().edit_appointment_id;
    const existingIdx = editId ? rows.findIndex((r) => r.id === editId) : -1;

    if (existingIdx >= 0) {
      rows[existingIdx] = {
        ...rows[existingIdx],
        ...apt,
        id: rows[existingIdx].id,
        status: 'confirmed',
        updated_at: nowIso(),
        updated_by: currentSession.email
      };
      saveAppointments(rows);
      logAudit('appointment_rescheduled', { appointment_id: rows[existingIdx].id });
    } else {
      rows.unshift(apt);
      saveAppointments(rows);
      logAudit('appointment_created', { appointment_id: apt.id, status: apt.status });

      if (apt.status === 'awaiting_payment') {
        action.textContent = 'Aguardando pagamento antecipado';
      }
      updateAppointmentStatus(apt.id, 'confirmed');
    }

    action.disabled = true;
    if (feedback) feedback.textContent = 'Agendamento concluído com sucesso!';

    if (successModal) {
      successModal.classList.remove('hidden');
      successModal.classList.add('is-open');
      successModal.setAttribute('aria-hidden', 'false');
    }

    if (successHomeBtn) {
      successHomeBtn.onclick = () => {
        if (successModal) {
          successModal.classList.remove('is-open');
          successModal.classList.add('hidden');
          successModal.setAttribute('aria-hidden', 'true');
        }
        resetBooking();
        window.location.href = 'client-home.html';
      };
    }
  });
}

function canCancelAppointment(appointment) {
  if (TEST_MODE_ALLOW_ANY_CANCELLATION) return true;
  const settings = getUnitSettings();
  const diffHours = (new Date(appointment.start_datetime) - new Date()) / 3600000;
  return diffHours >= Number(settings.cancellation_limit_hours || 3);
}

function initMySchedulesPage() {
  const root = document.getElementById('my-schedules-content');
  if (!root) return;

  const session = getSession();
  if (!session) {
    root.innerHTML = '<div class="empty-state"><h2>Faça login para ver seus horários</h2><p>Você precisa entrar com sua conta para acessar os horários agendados.</p><a class="button button-primary" href="login.html?redirect=my-schedules.html">Efetuar login</a></div>';
    return;
  }
  if (!hasRole('client')) {
    root.innerHTML = '<div class="empty-state"><h2>Área exclusiva de clientes</h2></div>';
    return;
  }

  const allAppointments = getAppointments()
    .filter((a) => a.client_email === session.email)
    .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));

  if (!allAppointments.length) {
    root.innerHTML = '<div class="empty-state"><h2>Você não tem horários agendados</h2><p>Quando confirmar um agendamento ele aparecerá aqui.</p><a class="button button-primary" href="booking-location.html">Agendar agora</a></div>';
    return;
  }

  const asDateInput = (value) => {
    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const getAppointmentDateKey = (appointment) => {
    if (appointment.appointment_date && /^\d{4}-\d{2}-\d{2}$/.test(String(appointment.appointment_date))) return String(appointment.appointment_date);
    return asDateInput(appointment.start_datetime);
  };
  const statusBadgeClass = (status) => {
    if (status === 'confirmed') return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100';
    if (status === 'completed') return 'border-sky-400/40 bg-sky-500/10 text-sky-100';
    if (status === 'canceled') return 'border-rose-400/40 bg-rose-500/10 text-rose-100';
    if (status === 'no_show') return 'border-amber-400/40 bg-amber-500/10 text-amber-100';
    return 'border-borderc/80 bg-slate-900/40 text-text-secondary';
  };
  const today = asDateInput(new Date().toISOString());

  root.innerHTML = `
    <section class="rounded-xl border border-borderc bg-slate-950/35 p-3 mb-3">
      <div class="grid gap-2 md:grid-cols-3">
        <label class="text-xs text-text-secondary grid gap-1">Data
          <input id="my-schedules-filter-date" type="date" value="${today}" class="min-h-11 rounded-xl border border-borderc bg-slate-950/45 px-3 text-sm text-text-primary" />
        </label>
        <label class="text-xs text-text-secondary grid gap-1">Status
          <select id="my-schedules-filter-status" class="min-h-11 rounded-xl border border-borderc bg-slate-950/45 px-3 text-sm text-text-primary">
            <option value="all">Todos</option>
            <option value="confirmed">Confirmado</option>
            <option value="pending">Pendente</option>
            <option value="awaiting_payment">Aguardando pagamento</option>
            <option value="completed">Concluído</option>
            <option value="canceled">Cancelado</option>
            <option value="no_show">Não comparecido</option>
          </select>
        </label>
        <div class="text-xs text-text-secondary grid gap-1">Resultado
          <div id="my-schedules-filter-count" class="min-h-11 rounded-xl border border-borderc bg-slate-950/45 px-3 flex items-center text-sm">0 item(ns)</div>
        </div>
      </div>
    </section>
    <div id="my-schedules-cards" class="grid gap-3"></div>
  `;

  const dateEl = root.querySelector('#my-schedules-filter-date');
  const statusEl = root.querySelector('#my-schedules-filter-status');
  const countEl = root.querySelector('#my-schedules-filter-count');
  const cardsEl = root.querySelector('#my-schedules-cards');

  const renderCards = () => {
    const selectedDate = dateEl?.value || today;
    const selectedStatus = statusEl?.value || 'all';

    const filtered = allAppointments.filter((appointment) => {
      if (selectedDate && getAppointmentDateKey(appointment) !== selectedDate) return false;
      if (selectedStatus !== 'all' && appointment.status !== selectedStatus) return false;
      return true;
    });

    if (countEl) countEl.textContent = `${filtered.length} item(ns)`;
    if (!cardsEl) return;

    if (!filtered.length) {
      cardsEl.innerHTML = '<article class="rounded-xl border border-borderc bg-slate-950/35 p-3 text-sm text-text-secondary">Sem agendamentos para os filtros selecionados.</article>';
      return;
    }

    const nextUpcoming = filtered
      .filter((appointment) => ['pending', 'confirmed', 'awaiting_payment'].includes(appointment.status) && new Date(appointment.start_datetime).getTime() >= Date.now())
      .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))[0];

    cardsEl.innerHTML = filtered.map((appointment) => {
      const isUpcoming = nextUpcoming && nextUpcoming.id === appointment.id;
      const canReschedule = ['confirmed', 'no_show'].includes(appointment.status);
      const canCancel = ['pending', 'confirmed', 'awaiting_payment'].includes(appointment.status);
      return `
        <article class="relative overflow-hidden rounded-2xl border ${isUpcoming ? 'border-primary/80 bg-gradient-to-br from-primary/20 via-slate-950/40 to-slate-900/50 shadow-[0_16px_36px_rgba(198,154,69,0.22)]' : 'border-borderc bg-slate-950/35'} p-4 grid gap-3">
          ${isUpcoming ? '<div class="inline-flex w-fit rounded-full border border-primary/50 bg-primary/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">Próximo atendimento</div>' : ''}
          <div class="grid gap-2 sm:grid-cols-2">
            <p class="text-sm text-text-secondary"><strong class="text-text-primary">💈 Serviço:</strong> ${appointment.service_name}</p>
            <p class="text-sm text-text-secondary"><strong class="text-text-primary">👤 Profissional:</strong> ${appointment.barber_name}</p>
            <p class="text-sm text-text-secondary"><strong class="text-text-primary">📅 Data:</strong> ${new Date(appointment.start_datetime).toLocaleDateString('pt-BR')}</p>
            <p class="text-sm text-text-secondary"><strong class="text-text-primary">🕒 Horário:</strong> ${String(appointment.start_time || '').slice(0, 5)}</p>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(appointment.status)}">${getBookingStatusLabel(appointment.status)}</span>
            <small class="text-xs text-text-secondary">${appointment.branch} · ${appointment.city || 'Porto Alegre'}</small>
          </div>
          ${(canReschedule || canCancel) ? `
            <div class="grid gap-2 sm:grid-cols-2">
              ${canReschedule ? `<button class="button button-secondary inline-flex items-center justify-center rounded-xl px-4 min-h-11 font-semibold border border-borderc bg-surface text-text-primary hover:border-primary/70" data-reschedule="${appointment.id}">Remarcar</button>` : ''}
              ${canCancel ? `<button class="button button-secondary inline-flex items-center justify-center rounded-xl px-4 min-h-11 font-semibold border border-borderc bg-surface text-text-primary hover:border-primary/70" data-cancel="${appointment.id}">Cancelar</button>` : ''}
            </div>
          ` : ''}
        </article>
      `;
    }).join('');

    cardsEl.querySelectorAll('[data-reschedule]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const apt = allAppointments.find((a) => a.id === btn.dataset.reschedule);
        if (!apt) return;
        const city = BASE_DATA.cities.find((c) => c.name === apt.city);
        const branch = city?.branches.find((x) => x.name === apt.branch);
        saveBooking({ city: city?.id || 'poa', branch: branch?.id || 'bom-fim', service: apt.service_id, professional: apt.barber_id, date: '', time: '', edit_appointment_id: apt.id });
        window.location.href = 'booking-datetime.html?edit=datetime';
      });
    });

    cardsEl.querySelectorAll('[data-cancel]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const apt = allAppointments.find((a) => a.id === btn.dataset.cancel);
        if (!apt) return;
        const allowed = canCancelAppointment(apt);
        if (!allowed) {
          await alertAction('Cancelamento fora da política: prazo mínimo não respeitado.');
          return;
        }
        if (!(await confirmAction('Deseja realmente cancelar este agendamento?'))) return;
        updateAppointmentStatus(apt.id, 'canceled');
        scheduleNotification({ user_id: apt.client_email, type: 'cancellation', scheduled_for: nowIso(), sent_at: nowIso(), related_appointment_id: apt.id });
        initMySchedulesPage();
      });
    });
  };

  dateEl?.addEventListener('change', renderCards);
  statusEl?.addEventListener('change', renderCards);
  renderCards();
}
function renderAppointmentCard(a, canManage = false) {
  const actionButtons = canManage
    ? `<div class="form-row"><button class="button button-secondary" data-status="confirmed" data-id="${a.id}">Confirmar</button><button class="button button-secondary" data-status="completed" data-id="${a.id}">Concluir</button><button class="button button-secondary" data-status="canceled" data-id="${a.id}">Cancelar</button></div>`
    : '';
  return `<article class="schedule-item"><h3>${a.service_name} · ${formatBookingDateTime(a.appointment_date, a.start_time)}</h3><p>${a.barber_name} · ${a.client_name || 'Cliente'} · <span class="status-badge status-${a.status}">${getBookingStatusLabel(a.status)}</span></p><small>${a.branch} - ${a.city}</small>${actionButtons}</article>`;
}


function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  rows.forEach((row) => {
    const line = headers.map((key) => `"${String(row[key] ?? '').replace(/"/g, '""')}"`).join(',');
    lines.push(line);
  });
  return lines.join('\n');
}

function downloadCsv(filename, rows) {
  const content = toCsv(rows);
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function initAdminSchedulesPage() {
  const list = document.getElementById('admin-schedules-list');
  const barberFilter = document.getElementById('admin-professional-filter');
  const statusFilter = document.getElementById('admin-status-filter');
  const dateFilter = document.getElementById('admin-date-filter');
  if (!list || !barberFilter || !statusFilter) return;
  if (!requireRole(['admin', 'barber', 'super_admin'], 'login.html')) return;

  const session = getSession();
  const options = [{ id: 'all', name: 'Todos os barbeiros' }, ...getBarbers()];
  populateSelect(barberFilter, options, 'Todos os barbeiros');
  barberFilter.value = 'all';

  function filteredRows() {
    let rows = getAppointments();
    if (hasRole('barber')) {
      barberFilter.disabled = true;
      rows = rows.filter((a) => a.barber_id === session.barberId);
    } else {
      barberFilter.disabled = false;
      if (barberFilter.value !== 'all' && barberFilter.value) rows = rows.filter((a) => a.barber_id === barberFilter.value);
    }
    if (statusFilter.value !== 'all') rows = rows.filter((a) => a.status === statusFilter.value);
    if (dateFilter?.value) rows = rows.filter((a) => a.appointment_date === dateFilter.value);
    return rows;
  }

  function render() {
    const rows = filteredRows();
    if (!rows.length) {
      list.innerHTML = '<div class="empty-state"><h2>Sem agendamentos neste filtro</h2></div>';
      return;
    }
    const canManage = hasRole('admin', 'super_admin');
    list.innerHTML = rows.map((a) => renderAppointmentCard(a, canManage)).join('');
    if (canManage) {
      list.querySelectorAll('[data-status]').forEach((btn) => {
        btn.addEventListener('click', () => {
          updateAppointmentStatus(btn.dataset.id, btn.dataset.status);
          render();
        });
      });
    }
  }

  barberFilter.addEventListener('change', render);
  statusFilter.addEventListener('change', render);
  dateFilter?.addEventListener('change', render);
  render();
}

function initAdminBarbersPage() {
  const form = document.getElementById('barber-form');
  if (!form) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;

  const idEl = document.getElementById('barber-id');
  const nameEl = document.getElementById('barber-name');
  const emailEl = document.getElementById('barber-email');
  const passwordEl = document.getElementById('barber-password');
  const commissionEl = document.getElementById('barber-commission');
  const activeEl = document.getElementById('barber-active');
  const cancelEl = document.getElementById('barber-cancel');
  const listEl = document.getElementById('barbers-list');

  function reset() {
    idEl.value = '';
    nameEl.value = '';
    emailEl.value = '';
    passwordEl.value = '';
    commissionEl.value = '40';
    activeEl.checked = true;
  }

  function render() {
    const rows = getBarbers();
    listEl.innerHTML = rows
      .map((b) => `<article class="schedule-item"><h3>${b.name}</h3><p>${b.email} · comissão ${b.commission_percentage}% · ${b.active ? 'ativo' : 'inativo'}</p><div class="form-row"><button class="button button-secondary" type="button" data-edit="${b.id}">Editar</button><button class="button button-secondary" type="button" data-delete="${b.id}">Excluir</button></div></article>`)
      .join('');

    listEl.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const b = rows.find((x) => x.id === btn.dataset.edit);
        if (!b) return;
        idEl.value = b.id;
        nameEl.value = b.name;
        emailEl.value = b.email;
        passwordEl.value = b.password;
        commissionEl.value = String(b.commission_percentage);
        activeEl.checked = !!b.active;
      });
    });

    listEl.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = rows.map((b) => (b.id === btn.dataset.delete ? { ...b, deleted_at: nowIso(), updated_at: nowIso(), active: false } : b));
        saveBarbers(next);
        logAudit('barber_soft_deleted', { barber_id: btn.dataset.delete });
        render();
      });
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rows = getBarbers();
    const payload = {
      id: idEl.value || slugify(nameEl.value),
      name: sanitizeText(nameEl.value),
      email: sanitizeText(emailEl.value).toLowerCase(),
      password: sanitizeText(passwordEl.value),
      commission_percentage: Number(commissionEl.value || 0),
      active: activeEl.checked,
      unit_id: APP_CONFIG.unitId,
      avatar: '💈',
      updated_at: nowIso()
    };

    const duplicate = rows.some((r) => r.email.toLowerCase() === payload.email.toLowerCase() && r.id !== payload.id);
    if (duplicate) return;

    const idx = rows.findIndex((r) => r.id === payload.id);
    if (idx >= 0) rows[idx] = { ...rows[idx], ...payload };
    else rows.push({ ...payload, created_at: nowIso() });

    saveBarbers(rows);
    logAudit('barber_saved', { barber_id: payload.id });
    reset();
    render();
  });

  cancelEl.addEventListener('click', reset);
  render();
}

function initBlockedSlotsPage() {
  const form = document.getElementById('blocked-slot-form');
  const listEl = document.getElementById('blocked-slot-list');
  if (!form || !listEl) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;

  const barberEl = document.getElementById('blocked-barber');
  const startEl = document.getElementById('blocked-start');
  const endEl = document.getElementById('blocked-end');
  const reasonEl = document.getElementById('blocked-reason');

  populateSelect(barberEl, getBarbers(true), 'Selecione o barbeiro');

  function render() {
    const rows = getBlockedSlots();
    if (!rows.length) {
      listEl.innerHTML = '<div class="empty-state"><h2>Sem bloqueios cadastrados</h2></div>';
      return;
    }
    listEl.innerHTML = rows
      .map((b) => `<article class="schedule-item"><h3>${b.barber_name}</h3><p>${new Date(b.start_datetime).toLocaleString('pt-BR')} até ${new Date(b.end_datetime).toLocaleString('pt-BR')}</p><small>${b.reason}</small><div class="form-row"><button class="button button-secondary" data-delete="${b.id}" type="button">Excluir bloqueio</button></div></article>`)
      .join('');

    listEl.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        saveBlockedSlots(getBlockedSlots().filter((b) => b.id !== btn.dataset.delete));
        logAudit('blocked_slot_deleted', { id: btn.dataset.delete });
        render();
      });
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const barber = getBarbers().find((b) => b.id === barberEl.value);
    if (!barber) return;

    const start = new Date(startEl.value);
    const end = new Date(endEl.value);
    if (!(start < end)) return;

    const rows = getBlockedSlots();
    rows.unshift({ id: `blk_${Date.now()}`, unit_id: APP_CONFIG.unitId, barber_id: barber.id, barber_name: barber.name, start_datetime: start.toISOString(), end_datetime: end.toISOString(), reason: reasonEl.value.trim(), created_at: nowIso(), updated_at: nowIso() });
    saveBlockedSlots(rows);
    logAudit('blocked_slot_created', { barber_id: barber.id });
    form.reset();
    render();
  });

  render();
}

function initAdminFinancePage() {
  const metricsEl = document.getElementById('finance-metrics');
  const detailsEl = document.getElementById('finance-by-barber');
  const summaryEl = document.getElementById('finance-summary-note');
  const servicesEl = document.getElementById('finance-services');
  const paymentsEl = document.getElementById('finance-payment-status');
  const exportsEl = document.getElementById('finance-export-actions');
  const dailyEl = document.getElementById('finance-daily-performance');
  const periodButtons = Array.from(document.querySelectorAll('[data-finance-period]'));
  if (!metricsEl || !detailsEl) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;

  const allAppointments = getAppointments().filter((a) => (a.unit_id || APP_CONFIG.unitId) === APP_CONFIG.unitId);
  const allPayments = getJson(STORAGE_KEYS.payments, []).filter((p) => p.unit_id === APP_CONFIG.unitId);

  if (exportsEl) {
    exportsEl.innerHTML = `
      <button class="button button-secondary" type="button" data-export="revenue">Exportar faturamento CSV</button>
      <button class="button button-secondary" type="button" data-export="commissions">Exportar comissoes CSV</button>
      <button class="button button-secondary" type="button" data-export="clients">Exportar clientes CSV</button>
      <button class="button button-secondary" type="button" data-export="stock">Exportar estoque CSV</button>
    `;
  }

  (exportsEl || document).querySelectorAll('[data-export]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.export;
      if (type === 'revenue') {
        const rows = getJson(STORAGE_KEYS.payments, [])
          .filter((p) => p.unit_id === APP_CONFIG.unitId)
          .map((p) => ({ paid_at: p.paid_at, amount: p.amount, status: p.status, appointment_id: p.appointment_id }));
        downloadCsv('faturamento-mensal.csv', rows);
      }
      if (type === 'commissions') {
        const rows = getJson(STORAGE_KEYS.commissions, [])
          .filter((c) => c.unit_id === APP_CONFIG.unitId)
          .map((c) => ({ barber_id: c.barber_id, appointment_id: c.appointment_id, commission_amount: c.commission_amount, calculated_at: c.calculated_at }));
        downloadCsv('comissoes-por-barbeiro.csv', rows);
      }
      if (type === 'clients') {
        const grouped = {};
        allAppointments.forEach((a) => {
          grouped[a.client_email] = (grouped[a.client_email] || 0) + 1;
        });
        const rows = Object.entries(grouped).map(([client_email, appointments]) => ({ client_email, appointments }));
        downloadCsv('clientes-ativos.csv', rows);
      }
      if (type === 'stock') {
        const rows = getProductMovements().map((m) => ({ product_id: m.product_id, type: m.type, quantity: m.quantity, reason: m.reason, created_at: m.created_at }));
        downloadCsv('movimentacao-estoque.csv', rows);
      }
    });
  });

  const rangeForPeriod = (period) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);

    if (period === 'today') {
      end.setDate(end.getDate() + 1);
      return { start, end, label: 'Hoje' };
    }

    if (period === 'week') {
      const day = start.getDay();
      const diffToMonday = (day + 6) % 7;
      start.setDate(start.getDate() - diffToMonday);
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 7);
      return { start, end, label: 'Semana' };
    }

    start.setDate(1);
    end.setMonth(start.getMonth() + 1);
    return { start, end, label: 'Mes' };
  };

  const inRange = (value, range) => {
    const d = new Date(value || 0);
    return Number.isFinite(d.getTime()) && d >= range.start && d < range.end;
  };

  const render = (period = 'today') => {
    const range = rangeForPeriod(period);
    const appointments = allAppointments.filter((a) => inRange(a.start_datetime, range));
    const paidPayments = allPayments.filter((p) => p.status === 'paid' && inRange(p.paid_at || p.created_at, range));

    const total = appointments.length;
    const completed = appointments.filter((a) => a.status === 'completed');
    const canceled = appointments.filter((a) => a.status === 'canceled');
    const active = appointments.filter((a) => ['awaiting_payment', 'pending', 'confirmed'].includes(a.status));

    const revenue = paidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const avgTicket = completed.length ? revenue / completed.length : 0;
    const cancellationRate = total ? (canceled.length / total) * 100 : 0;
    const expectedRevenue = active.reduce((sum, a) => sum + Number(a.service_price || 0), 0);

    metricsEl.innerHTML = `
      <article class="finance-kpi-card"><h3>Faturamento</h3><p>${asCurrency(revenue)}</p><small>${range.label}</small></article>
      <article class="finance-kpi-card"><h3>Atendimentos concluidos</h3><p>${completed.length}</p><small>de ${total} agendamentos</small></article>
      <article class="finance-kpi-card"><h3>Ticket medio</h3><p>${asCurrency(avgTicket)}</p><small>por servico concluido</small></article>
      <article class="finance-kpi-card"><h3>Cancelamentos</h3><p>${cancellationRate.toFixed(0)}%</p><small>${canceled.length} no periodo</small></article>
      <article class="finance-kpi-card"><h3>Receita prevista</h3><p>${asCurrency(expectedRevenue)}</p><small>agendamentos em aberto</small></article>
      <article class="finance-kpi-card"><h3>Pagamentos aprovados</h3><p>${paidPayments.length}</p><small>transacoes pagas</small></article>
    `;

    if (summaryEl) {
      summaryEl.textContent = `Visao de ${range.label.toLowerCase()}: ${total} agendamentos, ${completed.length} concluidos e ${canceled.length} cancelados.`;
    }

    const byBarber = {};
    completed.forEach((a) => {
      const key = a.barber_name || 'Sem barbeiro';
      byBarber[key] = (byBarber[key] || 0) + Number(a.service_price || 0);
    });
    const barberRows = Object.entries(byBarber)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topBarberAmount = barberRows[0]?.[1] || 0;
    detailsEl.innerHTML = barberRows.length
      ? barberRows
        .map(([name, amount]) => `
          <article class="finance-list-card">
            <div class="finance-list-row"><h3>${name}</h3><strong>${asCurrency(amount)}</strong></div>
            <div class="finance-progress"><span style="width:${topBarberAmount ? Math.max(8, (amount / topBarberAmount) * 100) : 8}%"></span></div>
          </article>
        `)
        .join('')
      : '<article class="finance-list-card"><p>Sem faturamento por barbeiro neste periodo.</p></article>';

    const byService = {};
    completed.forEach((a) => {
      const key = a.service_name || 'Servico';
      byService[key] = (byService[key] || 0) + Number(a.service_price || 0);
    });
    const serviceRows = Object.entries(byService)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topService = serviceRows[0]?.[1] || 0;
    if (servicesEl) {
      servicesEl.innerHTML = serviceRows.length
        ? serviceRows
          .map(([name, amount]) => `
            <article class="finance-list-card">
              <div class="finance-list-row"><h3>${name}</h3><strong>${asCurrency(amount)}</strong></div>
              <div class="finance-progress"><span style="width:${topService ? Math.max(8, (amount / topService) * 100) : 8}%"></span></div>
            </article>
          `)
          .join('')
        : '<article class="finance-list-card"><p>Sem receita por servico neste periodo.</p></article>';
    }

    if (paymentsEl) {
      const paymentGroups = allPayments
        .filter((p) => inRange(p.paid_at || p.created_at, range))
        .reduce((acc, p) => {
          const key = p.status || 'pending';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
      const statuses = ['paid', 'pending', 'failed', 'refunded'];
      paymentsEl.innerHTML = statuses
        .map((status) => `<article class="finance-status-card"><h3>${status}</h3><p>${paymentGroups[status] || 0}</p></article>`)
        .join('');
    }

    if (dailyEl) {
      const days = [];
      for (let d = new Date(range.start); d < range.end; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
      }
      const dayRows = days.map((day) => {
        const key = day.toISOString().slice(0, 10);
        const dayRevenue = paidPayments
          .filter((p) => (p.paid_at || p.created_at || '').slice(0, 10) === key)
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        return { key, label: day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), value: dayRevenue };
      });
      const maxValue = Math.max(...dayRows.map((r) => r.value), 0);
      dailyEl.innerHTML = dayRows.length
        ? dayRows
          .map((row) => `
            <article class="finance-day-row">
              <span>${row.label}</span>
              <div class="finance-progress"><span style="width:${maxValue ? Math.max(6, (row.value / maxValue) * 100) : 6}%"></span></div>
              <strong>${asCurrency(row.value)}</strong>
            </article>
          `)
          .join('')
        : '<article class="finance-list-card"><p>Sem movimentacao diaria para exibir.</p></article>';
    }

    periodButtons.forEach((btn) => {
      const isActive = (btn.dataset.financePeriod || 'today') === period;
      btn.classList.toggle('button-primary', isActive);
      btn.classList.toggle('button-secondary', !isActive);
      btn.classList.toggle('opacity-80', !isActive);
    });
  };

  periodButtons.forEach((btn) => {
    btn.addEventListener('click', () => render(btn.dataset.financePeriod || 'today'));
  });

  render('today');
}

function initAdminDashboard() {
  const wrap = document.getElementById('admin-metrics');
  if (!wrap) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;

  const unitLabel = document.getElementById('admin-unit-label');
  if (unitLabel) {
    const brand = getBrandSettings();
    unitLabel.textContent = brand?.shopName || APP_CONFIG.unitId || 'Unidade atual';
  }

  const metrics = getDashboardMetrics();
  renderMetrics(wrap, metrics);

  const lowStock = getProducts().filter((p) => Number(p.quantity) <= Number(p.minimum_stock));
  if (lowStock.length) {
    const alerts = lowStock.map((p) => `${p.name} (${p.quantity})`).join(', ');
    const alertCard = document.createElement('article');
    alertCard.className = 'admin-alert-card';
    alertCard.innerHTML = `<div class="admin-alert-head"><span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4"></path><path d="M12 17h.01"></path><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"></path></svg></span><h3>Alerta de estoque baixo</h3></div><p>${alerts}</p>`;
    wrap.appendChild(alertCard);
  }

  const appointmentsRoot = document.getElementById('admin-appointments-summary');
  const financeRoot = document.getElementById('admin-finance-summary');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const appointments = getAppointments();
  const todayAppointments = appointments.filter((a) => {
    const d = new Date(a.start_datetime);
    return d >= startOfToday && d < new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  });
  const weekAppointments = appointments.filter((a) => {
    const d = new Date(a.start_datetime);
    return d >= startOfWeek && d < endOfWeek;
  });
  const dashboardQueueStatuses = ['pending', 'confirmed'];
  const todayQueueAppointments = todayAppointments.filter((a) => dashboardQueueStatuses.includes(a.status));
  const weekQueueAppointments = weekAppointments.filter((a) => dashboardQueueStatuses.includes(a.status));
  const queuePageSize = 3;
  let queuePage = 0;

  const renderAppointments = (queueRows, label) => {
    if (!appointmentsRoot) return;

    const sortedQueueRows = [...queueRows].sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
    const totalPages = Math.max(1, Math.ceil(sortedQueueRows.length / queuePageSize));
    queuePage = Math.max(0, Math.min(queuePage, totalPages - 1));
    const pageStart = queuePage * queuePageSize;
    const pageRows = sortedQueueRows.slice(pageStart, pageStart + queuePageSize);

    const queueList = pageRows
      .map((a) => `<article class="admin-list-item"><h3>${a.service_name}</h3><p>${formatBookingDateTime(a.appointment_date, a.start_time)}</p><small>${a.barber_name} · ${getBookingStatusLabel(a.status)}</small></article>`)
      .join('');

    const queueControls = sortedQueueRows.length > queuePageSize
      ? `
        <div class="mt-2 flex items-center justify-between gap-2">
          <button type="button" class="button button-secondary !min-h-10 !px-4 !text-xs md:!text-sm rounded-xl" data-queue-prev ${queuePage === 0 ? 'disabled' : ''}>Anterior</button>
          <small class="text-text-secondary">Parte ${queuePage + 1} de ${totalPages}</small>
          <button type="button" class="button button-primary !min-h-10 !px-4 !text-xs md:!text-sm rounded-xl" data-queue-next ${queuePage >= totalPages - 1 ? 'disabled' : ''}>Próximos 3</button>
        </div>
      `
      : '';

    appointmentsRoot.innerHTML = `
      <div class="grid gap-3">
        <article>
          <header class="admin-panel-head"><div><h3>Agendamentos na fila (${label})</h3><small>Somente pendentes e confirmados</small></div><span>${sortedQueueRows.length} registros</span></header>
          <div class="grid gap-2">${queueList || '<article class="admin-list-item"><p>Sem agendamentos na fila.</p></article>'}</div>
          ${queueControls}
        </article>
      </div>
    `;

    appointmentsRoot.querySelector('[data-queue-prev]')?.addEventListener('click', () => {
      queuePage = Math.max(0, queuePage - 1);
      renderAppointments(sortedQueueRows, label);
    });

    appointmentsRoot.querySelector('[data-queue-next]')?.addEventListener('click', () => {
      queuePage = Math.min(totalPages - 1, queuePage + 1);
      renderAppointments(sortedQueueRows, label);
    });
  };

  const payments = getJson(STORAGE_KEYS.payments, []).filter((p) => p.unit_id === APP_CONFIG.unitId && p.status === 'paid');
  const revenueToday = payments
    .filter((p) => {
      const d = new Date(p.paid_at || p.created_at || 0);
      return d >= startOfToday && d < new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    })
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const revenueWeek = payments
    .filter((p) => {
      const d = new Date(p.paid_at || p.created_at || 0);
      return d >= startOfWeek && d < endOfWeek;
    })
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const renderFinance = (revenue, totalAppointments, label) => {
    if (!financeRoot) return;
    const avgTicket = totalAppointments ? revenue / totalAppointments : 0;
    financeRoot.innerHTML = `
      <header class="admin-panel-head"><div><h3>Resumo financeiro (${label})</h3><small>Atualizado agora</small></div><span>Performance</span></header>

            ${['pending', 'confirmed'].includes(String(next.status || '')) && !canCheckIn ? `
              <p class="text-xs text-text-secondary">Check-in habilita automaticamente entre 15 e 30 minutos antes do horario.</p>
            ` : ""}
      <div class="grid gap-2 md:grid-cols-2">
        <article class="admin-list-item"><h3>Faturamento</h3><p>${asCurrency(revenue)}</p></article>
        <article class="admin-list-item"><h3>Ticket médio</h3><p>${asCurrency(avgTicket)}</p></article>
      </div>
    `;
  };

  const tabButtons = Array.from(document.querySelectorAll('[data-admin-tab]'));
  const setTab = (tab) => {
    tabButtons.forEach((btn) => {
      const isActive = btn.dataset.adminTab === tab;
      btn.classList.toggle('button-primary', isActive);
      btn.classList.toggle('button-secondary', !isActive);
      btn.classList.toggle('ring-2', isActive);
      btn.classList.toggle('ring-primary/40', isActive);
      btn.classList.toggle('shadow-md', isActive);
      btn.classList.toggle('scale-[1.01]', isActive);
      btn.classList.toggle('opacity-90', !isActive);
    });

    queuePage = 0;
    if (tab === 'today') {
      renderAppointments(todayQueueAppointments, 'Hoje');
      renderFinance(revenueToday, todayAppointments.length, 'Hoje');
    } else {
      renderAppointments(weekQueueAppointments, 'Esta semana');
      renderFinance(revenueWeek, weekAppointments.length, 'Semana');
    }
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => setTab(btn.dataset.adminTab || 'today'));
  });

  setTab('today');
}

function initAdminStatusRequestsPage() {
  const root = document.getElementById('admin-status-requests-root');
  if (!root) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;

  const filterButtons = Array.from(document.querySelectorAll('[data-request-filter]'));
  const counterPending = document.getElementById('admin-request-count-pending');
  const counterApproved = document.getElementById('admin-request-count-approved');
  const counterRejected = document.getElementById('admin-request-count-rejected');
  let currentFilter = 'pending';

  const statusBadgeClass = (status) => {
    if (status === 'pending') return 'status-awaiting_payment';
    if (status === 'approved') return 'status-completed';
    if (status === 'rejected') return 'status-no_show';
    return '';
  };

  const render = () => {
    const allRows = getStatusChangeRequests().sort((a, b) => new Date(b.requested_at || 0) - new Date(a.requested_at || 0));
    const pending = allRows.filter((row) => row.status === 'pending');
    const approved = allRows.filter((row) => row.status === 'approved');
    const rejected = allRows.filter((row) => row.status === 'rejected');

    if (counterPending) counterPending.textContent = String(pending.length);
    if (counterApproved) counterApproved.textContent = String(approved.length);
    if (counterRejected) counterRejected.textContent = String(rejected.length);

    filterButtons.forEach((button) => {
      const active = button.getAttribute('data-request-filter') === currentFilter;
      button.classList.toggle('button-primary', active);
      button.classList.toggle('button-secondary', !active);
    });

    const rows = currentFilter === 'all' ? allRows : allRows.filter((row) => row.status === currentFilter);
    if (!rows.length) {
      root.innerHTML = '<article class="schedule-item"><h3>Sem solicitações</h3><p>Nenhum item encontrado para o filtro selecionado.</p></article>';
      return;
    }

    root.innerHTML = rows.map((row) => {
      const id = String(row.id || '');
      const currentStatus = sanitizeText(getBookingStatusLabel(row.current_status || '-'));
      const requestedStatus = sanitizeText(getBookingStatusLabel(row.requested_status || '-'));
      const statusLabel = sanitizeText(getBookingStatusLabel(row.status || '-'));
      const isPending = row.status === 'pending';
      return `
        <article class="barber-appointment-card">
          <div class="barber-appointment-header">
            <div class="grid gap-1.5">
              <p class="barber-appointment-title">Solicitação #${id.slice(0, 8)}</p>
              <p class="text-xs text-text-secondary">Barbeiro: <strong class="text-text-primary">${sanitizeText(row.barber_name || row.barber_email || '-')}</strong></p>
              <p class="text-xs text-text-secondary">Cliente: <strong class="text-text-primary">${sanitizeText(row.client_name || row.client_email || '-')}</strong></p>
              <p class="text-xs text-text-secondary">Solicitado em: <strong class="text-text-primary">${new Date(row.requested_at || 0).toLocaleString('pt-BR')}</strong></p>
              <p class="text-xs text-text-secondary">Status atual: <strong class="text-text-primary">${currentStatus}</strong></p>
              <p class="text-xs text-text-secondary">Status solicitado: <strong class="text-primary">${requestedStatus}</strong></p>
              <p class="text-xs text-text-secondary">Motivo: <strong class="text-text-primary">${sanitizeText(row.reason || 'Sem justificativa.')}</strong></p>
              ${row.review_note ? `<p class="text-xs text-text-secondary">Nota do admin: <strong class="text-text-primary">${sanitizeText(row.review_note)}</strong></p>` : ''}
            </div>
            <div class="flex flex-col items-start gap-2 md:items-end">
              <span class="barber-badge ${statusBadgeClass(row.status)}">${statusLabel}</span>
              <span class="barber-badge">AG: ${sanitizeText(String(row.appointment_id || '').slice(0, 8))}</span>
            </div>
          </div>
          ${isPending ? `
            <div class="barber-appointment-actions">
              <div class="barber-actions-row">
                <input class="input" id="request-note-${id}" placeholder="Nota opcional da análise" />
                <button type="button" class="button button-primary min-h-10 w-full" data-request-approve="${id}">Confirmar</button>
                <button type="button" class="button button-secondary min-h-10 w-full" data-request-reject="${id}">Rejeitar</button>
              </div>
            </div>
          ` : ''}
        </article>
      `;
    }).join('');

    root.querySelectorAll('[data-request-approve]').forEach((button) => {
      button.addEventListener('click', async () => {
        const requestId = button.getAttribute('data-request-approve');
        if (!requestId) return;
        const all = getStatusChangeRequests();
        const idx = all.findIndex((item) => String(item.id) === requestId);
        if (idx < 0) return;
        const row = all[idx];
        const note = sanitizeText(root.querySelector(`#request-note-${requestId}`)?.value || '');
        const reviewer = getSession();
        all[idx] = {
          ...row,
          status: 'approved',
          reviewed_by_name: reviewer?.name || reviewer?.email || 'admin',
          reviewed_at: nowIso(),
          review_note: note || null,
          updated_at: nowIso()
        };
        saveStatusChangeRequests(all);
        updateAppointmentStatus(row.appointment_id, row.requested_status, { status_reason: row.reason || null });
        logAudit('admin_status_change_request_approved', { request_id: requestId, appointment_id: row.appointment_id, requested_status: row.requested_status });
        await alertAction('Solicitação aprovada e status aplicado no agendamento.');
        render();
      });
    });

    root.querySelectorAll('[data-request-reject]').forEach((button) => {
      button.addEventListener('click', async () => {
        const requestId = button.getAttribute('data-request-reject');
        if (!requestId) return;
        const all = getStatusChangeRequests();
        const idx = all.findIndex((item) => String(item.id) === requestId);
        if (idx < 0) return;
        const row = all[idx];
        const note = sanitizeText(root.querySelector(`#request-note-${requestId}`)?.value || '');
        const reviewer = getSession();
        all[idx] = {
          ...row,
          status: 'rejected',
          reviewed_by_name: reviewer?.name || reviewer?.email || 'admin',
          reviewed_at: nowIso(),
          review_note: note || null,
          updated_at: nowIso()
        };
        saveStatusChangeRequests(all);
        logAudit('admin_status_change_request_rejected', { request_id: requestId, appointment_id: row.appointment_id });
        await alertAction('Solicitação rejeitada.');
        render();
      });
    });
  };

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      currentFilter = button.getAttribute('data-request-filter') || 'pending';
      render();
    });
  });

  render();
}


function initClientHomePage() {
  const wrap = document.getElementById('client-branding');
  if (!wrap) return;
  const brand = getBrandSettings();
  const nameEl = document.getElementById('client-brand-name');
  const logoEl = document.getElementById('client-brand-logo');
  if (nameEl) nameEl.textContent = brand.shopName;
  if (logoEl) {
    if (brand.logoUrl) {
      logoEl.src = brand.logoUrl;
      logoEl.style.display = 'block';
    } else logoEl.style.display = 'none';
  }

  const session = getSession();
  if (!session || !hasRole('client')) {
    window.location.href = 'login.html?redirect=client-home.html';
    return;
  }

  const appointments = getAppointments().filter((a) => a.client_email === session.email);
  const next = appointments
    .filter((a) => ['awaiting_payment', 'pending', 'confirmed'].includes(a.status) && new Date(a.start_datetime).getTime() >= Date.now())
    .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))[0];


  const metrics = document.getElementById('client-quick-metrics');
  if (metrics) metrics.innerHTML = '';

  const nextWrap = document.getElementById('client-next-appointment');
  if (nextWrap) {
    if (!next) {
      nextWrap.innerHTML = `<article class="schedule-item"><h3>Próximo agendamento</h3><p>Nenhum horário futuro encontrado.</p></article>`;
    } else {
      const minutesToStart = (new Date(next.start_datetime || 0).getTime() - Date.now()) / 60000;
      const checkInWindowOpen = Number.isFinite(minutesToStart) && minutesToStart >= 15 && minutesToStart <= 30;
      const canCheckIn = ['pending', 'confirmed'].includes(String(next.status || '')) && checkInWindowOpen;
      const statusLabel = getBookingStatusLabel(next.status);
      const statusTone =
        next.status === 'confirmed'
          ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/40'
          : next.status === 'awaiting_payment'
            ? 'bg-amber-500/15 text-amber-200 border-amber-400/40'
            : 'bg-sky-500/15 text-sky-200 border-sky-400/40';

      nextWrap.innerHTML = `
        <article class="group relative overflow-hidden rounded-2xl border border-borderc bg-gradient-to-br from-slate-950/70 via-slate-900/60 to-slate-950/70 p-4 md:p-5 shadow-soft transition-all duration-300 hover:border-primary/45 hover:shadow-[0_14px_45px_rgba(198,154,69,0.15)] hover:-translate-y-[1px]">
          <div class="pointer-events-none absolute -top-16 -right-14 h-44 w-44 rounded-full bg-primary/10 blur-2xl transition-transform duration-500 group-hover:scale-110"></div>
          <div class="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl transition-transform duration-500 group-hover:scale-110"></div>
          <div class="relative grid gap-4">
            <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary/90">Próximo agendamento</p>
                <h3 class="text-xl font-semibold text-text-primary md:text-2xl">${next.service_name}</h3>
              </div>

              <span class="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusTone}">
                <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                ${statusLabel}
              </span>
            </header>

            <div class="grid gap-3 md:grid-cols-2">
              <div class="rounded-xl border border-borderc/70 bg-slate-950/35 px-3 py-2.5 transition-all duration-200 hover:border-primary/35 hover:bg-slate-900/55">
                <p class="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-text-secondary"><span aria-hidden="true">📅</span> Data e hora</p>
                <p class="text-sm font-semibold text-text-primary">${formatBookingDateTime(next.appointment_date, next.start_time)}</p>
              </div>
              <div class="rounded-xl border border-borderc/70 bg-slate-950/35 px-3 py-2.5 transition-all duration-200 hover:border-primary/35 hover:bg-slate-900/55">
                <p class="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-text-secondary"><span aria-hidden="true">💈</span> Profissional</p>
                <p class="text-sm font-semibold text-text-primary">${next.barber_name}</p>
              </div>
              <div class="rounded-xl border border-borderc/70 bg-slate-950/35 px-3 py-2.5 transition-all duration-200 hover:border-primary/35 hover:bg-slate-900/55">
                <p class="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-text-secondary"><span aria-hidden="true">📍</span> Unidade</p>
                <p class="text-sm font-semibold text-text-primary">${next.branch}</p>
              </div>
              <div class="rounded-xl border border-borderc/70 bg-slate-950/35 px-3 py-2.5 transition-all duration-200 hover:border-primary/35 hover:bg-slate-900/55">
                <p class="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-text-secondary"><span aria-hidden="true">🌆</span> Cidade</p>
                <p class="text-sm font-semibold text-text-primary">${next.city || 'Porto Alegre'}</p>
              </div>
            </div>

            <div class="grid gap-2 md:grid-cols-2">
              <button class="button button-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 min-h-11 font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary bg-primary text-zinc-900 hover:bg-primary-dark hover:shadow-md hover:scale-[1.01] active:scale-[0.99]" data-client-reschedule="${next.id}">
                  <span aria-hidden="true">↻</span> Reagendar
              </button>
              <button class="button button-secondary inline-flex items-center justify-center gap-2 rounded-xl px-4 min-h-11 font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary border border-borderc bg-surface text-text-primary hover:border-primary/70 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]" data-client-cancel="${next.id}">
                  <span aria-hidden="true">✕</span> Cancelar
              </button>
            </div>
            ${['pending', 'confirmed'].includes(String(next.status || '')) && !canCheckIn ? `
              <p class="text-xs text-text-secondary">Check-in habilita automaticamente entre 15 e 30 minutos antes do horario.</p>
            ` : ""}
            ${canCheckIn ? `
              <button class="relative inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-xl border border-emerald-400/60 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 px-4 font-extrabold uppercase tracking-wide text-slate-950 shadow-[0_0_24px_rgba(16,185,129,0.35)] transition duration-200 hover:brightness-105" data-client-checkin="${next.id}">
                <span class="absolute inset-0 animate-pulse bg-white/10"></span>
                <span class="relative">Realizar check-in</span>
              </button>
            ` : ""}
          </div>
        </article>
      `;
      nextWrap.querySelector('[data-client-reschedule]')?.addEventListener('click', () => {
        const city = BASE_DATA.cities.find((c) => c.name === next.city);
        const branch = city?.branches.find((x) => x.name === next.branch);
        saveBooking({ city: city?.id || 'poa', branch: branch?.id || 'bom-fim', service: next.service_id, professional: next.barber_id, date: next.appointment_date, time: next.start_time, edit_appointment_id: next.id });
        window.location.href = 'booking-datetime.html?edit=datetime';
      });
      nextWrap.querySelector('[data-client-cancel]')?.addEventListener('click', async () => {
        if (!(await confirmAction('Deseja realmente cancelar este agendamento?'))) return;
        updateAppointmentStatus(next.id, 'canceled');
        initClientHomePage();
      });
      nextWrap.querySelector('[data-client-checkin]')?.addEventListener('click', async () => {
        const confirmed = await confirmAction('Deseja confirmar seu check-in agora?', {
          title: 'Confirmacao de check-in',
          confirmText: 'Confirmar check-in',
          cancelText: 'Voltar'
        });
        if (!confirmed) return;
        const checkInAt = nowIso();
        updateAppointmentStatus(next.id, 'completed', {
          check_in_time: checkInAt,
          check_in_by: 'client',
          service_completed_at: checkInAt
        });
        await alertAction('Check-in confirmado com sucesso.', {
          title: 'Presenca confirmada',
          confirmText: 'Fechar',
          hideCancel: true
        });
        initClientHomePage();
      });
    }
  }

  const stats = document.getElementById('client-stats');
  if (stats) stats.innerHTML = '';

  const notif = document.getElementById('client-notifications');
  if (notif) notif.innerHTML = '';
}

function initAdminSettingsPage() {
  const form = document.getElementById('admin-settings-form');
  if (!form) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;

  const nameEl = document.getElementById('shop-name');
  const logoUrlEl = document.getElementById('shop-logo-url');
  const logoFileEl = document.getElementById('shop-logo-file');
  const uploadBtn = document.getElementById('shop-logo-trigger');
  const fileLabelEl = document.getElementById('shop-logo-file-label');
  const previewName = document.getElementById('brand-preview-name');
  const previewLogo = document.getElementById('brand-preview-logo');
  const previewPlaceholder = document.getElementById('brand-preview-placeholder');

  const brand = getBrandSettings();
  nameEl.value = brand.shopName;
  if (logoUrlEl) logoUrlEl.value = brand.logoUrl;

  const updatePreview = (logo) => {
    previewName.textContent = nameEl.value || 'BarberPro';
    if (previewLogo && logo) {
      previewLogo.src = logo;
      previewLogo.style.display = 'block';
      if (previewPlaceholder) previewPlaceholder.style.display = 'none';
    } else {
      if (previewLogo) previewLogo.style.display = 'none';
      if (previewPlaceholder) previewPlaceholder.style.display = 'inline-flex';
    }
  };

  updatePreview(brand.logoUrl);
  nameEl.addEventListener('input', () => updatePreview(logoUrlEl?.value || ''));
  if (uploadBtn && logoFileEl) {
    uploadBtn.addEventListener('click', () => logoFileEl.click());
  }

  logoFileEl?.addEventListener('change', () => {
    const file = logoFileEl.files?.[0];
    if (!file) return;
    if (fileLabelEl) fileLabelEl.textContent = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      if (logoUrlEl) logoUrlEl.value = String(reader.result || '');
      updatePreview(logoUrlEl?.value || '');
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    saveBrandSettings({ shopName: nameEl.value.trim() || 'BarberPro', logoUrl: (logoUrlEl?.value || '').trim() });
    applyBrandTheme();
    logAudit('brand_updated', { shopName: nameEl.value.trim() });
    await alertAction('Configuracoes atualizadas com sucesso.', { title: 'Tudo certo', confirmText: 'Fechar' });
  });
}

function initUnitSettingsPage() {
  const form = document.getElementById('unit-settings-form');
  if (!form) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;

  const fields = {
    opening_time: document.getElementById('us-opening-time'),
    closing_time: document.getElementById('us-closing-time'),
    slot_interval_minutes: document.getElementById('us-slot-interval'),
    cancellation_limit_hours: document.getElementById('us-cancel-limit'),
    prepayment_enabled: document.getElementById('us-prepayment-enabled')
  };

  const current = getUnitSettings();
  Object.entries(fields).forEach(([k, el]) => {
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!current[k];
    else el.value = current[k];
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveUnitSettings({
      opening_time: fields.opening_time.value,
      closing_time: fields.closing_time.value,
      slot_interval_minutes: Number(fields.slot_interval_minutes.value),
      cancellation_limit_hours: Number(fields.cancellation_limit_hours.value),
      prepayment_enabled: fields.prepayment_enabled.checked
    });
  });
}

function initStockPage() {
  const form = document.getElementById('product-form');
  const listEl = document.getElementById('products-list');
  if (!form || !listEl) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;

  const idEl = document.getElementById('product-id');
  const nameEl = document.getElementById('product-name');
  const qtyEl = document.getElementById('product-quantity');
  const minEl = document.getElementById('product-minimum');

  function reset() {
    idEl.value = '';
    nameEl.value = '';
    qtyEl.value = '0';
    minEl.value = '0';
  }

  function render() {
    const rows = getProducts();
    listEl.innerHTML = rows
      .map((p) => `<article class="schedule-item"><h3>${p.name}</h3><p>Quantidade: ${p.quantity} · Mínimo: ${p.minimum_stock}</p><div class="form-row"><button type="button" class="button button-secondary" data-edit="${p.id}">Editar</button><button type="button" class="button button-secondary" data-delete="${p.id}">Excluir</button></div></article>`)
      .join('');

    listEl.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = rows.find((x) => x.id === btn.dataset.edit);
        if (!p) return;
        idEl.value = p.id;
        nameEl.value = p.name;
        qtyEl.value = String(p.quantity);
        minEl.value = String(p.minimum_stock);
      });
    });

    listEl.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = rows.map((x) => (x.id === btn.dataset.delete ? { ...x, deleted_at: nowIso(), updated_at: nowIso() } : x));
        saveProducts(next);
        logAudit('product_soft_deleted', { product_id: btn.dataset.delete });
        render();
      });
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rows = getProducts();
    const payload = {
      id: idEl.value || slugify(nameEl.value),
      unit_id: APP_CONFIG.unitId,
      name: nameEl.value.trim(),
      quantity: Number(qtyEl.value || 0),
      minimum_stock: Number(minEl.value || 0),
      created_at: nowIso(),
      updated_at: nowIso()
    };

    const idx = rows.findIndex((x) => x.id === payload.id);
    if (idx >= 0) rows[idx] = { ...rows[idx], ...payload, updated_at: nowIso() };
    else rows.push(payload);

    saveProducts(rows);
    logAudit('product_saved', { product_id: payload.id });
    reset();
    render();
  });

  render();
}

function initClientSubscriptionsPage() {
  const root = document.getElementById('client-subscriptions-root');
  if (!root) return;

  const session = getSession();
  if (!session || !hasRole('client')) {
    root.innerHTML = '<div class="empty-state"><h2>Faça login como cliente</h2><p>Você precisa entrar para assinar um plano.</p><a class="button button-primary" href="login.html?redirect=client-subscriptions.html">Efetuar login</a></div>';
    return;
  }

  ensureDefaultSubscriptionPlans();
  const planOrder = ['plano-bronze', 'plano-prata', 'plano-ouro'];
  const plans = getSubscriptionPlans()
    .filter((p) => planOrder.includes(p.id) && p.is_active !== false)
    .sort((a, b) => planOrder.indexOf(a.id) - planOrder.indexOf(b.id));
  const subscriptions = getSubscriptions();
  const currentSub = subscriptions.filter((s) => s.user_id === session.email).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0] || null;
  const active = currentSub && currentSub.status === 'active' ? currentSub : null;
  const expiredBanner = currentSub && currentSub.status !== 'active' ? `<article class="schedule-item"><h3>⚠ Plano vencido</h3><p>Seu status atual é <strong>${currentSub.status}</strong>. O consumo de sessões está bloqueado até regularização.</p></article>` : '';
  root.innerHTML = `
    ${expiredBanner}<section class="subscription-info-stack">
      ${active ? `<article class=\"schedule-item subscription-static-card\"><h3>Assinatura ativa</h3><p>Plano: <strong>${active.plan_name || active.plan_id}</strong></p><p>Sessões restantes: ${active.remaining_sessions >= 9999 ? 'Ilimitadas' : active.remaining_sessions}</p><small>Válido até ${new Date(active.expires_at).toLocaleDateString('pt-BR')}</small></article>` : `<article class=\"schedule-item subscription-static-card\"><h3>Sem assinatura ativa</h3><p>Escolha um plano abaixo para começar.</p></article>`}
      <article class=\"schedule-item subscription-static-card\"><h3>Informações da assinatura</h3><p>Os planos são renovados mensalmente.</p><small>Você pode cancelar e contratar novamente quando quiser.</small></article>
    </section>
    <section class="subscription-plans-stack">
      <article class=\"schedule-item subscription-static-card\"><h3>Planos disponíveis</h3><p>Escolha seu plano e confirme a assinatura.</p></article>
      ${plans.map((p) => `<article class=\"schedule-item subscription-plan-card subscription-clickable-card\"><h3>${p.name}</h3><p>${asCurrency(p.price)} / mês</p><p>${p.sessions_per_month >= 9999 ? 'Cortes ilimitados' : `${p.sessions_per_month} cortes por mês`}</p><small>${(p.benefits || []).join(' • ')}</small><div class=\"form-row\"><button class=\"button button-primary\" data-subscribe=\"${p.id}\">Escolher ${p.name.replace(/^[🥉🥈🥇]\s*/, '')}</button></div></article>`).join('')}
    </section>
  `;

  root.querySelectorAll('[data-subscribe]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const plan = plans.find((x) => x.id === btn.dataset.subscribe);
      if (!plan) return;
      if (!(await confirmAction(`Confirmar assinatura do ${plan.name} por ${asCurrency(plan.price)} / mês?`))) return;
      const rows = getSubscriptions().filter((s) => s.user_id !== session.email);
      rows.unshift({
        id: `sub_${Date.now()}`,
        unit_id: APP_CONFIG.unitId,
        user_id: session.email,
        plan_id: plan.id,
        plan_name: plan.name,
        remaining_sessions: Number(plan.sessions_per_month || 0),
        expires_at: addMinutes(new Date(), Number(plan.duration_days || 30) * 24 * 60).toISOString(),
        status: 'active',
        created_at: nowIso(),
        updated_at: nowIso()
      });
      saveSubscriptions(rows);
      logAudit('client_subscription_created', { user_id: session.email, plan_id: plan.id });
      initClientSubscriptionsPage();
    });
  });
}


function initClientHistoryPage() {
  const root = document.getElementById('client-history-root');
  if (!root) return;
  const session = getSession();
  if (!session || !hasRole('client')) {
    window.location.href = 'login.html?redirect=client-history.html';
    return;
  }
  const appointments = getAppointments().filter((a) => a.client_email === session.email).sort((a, b) => new Date(b.start_datetime) - new Date(a.start_datetime));
  const payments = getJson(STORAGE_KEYS.payments, []);
  const reviews = getJson(STORAGE_KEYS.reviews, []);
  const usage = getSubscriptionUsage();
  root.innerHTML = appointments.map((a) => {
    const pay = payments.find((p) => p.appointment_id === a.id);
    const rev = reviews.find((r) => r.appointment_id === a.id);
    const usedSub = usage.some((u) => u.appointment_id === a.id);
    const reviewAction = a.status === 'completed' && !rev ? `<button class="button button-secondary" data-review="${a.id}">Avaliar</button>` : (rev ? `<small>Avaliação: ${rev.rating}/5</small>` : '');
    return `<article class="schedule-item"><h3>${a.service_name} · ${formatBookingDateTime(a.appointment_date, a.start_time)}</h3><p>${a.barber_name} · ${a.branch}</p><small>Status: ${a.status} · Pago: ${asCurrency(pay?.amount || a.service_price)} · Assinatura: ${usedSub ? 'Sim' : 'Não'}</small><div class="form-row">${reviewAction}</div></article>`;
  }).join('') || '<article class="schedule-item"><h3>Histórico vazio</h3></article>';
  root.querySelectorAll('[data-review]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const rating = Number(prompt('Avalie de 1 a 5', '5') || 0);
      if (rating < 1 || rating > 5) return;
      const comment = prompt('Comentário (opcional)', '') || '';
      const rows = getJson(STORAGE_KEYS.reviews, []);
      if (rows.some((r) => r.appointment_id === btn.dataset.review)) return;
      rows.unshift({ id: `rev_${Date.now()}`, appointment_id: btn.dataset.review, rating, comment, created_at: nowIso() });
      setJson(STORAGE_KEYS.reviews, rows);
      initClientHistoryPage();
    });
  });
}



function initClientProfilePage() {
  const form = document.getElementById('client-profile-form');
  if (!form) return;
  const session = getSession();
  if (!session || !hasRole('client')) {
    window.location.href = 'login.html?redirect=client-profile';
    return;
  }
  const profile = getClientProfile(session.email);
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const phoneEl = document.getElementById('profile-phone');
  const profileNameEl = document.getElementById('client-profile-name');
  const profileEmailEl = document.getElementById('client-profile-email');
  const profileAvatarEl = document.getElementById('client-profile-avatar');
  nameEl.value = profile.name || '';
  emailEl.value = profile.email || session.email;
  phoneEl.value = profile.phone || '';

  const syncProfilePreview = () => {
    if (profileNameEl) profileNameEl.textContent = nameEl.value || 'Cliente';
    if (profileEmailEl) profileEmailEl.textContent = emailEl.value || session.email;
    if (profileAvatarEl) {
      const initials = String(nameEl.value || 'Cliente')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
      profileAvatarEl.textContent = initials || 'CL';
    }
  };

  syncProfilePreview();
  nameEl.addEventListener('input', syncProfilePreview);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const patch = {
      name: sanitizeText(nameEl.value),
      phone: sanitizeText(phoneEl.value),
      updated_by: session.email
    };
    saveClientProfile(session.email, patch);
    logAudit('client_profile_updated', { user_id: session.email, changes: patch });
    let feedback = form.querySelector('[data-profile-feedback]');
    if (!feedback) {
      feedback = document.createElement('small');
      feedback.setAttribute('data-profile-feedback', '1');
      feedback.style.color = 'var(--text-secondary)';
      form.appendChild(feedback);
    }
    syncProfilePreview();
    feedback.textContent = 'Perfil salvo com sucesso.';
  });
}

function createClientNotificationsBell(session) {
  return null;
}

function initClientNotificationsPage() {
  const root = document.getElementById('client-notifications-root');
  if (!root) return;
  const session = getSession();
  if (!session || !hasRole('client')) {
    window.location.href = 'login.html?redirect=client-notifications.html';
    return;
  }
  const rows = getNotifications().filter((n) => n.user_id === session.email).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  root.innerHTML = rows.map((n) => `<article class="schedule-item"><h3>${n.type}</h3><p>${n.status}</p><small>${new Date(n.created_at || nowIso()).toLocaleString('pt-BR')}</small></article>`).join('') || '<article class="schedule-item"><h3>Sem notificações</h3></article>';
}

function initSubscriptionsPage() {
  const root = document.getElementById('subscriptions-root');
  if (!root) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;

  ensureDefaultSubscriptionPlans();
  const planOrder = ['plano-bronze', 'plano-prata', 'plano-ouro'];
  const plans = getSubscriptionPlans()
    .filter((p) => planOrder.includes(p.id) && p.is_active !== false)
    .sort((a, b) => planOrder.indexOf(a.id) - planOrder.indexOf(b.id));
  const subs = getSubscriptions();
  const activeSubs = subs.filter((s) => s.status === 'active');

  const byPlan = {};
  activeSubs.forEach((s) => {
    byPlan[s.plan_id] = (byPlan[s.plan_id] || 0) + 1;
  });

  root.innerHTML = `
    <article class="schedule-item"><h3>Resumo de assinaturas</h3><p>Total ativas: <strong>${activeSubs.length}</strong></p><small>Exibindo apenas planos ativos implementáveis.</small></article>
    ${plans.map((p) => `<article class="schedule-item"><h3>${p.name}</h3><p>${asCurrency(p.price)} / mês • ${p.sessions_per_month} cortes</p><small>${(p.benefits || []).join(' • ') || '-'}</small><p>Clientes assinantes: <strong>${byPlan[p.id] || 0}</strong></p></article>`).join('')}
    <article class="schedule-item"><h3>Assinaturas ativas (detalhado)</h3><p>${activeSubs.length ? activeSubs.map((s) => `${s.user_id} — Plano: ${s.plan_name || s.plan_id} (${s.remaining_sessions} cortes restantes)`).join(' · ') : 'Nenhuma assinatura ativa'}</p></article>
  `;
}



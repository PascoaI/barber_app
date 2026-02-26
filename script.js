const DEFAULT_UNIT_ID = 'unit_bom_fim';

const APP_CONFIG = {
  unitId: DEFAULT_UNIT_ID
};

const BASE_DATA = {
  units: [
    { id: DEFAULT_UNIT_ID, name: 'Barbearia X', city: 'Porto Alegre', address: 'Rua Fernandes Vieira, 631 - Bom Fim, Porto Alegre, RS' }
  ],
  cities: [
    {
      id: 'poa',
      name: 'Porto Alegre',
      branches: [{ id: 'bom-fim', name: 'Bom Fim', address: 'Rua Fernandes Vieira, 631 - Bom Fim, Porto Alegre, RS', unit_id: DEFAULT_UNIT_ID }]
    }
  ],
  services: [
    { id: 'corte', name: 'Corte', duration_minutes: 30, price: 72, barber_id: null, unit_id: DEFAULT_UNIT_ID, emoji: '✂️' },
    { id: 'corte-sobrancelha', name: 'Corte + Sobrancelha', duration_minutes: 45, price: 89, barber_id: null, unit_id: DEFAULT_UNIT_ID, emoji: '🧔' },
    { id: 'hidratacao', name: 'Hidratação', duration_minutes: 60, price: 58, barber_id: null, unit_id: DEFAULT_UNIT_ID, emoji: '💧' }
  ]
};

const BASE_USERS = [
  { email: 'cliente@barber.com', password: '123456', role: 'client', name: 'Cliente', unit_id: DEFAULT_UNIT_ID },
  { email: 'admin@barber.com', password: '123456', role: 'admin', name: 'Administrador', unit_id: DEFAULT_UNIT_ID },
  { email: 'super@barber.com', password: '123456', role: 'super_admin', name: 'Super Admin', unit_id: DEFAULT_UNIT_ID }
];

const DEFAULT_BARBERS = [
  { id: 'pedro', name: 'Pedro', email: 'pedro@barber.com', password: '123456', commission_percentage: 40, active: true, unit_id: DEFAULT_UNIT_ID, avatar: '👨🏽' },
  { id: 'nataniel', name: 'Nataniel', email: 'nataniel@barber.com', password: '123456', commission_percentage: 45, active: true, unit_id: DEFAULT_UNIT_ID, avatar: '👨🏾' }
];

const STORAGE_KEYS = {
  session: 'barberpro_session',
  booking: 'barberpro_booking',
  appointments: 'barberpro_appointments',
  barbers: 'barberpro_barbers',
  blockedSlots: 'barberpro_blocked_slots',
  payments: 'barberpro_payments',
  commissions: 'barberpro_commissions',
  loyaltyPoints: 'barberpro_loyalty_points',
  loyaltyTx: 'barberpro_loyalty_transactions',
  reviews: 'barberpro_reviews',
  brand: 'barberpro_brand',
  audit: 'barberpro_audit'
};

const APPOINTMENT_STATUS = ['pending', 'confirmed', 'canceled', 'completed', 'no_show'];

const DEFAULT_BRAND = {
  shopName: 'Barbearia X',
  primaryColor: '#d4a24f',
  logoUrl: ''
};

const DB_CONFIG = { supabaseUrl: '', supabaseAnonKey: '', table: 'appointments' };

const BOOKING_DEFAULT = { city: '', branch: '', service: '', professional: '', date: '', time: '' };

const nowIso = () => new Date().toISOString();
const asCurrency = (v) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;

function getJson(key, fallback) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || 'null');
    return raw ?? fallback;
  } catch {
    return fallback;
  }
}

function setJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function ensureSeed() {
  if (!getJson(STORAGE_KEYS.barbers, []).length) setJson(STORAGE_KEYS.barbers, DEFAULT_BARBERS);
  if (!getJson(STORAGE_KEYS.brand, null)) setJson(STORAGE_KEYS.brand, DEFAULT_BRAND);
}

function logAudit(action, details = {}) {
  const audit = getJson(STORAGE_KEYS.audit, []);
  const session = getSession();
  audit.unshift({ action, details, by: session?.email || 'system', at: nowIso() });
  setJson(STORAGE_KEYS.audit, audit.slice(0, 1000));
}

function getSession() {
  return getJson(STORAGE_KEYS.session, null);
}

function setSession(user) {
  setJson(STORAGE_KEYS.session, {
    email: user.email,
    role: user.role,
    name: user.name,
    barberId: user.barberId || null,
    unit_id: user.unit_id || DEFAULT_UNIT_ID
  });
}

function hasRole(...roles) {
  const role = getSession()?.role;
  return roles.includes(role);
}

function requireRole(roles, redirect = 'login.html') {
  const session = getSession();
  if (!session) {
    window.location.href = `${redirect}?redirect=${encodeURIComponent(window.location.pathname.split('/').pop())}`;
    return false;
  }
  if (!roles.includes(session.role)) {
    window.location.href = session.role === 'client' ? 'client-home.html' : session.role === 'barber' ? 'barber-home.html' : 'admin-home.html';
    return false;
  }
  return true;
}

function getBrandSettings() {
  return { ...DEFAULT_BRAND, ...getJson(STORAGE_KEYS.brand, {}) };
}

function saveBrandSettings(brand) {
  setJson(STORAGE_KEYS.brand, { ...getBrandSettings(), ...brand });
}

function applyBrandTheme() {
  const brand = getBrandSettings();
  document.documentElement.style.setProperty('--primary', brand.primaryColor || DEFAULT_BRAND.primaryColor);
}

function getBarbers(activeOnly = false) {
  const list = getJson(STORAGE_KEYS.barbers, DEFAULT_BARBERS).filter((b) => b.unit_id === APP_CONFIG.unitId);
  return activeOnly ? list.filter((b) => b.active) : list;
}

function saveBarbers(barbers) {
  setJson(STORAGE_KEYS.barbers, barbers);
}

function getServices() {
  return BASE_DATA.services.filter((s) => s.unit_id === APP_CONFIG.unitId);
}

function getServiceById(id) {
  return getServices().find((s) => s.id === id);
}

function getAppointments() {
  return getJson(STORAGE_KEYS.appointments, []).filter((a) => a.unit_id === APP_CONFIG.unitId && !a.deleted_at);
}

function saveAppointments(rows) {
  const keepOther = getJson(STORAGE_KEYS.appointments, []).filter((a) => a.unit_id !== APP_CONFIG.unitId || a.deleted_at);
  setJson(STORAGE_KEYS.appointments, [...rows, ...keepOther]);
}

function getBlockedSlots() {
  return getJson(STORAGE_KEYS.blockedSlots, []).filter((b) => b.unit_id === APP_CONFIG.unitId && !b.deleted_at);
}

function saveBlockedSlots(rows) {
  const keepOther = getJson(STORAGE_KEYS.blockedSlots, []).filter((b) => b.unit_id !== APP_CONFIG.unitId || b.deleted_at);
  setJson(STORAGE_KEYS.blockedSlots, [...rows, ...keepOther]);
}

function getBooking() {
  return { ...BOOKING_DEFAULT, ...getJson(STORAGE_KEYS.booking, {}) };
}

function saveBooking(partial) {
  setJson(STORAGE_KEYS.booking, { ...getBooking(), ...partial });
}

function populateSelect(select, options, placeholder) {
  select.innerHTML = `<option value="">${placeholder}</option>`;
  options.forEach((option) => {
    const el = document.createElement('option');
    el.value = option.id || option.value;
    el.textContent = option.name || option.label;
    select.appendChild(el);
  });
}

function getNextDays(count = 7) {
  const base = new Date('2026-02-26T00:00:00');
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return { value: d.toISOString().slice(0, 10), label: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(d) };
  });
}

function getTimeslots() {
  const slots = [];
  for (let h = 9; h <= 18; h += 1) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  slots.push('19:00');
  return slots;
}

function toDate(date, time) {
  return new Date(`${date}T${time}:00`);
}

function addMinutes(dateObj, minutes) {
  return new Date(dateObj.getTime() + minutes * 60000);
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function calcEndTime(date, time, durationMinutes) {
  const end = addMinutes(toDate(date, time), durationMinutes);
  return end.toTimeString().slice(0, 5);
}

function isSlotAvailable({ barberId, date, time, serviceDuration, editingAppointmentId = null }) {
  const start = toDate(date, time);
  const end = addMinutes(start, serviceDuration);

  // limite expediente
  const close = toDate(date, '19:00');
  if (end > close) return false;

  const blocked = getBlockedSlots().filter((b) => b.barber_id === barberId);
  const blockedConflict = blocked.some((b) => overlaps(start, end, new Date(b.start_datetime), new Date(b.end_datetime)));
  if (blockedConflict) return false;

  const activeStatuses = ['pending', 'confirmed'];
  const appointments = getAppointments().filter((a) => a.barber_id === barberId && activeStatuses.includes(a.status));

  const conflict = appointments.some((a) => {
    if (editingAppointmentId && a.id === editingAppointmentId) return false;
    const aStart = new Date(a.start_datetime);
    const aEnd = new Date(a.end_datetime);
    return overlaps(start, end, aStart, aEnd);
  });

  return !conflict;
}

function createAppointmentFromBooking() {
  const session = getSession();
  const booking = getBooking();
  const service = getServiceById(booking.service);
  const barbers = getBarbers(true);

  let barberId = booking.professional;
  if (barberId === 'sem-preferencia') {
    const found = barbers.find((b) => isSlotAvailable({ barberId: b.id, date: booking.date, time: booking.time, serviceDuration: service.duration_minutes }));
    barberId = found?.id;
  }

  if (!barberId) return null;

  if (!isSlotAvailable({ barberId, date: booking.date, time: booking.time, serviceDuration: service.duration_minutes })) {
    return null;
  }

  const start = toDate(booking.date, booking.time);
  const end = addMinutes(start, service.duration_minutes);
  const city = BASE_DATA.cities.find((c) => c.id === booking.city);
  const branch = city?.branches.find((b) => b.id === booking.branch);
  const barber = barbers.find((b) => b.id === barberId);

  return {
    id: `apt_${Date.now()}`,
    unit_id: APP_CONFIG.unitId,
    client_email: session?.email,
    client_name: session?.name,
    service_id: service.id,
    service_name: service.name,
    service_price: service.price,
    duration_minutes: service.duration_minutes,
    barber_id: barberId,
    barber_name: barber?.name || 'Sem preferência',
    city: city?.name,
    branch: branch?.name,
    address: branch?.address,
    appointment_date: booking.date,
    start_time: booking.time,
    end_time: end.toTimeString().slice(0, 5),
    start_datetime: start.toISOString(),
    end_datetime: end.toISOString(),
    status: 'pending',
    created_at: nowIso(),
    created_by: session?.email || 'system'
  };
}

function updateAppointmentStatus(id, status) {
  if (!APPOINTMENT_STATUS.includes(status)) return;

  const appointments = getAppointments();
  const idx = appointments.findIndex((a) => a.id === id);
  if (idx < 0) return;

  appointments[idx].status = status;
  appointments[idx].updated_at = nowIso();
  appointments[idx].updated_by = getSession()?.email;
  saveAppointments(appointments);

  logAudit('appointment_status_changed', { id, status });

  if (status === 'completed') {
    registerPaymentAndCommission(appointments[idx]);
    registerLoyalty(appointments[idx]);
  }
}

function registerPaymentAndCommission(appointment) {
  const payments = getJson(STORAGE_KEYS.payments, []);
  const commissions = getJson(STORAGE_KEYS.commissions, []);
  if (!payments.some((p) => p.appointment_id === appointment.id)) {
    payments.unshift({
      id: `pay_${Date.now()}`,
      appointment_id: appointment.id,
      unit_id: appointment.unit_id,
      payment_method: 'pix',
      amount: appointment.service_price,
      paid_at: nowIso(),
      status: 'paid'
    });
  }

  const barber = getBarbers().find((b) => b.id === appointment.barber_id);
  const percentage = barber?.commission_percentage || 0;
  const commissionAmount = (appointment.service_price * percentage) / 100;

  if (!commissions.some((c) => c.appointment_id === appointment.id)) {
    commissions.unshift({
      id: `com_${Date.now()}`,
      barber_id: appointment.barber_id,
      appointment_id: appointment.id,
      unit_id: appointment.unit_id,
      commission_amount: Number(commissionAmount.toFixed(2)),
      calculated_at: nowIso()
    });
  }

  setJson(STORAGE_KEYS.payments, payments);
  setJson(STORAGE_KEYS.commissions, commissions);
}

function registerLoyalty(appointment) {
  const points = getJson(STORAGE_KEYS.loyaltyPoints, {});
  const tx = getJson(STORAGE_KEYS.loyaltyTx, []);
  const user = appointment.client_email;
  const earned = Math.floor(appointment.service_price);

  points[user] = (points[user] || 0) + earned;

  tx.unshift({
    id: `loy_${Date.now()}`,
    user_id: user,
    appointment_id: appointment.id,
    points_earned: earned,
    points_used: 0,
    created_at: nowIso(),
    unit_id: appointment.unit_id
  });

  setJson(STORAGE_KEYS.loyaltyPoints, points);
  setJson(STORAGE_KEYS.loyaltyTx, tx);
}

function getDashboardMetrics() {
  const appointments = getAppointments();
  const payments = getJson(STORAGE_KEYS.payments, []);
  const today = '2026-02-26';

  const todayAppointments = appointments.filter((a) => a.appointment_date === today);
  const todayPayments = payments.filter((p) => (p.paid_at || '').slice(0, 10) === today && p.status === 'paid');

  const noShows = todayAppointments.filter((a) => a.status === 'no_show').length;
  const total = todayAppointments.length || 1;

  const byHour = {};
  todayAppointments.forEach((a) => {
    byHour[a.start_time] = (byHour[a.start_time] || 0) + 1;
  });
  const busiestHour = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  const byService = {};
  appointments.filter((a) => a.status === 'completed').forEach((a) => {
    byService[a.service_name] = (byService[a.service_name] || 0) + 1;
  });
  const topService = Object.entries(byService).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  return {
    totalToday: todayAppointments.length,
    revenueToday: todayPayments.reduce((s, p) => s + Number(p.amount || 0), 0),
    busiestHour,
    topService,
    noShowRate: `${((noShows / total) * 100).toFixed(1)}%`
  };
}

function renderMetrics(container, metrics) {
  container.innerHTML = `
    <article class="schedule-item"><h3>Agendamentos hoje</h3><p>${metrics.totalToday}</p></article>
    <article class="schedule-item"><h3>Faturamento do dia</h3><p>${asCurrency(metrics.revenueToday)}</p></article>
    <article class="schedule-item"><h3>Horário mais movimentado</h3><p>${metrics.busiestHour}</p></article>
    <article class="schedule-item"><h3>Serviço mais vendido</h3><p>${metrics.topService}</p></article>
    <article class="schedule-item"><h3>Taxa de no-show</h3><p>${metrics.noShowRate}</p></article>
  `;
}

function formatBookingDateTime(date, time) {
  const formattedDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
  return `${formattedDate} - ${time}`;
}

function initLoginPage() {
  const form = document.querySelector('form.auth-form');
  if (!form || !document.title.includes('Login')) return;
  const feedback = document.getElementById('login-feedback');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('email')?.value || '';
    const password = document.getElementById('password')?.value || '';

    const base = BASE_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    const barber = getBarbers().find((b) => b.email.toLowerCase() === email.toLowerCase() && b.password === password && b.active);

    const user = base || (barber ? { email: barber.email, password: barber.password, role: 'barber', name: barber.name, barberId: barber.id, unit_id: barber.unit_id } : null);

    if (!user) {
      if (feedback) feedback.textContent = 'Credenciais inválidas.';
      return;
    }

    setSession(user);
    const redirect = new URLSearchParams(window.location.search).get('redirect');
    if (redirect) {
      window.location.href = redirect;
      return;
    }

    if (user.role === 'client') window.location.href = 'client-home.html';
    else if (user.role === 'barber') window.location.href = 'barber-home.html';
    else window.location.href = 'admin-home.html';
  });
}

function initLocationPage() {
  const form = document.getElementById('location-form');
  if (!form) return;
  const cityEl = document.getElementById('city');
  const branchEl = document.getElementById('branch');
  const current = getBooking();

  populateSelect(cityEl, BASE_DATA.cities, 'Selecione a cidade');

  cityEl.addEventListener('change', () => {
    const city = BASE_DATA.cities.find((item) => item.id === cityEl.value);
    branchEl.disabled = !city;
    populateSelect(branchEl, city ? city.branches : [], 'Selecione a unidade');
    saveBooking({ city: cityEl.value, branch: '', service: '', professional: '', date: '', time: '' });
  });

  branchEl.addEventListener('change', () => saveBooking({ branch: branchEl.value, service: '', professional: '', date: '', time: '' }));

  if (current.city) {
    cityEl.value = current.city;
    cityEl.dispatchEvent(new Event('change'));
    if (current.branch) branchEl.value = current.branch;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!cityEl.value || !branchEl.value) return;
    saveBooking({ city: cityEl.value, branch: branchEl.value });
    window.location.href = 'booking-service.html';
  });
}

function initServicePage() {
  const grid = document.getElementById('services-grid');
  const nextBtn = document.getElementById('service-next');
  if (!grid || !nextBtn) return;

  const booking = getBooking();
  if (!booking.city || !booking.branch) return (window.location.href = 'booking-location.html');

  getServices().forEach((service) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `service-card ${booking.service === service.id ? 'active' : ''}`;
    card.innerHTML = `<span class="service-bg">${service.emoji}</span><span class="service-title">${service.name}</span><span class="service-price">${asCurrency(service.price)} · ${service.duration_minutes} min</span>`;
    card.addEventListener('click', () => {
      saveBooking({ service: service.id, professional: '', date: '', time: '' });
      [...grid.querySelectorAll('.service-card')].forEach((e) => e.classList.remove('active'));
      card.classList.add('active');
      nextBtn.disabled = false;
    });
    grid.appendChild(card);
  });

  nextBtn.disabled = !booking.service;
  nextBtn.addEventListener('click', () => {
    if (!getBooking().service) return;
    window.location.href = 'booking-professional.html';
  });
}

function initProfessionalPage() {
  const grid = document.getElementById('professionals-grid');
  const nextBtn = document.getElementById('professional-next');
  if (!grid || !nextBtn) return;

  const booking = getBooking();
  if (!booking.service) return (window.location.href = 'booking-service.html');

  const professionals = [...getBarbers(true), { id: 'sem-preferencia', name: 'Sem preferência', avatar: '⭐' }];

  professionals.forEach((p) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `pro-card ${booking.professional === p.id ? 'active' : ''}`;
    card.innerHTML = `<span class="pro-avatar">${p.avatar}</span><span class="pro-name">${p.name}</span>`;
    card.addEventListener('click', () => {
      saveBooking({ professional: p.id, date: '', time: '' });
      [...grid.querySelectorAll('.pro-card')].forEach((e) => e.classList.remove('active'));
      card.classList.add('active');
      nextBtn.disabled = false;
    });
    grid.appendChild(card);
  });

  nextBtn.disabled = !booking.professional;
  nextBtn.addEventListener('click', () => {
    if (!getBooking().professional) return;
    window.location.href = 'booking-datetime.html';
  });
}

function initDatetimePage() {
  const form = document.getElementById('datetime-form');
  if (!form) return;
  const dateEl = document.getElementById('date');
  const timeGrid = document.getElementById('time-grid');
  const btn = document.getElementById('confirm-booking');

  const booking = getBooking();
  if (!booking.professional || !booking.service) return (window.location.href = 'booking-professional.html');

  populateSelect(dateEl, getNextDays(), 'Selecione uma data');
  if (booking.date) dateEl.value = booking.date;

  function render() {
    const b = getBooking();
    const service = getServiceById(b.service);
    timeGrid.innerHTML = '';

    getTimeslots().forEach((time) => {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = `time-slot ${b.time === time ? 'active' : ''}`;
      slot.textContent = `${time}`;

      let available = false;
      if (b.date) {
        if (b.professional === 'sem-preferencia') {
          available = getBarbers(true).some((barber) => isSlotAvailable({ barberId: barber.id, date: b.date, time, serviceDuration: service.duration_minutes }));
        } else {
          available = isSlotAvailable({ barberId: b.professional, date: b.date, time, serviceDuration: service.duration_minutes });
        }
      }

      slot.disabled = !available;

      slot.addEventListener('click', () => {
        saveBooking({ time });
        render();
        btn.disabled = !(getBooking().date && getBooking().time);
      });

      timeGrid.appendChild(slot);
    });
  }

  dateEl.addEventListener('change', () => {
    saveBooking({ date: dateEl.value, time: '' });
    render();
    btn.disabled = true;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!getBooking().date || !getBooking().time) return;
    window.location.href = 'booking-review.html';
  });

  render();
  btn.disabled = !(getBooking().date && getBooking().time);
}

function initBookingReviewPage() {
  const list = document.getElementById('review-list');
  const action = document.getElementById('review-action');
  if (!list || !action) return;

  const b = getBooking();
  if (!(b.city && b.branch && b.service && b.professional && b.date && b.time)) return (window.location.href = 'booking-location.html');

  const city = BASE_DATA.cities.find((c) => c.id === b.city);
  const branch = city?.branches.find((br) => br.id === b.branch);
  const service = getServiceById(b.service);
  const pro = [...getBarbers(), { id: 'sem-preferencia', name: 'Sem preferência' }].find((p) => p.id === b.professional);

  list.innerHTML = [
    ['🌍', city?.name, 'Região', 'booking-location.html'],
    ['📍', branch?.name, 'Unidade', 'booking-location.html'],
    ['💈', `${service?.name} (${service?.duration_minutes} min)`, 'Serviço', 'booking-service.html'],
    ['👤', pro?.name, 'Profissional', 'booking-professional.html'],
    ['📅', formatBookingDateTime(b.date, b.time), 'Data e hora', 'booking-datetime.html']
  ]
    .map(([icon, value, label, href]) => `<article class="review-item"><div class="review-icon">${icon}</div><div><h3>${value || '-'}</h3><p>${label}</p></div><a class="review-edit" href="${href}">Alterar</a></article>`)
    .join('');

  document.getElementById('review-price').textContent = `A partir de ${asCurrency(service?.price || 0)}`;
  document.getElementById('review-address').textContent = branch?.address || '-';

  action.textContent = !getSession() ? 'Efetuar login para continuar' : hasRole('client') ? 'Confirmar agendamento' : 'Perfil administrativo não agenda por esta tela';

  action.addEventListener('click', () => {
    if (!getSession()) return (window.location.href = 'login.html?redirect=booking-review.html');
    if (!hasRole('client')) return;

    const apt = createAppointmentFromBooking();
    if (!apt) {
      action.textContent = 'Horário ficou indisponível. Escolha outro.';
      return;
    }

    const all = getAppointments();
    all.unshift(apt);
    saveAppointments(all);
    logAudit('appointment_created', { appointment_id: apt.id });
    window.location.href = 'my-schedules.html';
  });
}

function initMySchedulesPage() {
  const root = document.getElementById('my-schedules-content');
  if (!root) return;

  if (!getSession()) {
    root.innerHTML = '<div class="empty-state"><h2>Faça login para ver seus horários</h2><p>Você precisa entrar com sua conta para acessar os horários agendados.</p><a class="button button-primary" href="login.html?redirect=my-schedules.html">Efetuar login</a></div>';
    return;
  }
  if (!hasRole('client')) {
    root.innerHTML = '<div class="empty-state"><h2>Área exclusiva de clientes</h2></div>';
    return;
  }

  const session = getSession();
  const rows = getAppointments().filter((a) => a.client_email === session.email);

  if (!rows.length) {
    root.innerHTML = '<div class="empty-state"><h2>Você não tem horários agendados</h2><p>Quando confirmar um agendamento ele aparecerá aqui.</p><a class="button button-primary" href="booking-location.html">Agendar agora</a></div>';
    return;
  }

  root.innerHTML = rows
    .map((a) => `<article class="schedule-item"><h3>${a.service_name} · ${formatBookingDateTime(a.appointment_date, a.start_time)}</h3><p>Status: <strong>${a.status}</strong></p><small>${a.barber_name} · ${a.branch}</small>${a.status !== 'completed' ? `<div class="form-row"><button class="button button-secondary" data-reschedule="${a.id}">Remarcar</button></div>` : ''}</article>`)
    .join('');

  root.querySelectorAll('[data-reschedule]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const apt = rows.find((r) => r.id === btn.dataset.reschedule);
      if (!apt || apt.status === 'completed') return;
      saveBooking({
        city: BASE_DATA.cities[0].id,
        branch: BASE_DATA.cities[0].branches[0].id,
        service: apt.service_id,
        professional: apt.barber_id,
        date: apt.appointment_date,
        time: apt.start_time
      });
      window.location.href = 'booking-datetime.html';
    });
  });
}

function renderAppointmentCard(a, canManage = false) {
  const actions = canManage
    ? `<div class="form-row">
      <button class="button button-secondary" data-status="confirmed" data-id="${a.id}">Confirmar</button>
      <button class="button button-secondary" data-status="completed" data-id="${a.id}">Concluir</button>
      <button class="button button-secondary" data-status="canceled" data-id="${a.id}">Cancelar</button>
      <button class="button button-secondary" data-status="no_show" data-id="${a.id}">No-show</button>
    </div>`
    : '';

  return `<article class="schedule-item"><h3>${a.service_name} · ${formatBookingDateTime(a.appointment_date, a.start_time)}</h3><p>${a.barber_name} · ${a.client_name || 'Cliente'} · ${a.status}</p><small>${a.branch} - ${a.city}</small>${actions}</article>`;
}

function initAdminSchedulesPage() {
  const list = document.getElementById('admin-schedules-list');
  const barberFilter = document.getElementById('admin-professional-filter');
  const statusFilter = document.getElementById('admin-status-filter');
  if (!list || !barberFilter || !statusFilter) return;

  if (!requireRole(['admin', 'barber', 'super_admin'], 'login.html')) return;

  const session = getSession();
  const barbers = getBarbers();
  const options = [{ id: 'all', name: 'Todos os barbeiros' }, ...barbers];
  populateSelect(barberFilter, options, 'Todos os barbeiros');
  barberFilter.value = 'all';

  function getFiltered() {
    let rows = getAppointments();

    if (hasRole('barber')) {
      barberFilter.disabled = true;
      rows = rows.filter((a) => a.barber_id === session.barberId);
    } else {
      barberFilter.disabled = false;
      if (barberFilter.value && barberFilter.value !== 'all') rows = rows.filter((a) => a.barber_id === barberFilter.value);
    }

    if (statusFilter.value !== 'all') rows = rows.filter((a) => a.status === statusFilter.value);
    return rows;
  }

  function render() {
    const rows = getFiltered();
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

  function resetForm() {
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
      .map(
        (b) => `<article class="schedule-item"><h3>${b.name}</h3><p>${b.email} · comissão ${b.commission_percentage}% · ${b.active ? 'ativo' : 'inativo'}</p><div class="form-row"><button class="button button-secondary" type="button" data-edit="${b.id}">Editar</button><button class="button button-secondary" type="button" data-delete="${b.id}">Excluir</button></div></article>`
      )
      .join('');

    listEl.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const b = rows.find((x) => x.id === btn.dataset.edit);
        if (!b) return;
        idEl.value = b.id;
        nameEl.value = b.name;
        emailEl.value = b.email;
        passwordEl.value = b.password;
        commissionEl.value = String(b.commission_percentage ?? 40);
        activeEl.checked = !!b.active;
      });
    });

    listEl.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = rows.map((r) => (r.id === btn.dataset.delete ? { ...r, active: false, deleted_at: nowIso() } : r));
        saveBarbers(next.filter((b) => !b.deleted_at));
        logAudit('barber_deleted', { barber_id: btn.dataset.delete });
        render();
      });
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rows = getBarbers();
    const payload = {
      id: idEl.value || slugify(nameEl.value),
      name: nameEl.value.trim(),
      email: emailEl.value.trim(),
      password: passwordEl.value.trim(),
      commission_percentage: Number(commissionEl.value || 0),
      active: activeEl.checked,
      unit_id: APP_CONFIG.unitId,
      avatar: '💈'
    };

    const emailConflict = rows.some((r) => r.email.toLowerCase() === payload.email.toLowerCase() && r.id !== payload.id);
    if (emailConflict) return;

    const idx = rows.findIndex((r) => r.id === payload.id);
    if (idx >= 0) rows[idx] = { ...rows[idx], ...payload };
    else rows.push(payload);

    saveBarbers(rows);
    logAudit('barber_saved', { barber_id: payload.id });
    resetForm();
    render();
  });

  cancelEl.addEventListener('click', resetForm);
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
        const next = getBlockedSlots().filter((b) => b.id !== btn.dataset.delete);
        saveBlockedSlots(next);
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
    rows.unshift({
      id: `blk_${Date.now()}`,
      unit_id: APP_CONFIG.unitId,
      barber_id: barber.id,
      barber_name: barber.name,
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString(),
      reason: reasonEl.value.trim(),
      created_at: nowIso()
    });
    saveBlockedSlots(rows);
    logAudit('blocked_slot_created', { barber_id: barber.id });
    form.reset();
    render();
  });

  render();
}

function initAdminFinancePage() {
  const metricsEl = document.getElementById('finance-metrics');
  const byBarberEl = document.getElementById('finance-by-barber');
  if (!metricsEl || !byBarberEl) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;

  const payments = getJson(STORAGE_KEYS.payments, []).filter((p) => p.unit_id === APP_CONFIG.unitId && p.status === 'paid');
  const appointments = getAppointments();

  const today = '2026-02-26';
  const daily = payments.filter((p) => (p.paid_at || '').slice(0, 10) === today).reduce((s, p) => s + Number(p.amount || 0), 0);
  const monthly = payments.filter((p) => (p.paid_at || '').slice(0, 7) === '2026-02').reduce((s, p) => s + Number(p.amount || 0), 0);
  const completed = appointments.filter((a) => a.status === 'completed');
  const avgTicket = completed.length ? completed.reduce((s, a) => s + Number(a.service_price || 0), 0) / completed.length : 0;

  renderMetrics(metricsEl, {
    totalToday: appointments.filter((a) => a.appointment_date === today).length,
    revenueToday: daily,
    busiestHour: getDashboardMetrics().busiestHour,
    topService: getDashboardMetrics().topService,
    noShowRate: getDashboardMetrics().noShowRate
  });

  const byBarber = {};
  completed.forEach((a) => {
    byBarber[a.barber_name] = (byBarber[a.barber_name] || 0) + Number(a.service_price || 0);
  });

  const cards = Object.entries(byBarber)
    .map(([name, amount]) => `<article class="schedule-item"><h3>Receita · ${name}</h3><p>${asCurrency(amount)}</p></article>`)
    .join('');

  byBarberEl.innerHTML = `
    <article class="schedule-item"><h3>Faturamento diário</h3><p>${asCurrency(daily)}</p></article>
    <article class="schedule-item"><h3>Faturamento mensal</h3><p>${asCurrency(monthly)}</p></article>
    <article class="schedule-item"><h3>Ticket médio</h3><p>${asCurrency(avgTicket)}</p></article>
    <article class="schedule-item"><h3>Receita da unidade</h3><p>${asCurrency(monthly)}</p></article>
    ${cards || '<article class="schedule-item"><h3>Receita por barbeiro</h3><p>Sem dados ainda</p></article>'}
  `;
}

function initAdminDashboard() {
  const container = document.getElementById('admin-metrics');
  if (!container) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;
  renderMetrics(container, getDashboardMetrics());
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
    } else {
      logoEl.style.display = 'none';
    }
  }
}

function initAdminSettingsPage() {
  const form = document.getElementById('admin-settings-form');
  if (!form) return;
  if (!requireRole(['admin', 'super_admin'], 'login.html')) return;

  const nameEl = document.getElementById('shop-name');
  const colorEl = document.getElementById('shop-color');
  const logoUrlEl = document.getElementById('shop-logo-url');
  const logoFileEl = document.getElementById('shop-logo-file');
  const previewName = document.getElementById('brand-preview-name');
  const previewLogo = document.getElementById('brand-preview-logo');

  const brand = getBrandSettings();
  nameEl.value = brand.shopName;
  colorEl.value = brand.primaryColor;
  logoUrlEl.value = brand.logoUrl;

  const updatePreview = (logo) => {
    previewName.textContent = nameEl.value || 'BarberPro';
    if (logo) {
      previewLogo.src = logo;
      previewLogo.style.display = 'block';
    } else previewLogo.style.display = 'none';
  };

  updatePreview(brand.logoUrl);
  nameEl.addEventListener('input', () => updatePreview(logoUrlEl.value));
  logoUrlEl.addEventListener('input', () => updatePreview(logoUrlEl.value));
  logoFileEl.addEventListener('change', () => {
    const f = logoFileEl.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      logoUrlEl.value = String(reader.result || '');
      updatePreview(logoUrlEl.value);
    };
    reader.readAsDataURL(f);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveBrandSettings({ shopName: nameEl.value.trim() || 'BarberPro', primaryColor: colorEl.value, logoUrl: logoUrlEl.value.trim() });
    applyBrandTheme();
    logAudit('brand_updated', { by: getSession()?.email });
    updatePreview(logoUrlEl.value.trim());
  });
}

function initBarberHomePage() {
  const page = document.title.includes('Painel Barbeiro');
  if (!page) return;
  requireRole(['barber'], 'login.html');
}

function ensureDbSchemaNote() {
  if (dbEnabled()) {
    // placeholder para integração real
  }
}

function dbEnabled() {
  return Boolean(DB_CONFIG.supabaseUrl && DB_CONFIG.supabaseAnonKey);
}

ensureSeed();
applyBrandTheme();
ensureDbSchemaNote();

initLoginPage();
initLocationPage();
initServicePage();
initProfessionalPage();
initDatetimePage();
initBookingReviewPage();
initMySchedulesPage();
initAdminSchedulesPage();
initAdminBarbersPage();
initBlockedSlotsPage();
initAdminFinancePage();
initAdminDashboard();
initClientHomePage();
initAdminSettingsPage();
initBarberHomePage();

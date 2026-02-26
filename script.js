const BARBER_DATA = {
  cities: [
    {
      id: 'poa',
      name: 'Porto Alegre',
      branches: [
        { id: 'bom-fim', name: 'Bom Fim', address: 'Rua Fernandes Vieira, 631 - Bom Fim, Porto Alegre, RS' },
        { id: 'cidade-baixa', name: 'Cidade Baixa', address: 'Rua da República, 900 - Cidade Baixa, Porto Alegre, RS' }
      ]
    },
    {
      id: 'viamao',
      name: 'Viamão',
      branches: [
        { id: 'centro-viamao', name: 'Centro', address: 'Av. Senador Salgado Filho, 1200 - Centro, Viamão, RS' }
      ]
    }
  ],
  services: [
    { id: 'corte', name: 'Corte', price: 72, emoji: '✂️' },
    { id: 'corte-sobrancelha', name: 'Corte + Sobrancelha', price: 89, emoji: '🧔' },
    { id: 'infantil', name: 'Corte Infantil', price: 65, emoji: '👦' },
    { id: 'acabamento', name: 'Acabamento', price: 45, emoji: '✨' },
    { id: 'nariz', name: 'Depilação do Nariz', price: 35, emoji: '👃' },
    { id: 'hidratacao', name: 'Hidratação', price: 58, emoji: '💧' },
    { id: 'sobrancelha', name: 'Sobrancelha', price: 30, emoji: '🪒' }
  ],
  unavailableBookings: {
    'poa|bom-fim|pedro|2026-02-26|16:00': true,
    'poa|bom-fim|nataniel|2026-02-26|16:00': true,
    'poa|bom-fim|fernando|2026-02-26|16:00': true,
    'poa|bom-fim|pedro|2026-02-26|09:30': true
  }
};

const BASE_USERS = [
  { email: 'cliente@barber.com', password: '123456', role: 'client', name: 'Cliente' },
  { email: 'admin@barber.com', password: '123456', role: 'admin', name: 'Administrador' }
];

const DEFAULT_BARBERS = [
  { id: 'pedro', name: 'Pedro', email: 'pedro@barber.com', password: '123456', avatar: '👨🏽' },
  { id: 'nataniel', name: 'Nataniel', email: 'nataniel@barber.com', password: '123456', avatar: '👨🏾' },
  { id: 'fernando', name: 'Fernando', email: 'fernando@barber.com', password: '123456', avatar: '👨🏻' }
];

const STORAGE_KEYS = {
  session: 'barberpro_session',
  booking: 'barberpro_booking',
  schedules: 'barberpro_schedules',
  barbers: 'barberpro_barbers',
  brand: 'barberpro_brand'
};

const DB_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  table: 'appointments'
};

const BOOKING_DEFAULT = { city: '', branch: '', service: '', professional: '', date: '', time: '' };

const DEFAULT_BRAND = {
  shopName: 'BarberPro',
  primaryColor: '#d4a24f',
  logoUrl: ''
};

function getBrandSettings() {
  try {
    return { ...DEFAULT_BRAND, ...JSON.parse(localStorage.getItem(STORAGE_KEYS.brand) || '{}') };
  } catch {
    return { ...DEFAULT_BRAND };
  }
}

function saveBrandSettings(brand) {
  localStorage.setItem(STORAGE_KEYS.brand, JSON.stringify({ ...getBrandSettings(), ...brand }));
}

function applyBrandTheme() {
  const brand = getBrandSettings();
  document.documentElement.style.setProperty('--primary', brand.primaryColor || DEFAULT_BRAND.primaryColor);
}


function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getBarbers() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.barbers) || '[]');
    if (!raw.length) return DEFAULT_BARBERS;
    return raw;
  } catch {
    return DEFAULT_BARBERS;
  }
}

function saveBarbers(barbers) {
  localStorage.setItem(STORAGE_KEYS.barbers, JSON.stringify(barbers));
}

function getProfessionalsForBooking() {
  return [...getBarbers(), { id: 'sem-preferencia', name: 'Sem preferência', avatar: '⭐' }];
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || 'null');
  } catch {
    return null;
  }
}

function isLoggedIn() {
  return Boolean(getSession());
}

function isClientRole() {
  return getSession()?.role === 'client';
}

function isAdminRole() {
  return getSession()?.role === 'admin';
}

function isBarberRole() {
  return getSession()?.role === 'barber';
}

function isElevatedRole() {
  return isAdminRole() || isBarberRole();
}

function authenticate(email, password) {
  const lower = email.toLowerCase();
  const base = BASE_USERS.find((user) => user.email.toLowerCase() === lower && user.password === password);
  if (base) return base;

  const barber = getBarbers().find((item) => item.email.toLowerCase() === lower && item.password === password);
  if (!barber) return null;

  return { email: barber.email, password: barber.password, role: 'barber', name: barber.name, barberId: barber.id };
}

function setSession(user) {
  localStorage.setItem(
    STORAGE_KEYS.session,
    JSON.stringify({
      email: user.email,
      role: user.role,
      name: user.name,
      barberId: user.barberId || null
    })
  );
}

function dbEnabled() {
  return Boolean(DB_CONFIG.supabaseUrl && DB_CONFIG.supabaseAnonKey);
}

function dbHeaders() {
  return {
    apikey: DB_CONFIG.supabaseAnonKey,
    Authorization: `Bearer ${DB_CONFIG.supabaseAnonKey}`,
    'Content-Type': 'application/json'
  };
}

function normalizeSchedule(item) {
  return {
    city: item.city,
    branch: item.branch,
    address: item.address,
    service: item.service,
    professional: item.professional,
    professional_id: item.professional_id || item.professionalId || null,
    date: item.date,
    time: item.time,
    price: item.price,
    client_email: item.client_email || item.clientEmail,
    client_name: item.client_name || item.clientName,
    created_at: item.created_at || item.createdAt || new Date().toISOString()
  };
}

async function loadSchedules() {
  if (dbEnabled()) {
    try {
      const url = `${DB_CONFIG.supabaseUrl}/rest/v1/${DB_CONFIG.table}?select=*&order=created_at.desc`;
      const response = await fetch(url, { headers: dbHeaders() });
      if (response.ok) {
        const data = await response.json();
        return data.map(normalizeSchedule);
      }
    } catch (_) {
      // fallback local
    }
  }

  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.schedules) || '[]').map(normalizeSchedule);
  } catch {
    return [];
  }
}

async function saveSchedule(schedule) {
  const normalized = normalizeSchedule(schedule);

  if (dbEnabled()) {
    try {
      const url = `${DB_CONFIG.supabaseUrl}/rest/v1/${DB_CONFIG.table}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { ...dbHeaders(), Prefer: 'return=representation' },
        body: JSON.stringify([normalized])
      });

      if (response.ok) return;
    } catch (_) {
      // fallback local
    }
  }

  const current = await loadSchedules();
  current.unshift(normalized);
  localStorage.setItem(STORAGE_KEYS.schedules, JSON.stringify(current));
}

function getBooking() {
  try {
    return { ...BOOKING_DEFAULT, ...JSON.parse(localStorage.getItem(STORAGE_KEYS.booking) || '{}') };
  } catch {
    return { ...BOOKING_DEFAULT };
  }
}

function saveBooking(partial) {
  localStorage.setItem(STORAGE_KEYS.booking, JSON.stringify({ ...getBooking(), ...partial }));
}

function mustHave(fields) {
  const data = getBooking();
  return fields.every((field) => Boolean(data[field]));
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
  const base = new Date('2026-02-26T08:00:00');
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(base);
    date.setDate(base.getDate() + i);
    return {
      value: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(date)
    };
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

function bookingKey(city, branch, professional, date, time) {
  return `${city}|${branch}|${professional}|${date}|${time}`;
}

function isUnavailable(data, time) {
  if (data.professional === 'sem-preferencia') {
    return getBarbers().every((barber) => BARBER_DATA.unavailableBookings[bookingKey(data.city, data.branch, barber.id, data.date, time)]);
  }

  return Boolean(BARBER_DATA.unavailableBookings[bookingKey(data.city, data.branch, data.professional, data.date, time)]);
}

function formatBookingDateTime(date, time) {
  const formattedDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
  return `${formattedDate} - ${time}`;
}

function getComputedBooking() {
  const booking = getBooking();
  const city = BARBER_DATA.cities.find((c) => c.id === booking.city);
  const branch = city?.branches.find((b) => b.id === booking.branch);
  const service = BARBER_DATA.services.find((s) => s.id === booking.service);
  const professional = getProfessionalsForBooking().find((p) => p.id === booking.professional);
  return { booking, city, branch, service, professional };
}

function initLoginPage() {
  const form = document.querySelector('form.auth-form');
  if (!form || !document.title.includes('Login')) return;
  const feedback = document.getElementById('login-feedback');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('email')?.value || '';
    const password = document.getElementById('password')?.value || '';

    const user = authenticate(email, password);
    if (!user) {
      if (feedback) feedback.textContent = 'Credenciais inválidas. Verifique e tente novamente.';
      return;
    }

    setSession(user);

    const redirect = new URLSearchParams(window.location.search).get('redirect');
    if (redirect) {
      window.location.href = redirect;
      return;
    }

    if (user.role === 'client') {
      window.location.href = 'client-home.html';
    } else if (user.role === 'barber') {
      window.location.href = 'barber-home.html';
    } else {
      window.location.href = 'admin-home.html';
    }
  });
}

function initLocationPage() {
  const form = document.getElementById('location-form');
  if (!form) return;
  const cityEl = document.getElementById('city');
  const branchEl = document.getElementById('branch');
  const current = getBooking();

  populateSelect(cityEl, BARBER_DATA.cities, 'Selecione a cidade');

  cityEl.addEventListener('change', () => {
    const city = BARBER_DATA.cities.find((item) => item.id === cityEl.value);
    branchEl.disabled = !city;
    populateSelect(branchEl, city ? city.branches : [], 'Selecione a unidade');
    saveBooking({ city: cityEl.value, branch: '', service: '', professional: '', date: '', time: '' });
  });

  branchEl.addEventListener('change', () => {
    saveBooking({ branch: branchEl.value, service: '', professional: '', date: '', time: '' });
  });

  if (current.city) {
    cityEl.value = current.city;
    cityEl.dispatchEvent(new Event('change'));
    if (current.branch) branchEl.value = current.branch;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!cityEl.value || !branchEl.value) return;
    saveBooking({ city: cityEl.value, branch: branchEl.value });
    window.location.href = 'booking-service.html';
  });
}

function initServicePage() {
  const grid = document.getElementById('services-grid');
  const nextBtn = document.getElementById('service-next');
  if (!grid || !nextBtn) return;

  if (!mustHave(['city', 'branch'])) {
    window.location.href = 'booking-location.html';
    return;
  }

  const current = getBooking();

  BARBER_DATA.services.forEach((service) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `service-card ${current.service === service.id ? 'active' : ''}`;
    card.innerHTML = `
      <span class="service-bg">${service.emoji}</span>
      <span class="service-title">${service.name}</span>
      <span class="service-price">R$ ${service.price.toFixed(2).replace('.', ',')}</span>
    `;

    card.addEventListener('click', () => {
      saveBooking({ service: service.id, professional: '', date: '', time: '' });
      [...grid.querySelectorAll('.service-card')].forEach((el) => el.classList.remove('active'));
      card.classList.add('active');
      nextBtn.disabled = false;
    });

    grid.appendChild(card);
  });

  nextBtn.disabled = !current.service;
  nextBtn.addEventListener('click', () => {
    if (!mustHave(['service'])) return;
    window.location.href = 'booking-professional.html';
  });
}

function initProfessionalPage() {
  const grid = document.getElementById('professionals-grid');
  const nextBtn = document.getElementById('professional-next');
  if (!grid || !nextBtn) return;

  if (!mustHave(['city', 'branch', 'service'])) {
    window.location.href = 'booking-service.html';
    return;
  }

  const current = getBooking();
  const professionals = getProfessionalsForBooking();

  professionals.forEach((professional) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `pro-card ${current.professional === professional.id ? 'active' : ''}`;
    card.innerHTML = `
      <span class="pro-avatar" aria-hidden="true">${professional.avatar}</span>
      <span class="pro-name">${professional.name}</span>
    `;

    card.addEventListener('click', () => {
      saveBooking({ professional: professional.id, date: '', time: '' });
      [...grid.querySelectorAll('.pro-card')].forEach((el) => el.classList.remove('active'));
      card.classList.add('active');
      nextBtn.disabled = false;
    });

    grid.appendChild(card);
  });

  nextBtn.disabled = !current.professional;
  nextBtn.addEventListener('click', () => {
    if (!mustHave(['professional'])) return;
    window.location.href = 'booking-datetime.html';
  });
}

function initDatetimePage() {
  const form = document.getElementById('datetime-form');
  if (!form) return;

  if (!mustHave(['city', 'branch', 'service', 'professional'])) {
    window.location.href = 'booking-professional.html';
    return;
  }

  const dateEl = document.getElementById('date');
  const timeGrid = document.getElementById('time-grid');
  const confirmBtn = document.getElementById('confirm-booking');
  const current = getBooking();

  populateSelect(dateEl, getNextDays(), 'Selecione uma data');
  if (current.date) dateEl.value = current.date;

  function renderTimes() {
    const data = getBooking();
    timeGrid.innerHTML = '';

    getTimeslots().forEach((time) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `time-slot ${data.time === time ? 'active' : ''}`;
      btn.textContent = time;
      btn.disabled = !data.date || isUnavailable(data, time);

      btn.addEventListener('click', () => {
        saveBooking({ time });
        renderTimes();
        confirmBtn.disabled = !(getBooking().date && getBooking().time);
      });

      timeGrid.appendChild(btn);
    });
  }

  dateEl.addEventListener('change', () => {
    saveBooking({ date: dateEl.value, time: '' });
    renderTimes();
    confirmBtn.disabled = !(getBooking().date && getBooking().time);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!mustHave(['date', 'time'])) return;
    window.location.href = 'booking-review.html';
  });

  renderTimes();
  confirmBtn.disabled = !(getBooking().date && getBooking().time);
}

function initBookingReviewPage() {
  const list = document.getElementById('review-list');
  const actionButton = document.getElementById('review-action');
  if (!list || !actionButton) return;

  if (!mustHave(['city', 'branch', 'service', 'professional', 'date', 'time'])) {
    window.location.href = 'booking-location.html';
    return;
  }

  const { booking, city, branch, service, professional } = getComputedBooking();

  const items = [
    { icon: '🌍', value: city?.name || '-', label: 'Região', href: 'booking-location.html' },
    { icon: '📍', value: branch?.name || '-', label: 'Unidade', extra: branch?.address || '-', href: 'booking-location.html' },
    { icon: '💈', value: service?.name || '-', label: 'Serviço', href: 'booking-service.html' },
    { icon: '👤', value: professional?.name || '-', label: 'Profissional', href: 'booking-professional.html' },
    { icon: '📅', value: formatBookingDateTime(booking.date, booking.time), label: 'Data e hora', href: 'booking-datetime.html' }
  ];

  list.innerHTML = items
    .map((item) => `
      <article class="review-item">
        <div class="review-icon">${item.icon}</div>
        <div>
          <h3>${item.value}</h3>
          <p>${item.label}</p>
          ${item.extra ? `<small>${item.extra}</small>` : ''}
        </div>
        <a class="review-edit" href="${item.href}">Alterar</a>
      </article>
    `)
    .join('');

  document.getElementById('review-price').textContent = `A partir de R$ ${service ? service.price.toFixed(2).replace('.', ',') : '-'}`;
  document.getElementById('review-address').textContent = branch?.address || '-';

  actionButton.textContent = !isLoggedIn()
    ? 'Efetuar login para continuar'
    : isClientRole()
      ? 'Confirmar agendamento'
      : 'Perfil administrativo não agenda por esta tela';

  actionButton.addEventListener('click', async () => {
    if (!isLoggedIn()) {
      window.location.href = 'login.html?redirect=booking-review.html';
      return;
    }

    if (!isClientRole()) {
      window.location.href = isBarberRole() ? 'barber-home.html' : 'admin-home.html';
      return;
    }

    const session = getSession();
    await saveSchedule({
      city: city?.name,
      branch: branch?.name,
      address: branch?.address,
      service: service?.name,
      professional: professional?.name,
      professional_id: booking.professional === 'sem-preferencia' ? null : booking.professional,
      date: booking.date,
      time: booking.time,
      price: service?.price,
      client_email: session?.email,
      client_name: session?.name
    });

    window.location.href = 'my-schedules.html';
  });
}

async function initMySchedulesPage() {
  const root = document.getElementById('my-schedules-content');
  if (!root) return;

  if (!isLoggedIn()) {
    root.innerHTML = `<div class="empty-state"><h2>Faça login para ver seus horários</h2><p>Você precisa entrar com sua conta para acessar os horários agendados.</p><a class="button button-primary" href="login.html?redirect=my-schedules.html">Efetuar login</a></div>`;
    return;
  }

  if (!isClientRole()) {
    root.innerHTML = `<div class="empty-state"><h2>Área exclusiva de clientes</h2><p>Para perfis com permissões elevadas, use o painel administrativo.</p><a class="button button-primary" href="admin-home.html">Ir para o painel</a></div>`;
    return;
  }

  const session = getSession();
  const schedules = (await loadSchedules()).filter((item) => item.client_email === session?.email || !item.client_email);

  if (!schedules.length) {
    root.innerHTML = `<div class="empty-state"><h2>Você não tem horários agendados</h2><p>Quando confirmar um agendamento ele aparecerá aqui.</p><a class="button button-primary" href="booking-location.html">Agendar agora</a></div>`;
    return;
  }

  root.innerHTML = schedules
    .map((item) => `<article class="schedule-item"><h3>${item.service} · ${formatBookingDateTime(item.date, item.time)}</h3><p>${item.branch} - ${item.city}</p><small>${item.address}</small></article>`)
    .join('');
}


function initClientHomePage() {
  const wrap = document.getElementById('client-branding');
  if (!wrap) return;

  const brand = getBrandSettings();
  const nameEl = document.getElementById('client-brand-name');
  const logoEl = document.getElementById('client-brand-logo');

  if (nameEl) nameEl.textContent = brand.shopName || 'BarberPro';

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

  if (!isLoggedIn()) {
    window.location.href = 'login.html?redirect=admin-settings.html';
    return;
  }

  if (!isAdminRole()) {
    window.location.href = isBarberRole() ? 'barber-home.html' : 'client-home.html';
    return;
  }

  const nameEl = document.getElementById('shop-name');
  const colorEl = document.getElementById('shop-color');
  const logoUrlEl = document.getElementById('shop-logo-url');
  const logoFileEl = document.getElementById('shop-logo-file');
  const previewName = document.getElementById('brand-preview-name');
  const previewLogo = document.getElementById('brand-preview-logo');

  const brand = getBrandSettings();
  nameEl.value = brand.shopName || '';
  colorEl.value = brand.primaryColor || '#d4a24f';
  logoUrlEl.value = brand.logoUrl || '';

  function updatePreview(logoUrl) {
    previewName.textContent = nameEl.value || 'BarberPro';
    if (logoUrl) {
      previewLogo.src = logoUrl;
      previewLogo.style.display = 'block';
    } else {
      previewLogo.style.display = 'none';
    }
  }

  updatePreview(brand.logoUrl);

  nameEl.addEventListener('input', () => updatePreview(logoUrlEl.value));
  logoUrlEl.addEventListener('input', () => updatePreview(logoUrlEl.value));

  logoFileEl.addEventListener('change', () => {
    const file = logoFileEl.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      logoUrlEl.value = String(reader.result || '');
      updatePreview(logoUrlEl.value);
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    saveBrandSettings({
      shopName: nameEl.value.trim() || 'BarberPro',
      primaryColor: colorEl.value || '#d4a24f',
      logoUrl: logoUrlEl.value.trim()
    });
    applyBrandTheme();
    updatePreview(logoUrlEl.value.trim());
  });
}

async function initAdminSchedulesPage() {
  const list = document.getElementById('admin-schedules-list');
  const filter = document.getElementById('admin-professional-filter');
  if (!list || !filter) return;

  if (!isLoggedIn()) {
    window.location.href = 'login.html?redirect=admin-schedules.html';
    return;
  }

  if (!isElevatedRole()) {
    window.location.href = 'client-home.html';
    return;
  }

  const barbers = getBarbers();
  const options = [{ id: 'all', name: 'Todos os barbeiros' }, ...barbers];
  populateSelect(filter, options, 'Todos os barbeiros');

  const session = getSession();
  const allSchedules = await loadSchedules();

  function render() {
    let filtered = allSchedules;

    if (isBarberRole()) {
      filter.disabled = true;
      filter.value = session?.barberId || '';
      filtered = allSchedules.filter((item) => item.professional_id === session?.barberId || slugify(item.professional || '') === slugify(session?.name || ''));
    } else {
      filter.disabled = false;
      const selected = filter.value || 'all';
      if (selected !== 'all') {
        const selectedName = options.find((o) => o.id === selected)?.name;
        filtered = allSchedules.filter((item) => item.professional_id === selected || slugify(item.professional || '') === slugify(selectedName || ''));
      }
    }

    if (!filtered.length) {
      list.innerHTML = '<div class="empty-state"><h2>Sem agendamentos neste filtro</h2><p>Escolha outro barbeiro ou aguarde novos agendamentos.</p></div>';
      return;
    }

    list.innerHTML = filtered
      .map(
        (item) => `<article class="schedule-item"><h3>${item.service} · ${formatBookingDateTime(item.date, item.time)}</h3><p>${item.professional || 'Sem preferência'} · ${item.branch} - ${item.city}</p><small>${item.client_name || 'Cliente'} (${item.client_email || 'sem e-mail'})</small></article>`
      )
      .join('');
  }

  if (!isBarberRole()) {
    filter.value = 'all';
    filter.addEventListener('change', render);
  }

  render();
}

function initAdminBarbersPage() {
  const form = document.getElementById('barber-form');
  if (!form) return;

  if (!isLoggedIn()) {
    window.location.href = 'login.html?redirect=admin-barbers.html';
    return;
  }

  if (!isAdminRole()) {
    window.location.href = isBarberRole() ? 'barber-home.html' : 'client-home.html';
    return;
  }

  const idEl = document.getElementById('barber-id');
  const nameEl = document.getElementById('barber-name');
  const emailEl = document.getElementById('barber-email');
  const passwordEl = document.getElementById('barber-password');
  const listEl = document.getElementById('barbers-list');
  const cancelEl = document.getElementById('barber-cancel');

  function resetForm() {
    idEl.value = '';
    nameEl.value = '';
    emailEl.value = '';
    passwordEl.value = '';
  }

  function render() {
    const barbers = getBarbers();
    listEl.innerHTML = barbers
      .map(
        (barber) => `<article class="schedule-item"><h3>${barber.name}</h3><p>${barber.email}</p><div class="form-row"><button class="button button-secondary" type="button" data-edit="${barber.id}">Editar</button><button class="button button-secondary" type="button" data-delete="${barber.id}">Excluir</button></div></article>`
      )
      .join('');

    listEl.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const barber = barbers.find((item) => item.id === btn.dataset.edit);
        if (!barber) return;
        idEl.value = barber.id;
        nameEl.value = barber.name;
        emailEl.value = barber.email;
        passwordEl.value = barber.password;
      });
    });

    listEl.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = barbers.filter((item) => item.id !== btn.dataset.delete);
        saveBarbers(next);
        render();
      });
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const barbers = getBarbers();

    const payload = {
      id: idEl.value || slugify(nameEl.value),
      name: nameEl.value.trim(),
      email: emailEl.value.trim(),
      password: passwordEl.value.trim(),
      avatar: '💈'
    };

    const existsByEmail = barbers.find((item) => item.email.toLowerCase() === payload.email.toLowerCase() && item.id !== payload.id);
    if (existsByEmail) return;

    const index = barbers.findIndex((item) => item.id === payload.id);
    if (index >= 0) {
      barbers[index] = { ...barbers[index], ...payload };
    } else {
      barbers.push(payload);
    }

    saveBarbers(barbers);
    resetForm();
    render();
  });

  cancelEl.addEventListener('click', resetForm);
  render();
}

initLoginPage();
initLocationPage();
initServicePage();
initProfessionalPage();
initDatetimePage();
initBookingReviewPage();
initMySchedulesPage();
initClientHomePage();
initAdminSchedulesPage();
initAdminBarbersPage();
initAdminSettingsPage();

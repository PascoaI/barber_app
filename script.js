const BARBER_DATA = {
  cities: [
    {
      id: 'poa',
      name: 'Porto Alegre',
      branches: [
        { id: 'cidade-baixa', name: 'Cidade Baixa' },
        { id: 'petropolis', name: 'Petrópolis' }
      ]
    },
    {
      id: 'viamao',
      name: 'Viamão',
      branches: [{ id: 'centro-viamao', name: 'Centro' }]
    }
  ],
  services: [
    { id: 'corte', name: 'Corte', price: 45, emoji: '✂️' },
    { id: 'corte-sobrancelha', name: 'Corte + Sobrancelha', price: 60, emoji: '🧔' },
    { id: 'infantil', name: 'Corte Infantil', price: 40, emoji: '👦' },
    { id: 'acabamento', name: 'Acabamento', price: 30, emoji: '✨' },
    { id: 'nariz', name: 'Depilação do Nariz', price: 25, emoji: '👃' },
    { id: 'hidratacao', name: 'Hidratação', price: 35, emoji: '💧' },
    { id: 'sobrancelha', name: 'Sobrancelha', price: 20, emoji: '🪒' }
  ],
  professionals: [
    { id: 'pedro', name: 'Pedro', avatar: '👨🏽' },
    { id: 'fernando', name: 'Fernando', avatar: '👨🏻' },
    { id: 'nathaniel', name: 'Nathaniel', avatar: '👨🏾' },
    { id: 'sem-preferencia', name: 'Sem preferência', avatar: '⭐' }
  ],
  unavailableBookings: {
    'poa|cidade-baixa|pedro|2026-02-26|16:00': true,
    'poa|cidade-baixa|pedro|2026-02-26|09:30': true,
    'poa|cidade-baixa|fernando|2026-02-26|16:00': true,
    'poa|cidade-baixa|nathaniel|2026-02-26|16:00': true
  }
};

const STORAGE_KEYS = {
  loggedIn: 'barberpro_logged_in',
  role: 'barberpro_role',
  booking: 'barberpro_booking'
};

const BOOKING_DEFAULT = {
  city: '',
  branch: '',
  service: '',
  professional: '',
  date: '',
  time: ''
};

function getBooking() {
  try {
    return { ...BOOKING_DEFAULT, ...JSON.parse(localStorage.getItem(STORAGE_KEYS.booking) || '{}') };
  } catch {
    return { ...BOOKING_DEFAULT };
  }
}

function saveBooking(partial) {
  const current = getBooking();
  localStorage.setItem(STORAGE_KEYS.booking, JSON.stringify({ ...current, ...partial }));
}

function mustHave(fields) {
  const data = getBooking();
  return fields.every((field) => Boolean(data[field]));
}

function populateSelect(select, options, placeholder) {
  select.innerHTML = `<option value="">${placeholder}</option>`;
  options.forEach((option) => {
    const element = document.createElement('option');
    element.value = option.id || option.value;
    element.textContent = option.name || option.label;
    select.appendChild(element);
  });
}

function getNextDays(count = 7) {
  const base = new Date('2026-02-26T08:00:00');
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return {
      value: d.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(d)
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

function isLoggedIn() {
  return localStorage.getItem(STORAGE_KEYS.loggedIn) === 'true';
}

function bookingKey(city, branch, professional, date, time) {
  return `${city}|${branch}|${professional}|${date}|${time}`;
}

function isUnavailable(data, time) {
  if (data.professional === 'sem-preferencia') {
    return BARBER_DATA.professionals
      .filter((p) => p.id !== 'sem-preferencia')
      .every((p) => BARBER_DATA.unavailableBookings[bookingKey(data.city, data.branch, p.id, data.date, time)]);
  }
  return Boolean(BARBER_DATA.unavailableBookings[bookingKey(data.city, data.branch, data.professional, data.date, time)]);
}

function initLoginPage() {
  const form = document.querySelector('form.auth-form');
  if (!form || !document.title.includes('Login')) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('email')?.value || '';
    const isAdmin = email.toLowerCase().includes('admin');

    localStorage.setItem(STORAGE_KEYS.loggedIn, 'true');
    localStorage.setItem(STORAGE_KEYS.role, isAdmin ? 'admin' : 'client');

    const redirect = new URLSearchParams(window.location.search).get('redirect');
    if (redirect) {
      window.location.href = redirect;
      return;
    }

    window.location.href = isAdmin ? 'admin-home.html' : 'client-home.html';
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
      <span class="service-price">R$ ${service.price},00</span>
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

  BARBER_DATA.professionals.forEach((professional) => {
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

  const service = BARBER_DATA.services.find((s) => s.id === current.service);
  const city = BARBER_DATA.cities.find((c) => c.id === current.city);
  const branch = city?.branches.find((b) => b.id === current.branch);
  const professional = BARBER_DATA.professionals.find((p) => p.id === current.professional);

  document.getElementById('summary-service').textContent = `Serviço: ${service?.name || '-'}`;
  document.getElementById('summary-price').textContent = `Valor a partir de: ${service ? `R$ ${service.price},00` : '-'}`;
  document.getElementById('summary-location').textContent = `Local: ${branch?.name || '-'} - ${city?.name || '-'}`;
  document.getElementById('summary-professional').textContent = `Profissional: ${professional?.name || '-'}`;

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
        updateConfirm();
      });

      timeGrid.appendChild(btn);
    });
  }

  function updateConfirm() {
    const data = getBooking();
    const ready = Boolean(data.date && data.time);
    confirmBtn.disabled = !ready;
    confirmBtn.textContent = isLoggedIn() ? 'Confirmar agendamento' : 'Efetuar login para continuar';
  }

  dateEl.addEventListener('change', () => {
    saveBooking({ date: dateEl.value, time: '' });
    renderTimes();
    updateConfirm();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!mustHave(['date', 'time'])) return;

    if (!isLoggedIn()) {
      window.location.href = 'login.html?redirect=booking-datetime.html';
      return;
    }

    alert('Agendamento confirmado com sucesso!');
  });

  renderTimes();
  updateConfirm();
}

initLoginPage();
initLocationPage();
initServicePage();
initProfessionalPage();
initDatetimePage();

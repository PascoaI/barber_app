function initGlobalNavigation() {
  const session = getSession();
  const iconSvg = {
    home: '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 10 9-7 9 7"></path><path d="M5 10v11h14V10"></path><path d="M9 21v-6h6v6"></path></svg></span>',
    back: '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg></span>',
    menu: '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16"></path><path d="M4 6h16"></path><path d="M4 18h16"></path></svg></span>',
    logout: '<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 21-5-5 5-5"></path><path d="M4 16h10"></path><path d="M20 3H12a2 2 0 0 0-2 2v4"></path><path d="M14 21h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-6"></path></svg></span>'
  };

  const handleLogout = () => {
    clearSession();
    resetBooking();
    window.location.href = 'login.html';
  };

  const getClientMenuDefaults = () => [
    ['client-subscriptions.html', 'Assinaturas'],
    ['client-history.html', 'Histórico'],
    ['client-profile', 'Perfil']
  ];



  if (session && ['admin', 'super_admin', 'barber'].includes(session.role)) {
    if (!document.querySelector('[data-logout]') && !document.querySelector('.admin-logout-btn')) {
      const wrap = document.createElement('div');
      wrap.className = 'admin-inline-actions';
      const logoutBtn = document.createElement('button');
      logoutBtn.type = 'button';
      logoutBtn.className = 'button button-secondary admin-logout-btn';
      logoutBtn.textContent = 'Sair';
      logoutBtn.addEventListener('click', handleLogout);
      wrap.appendChild(logoutBtn);

      const backLink = document.querySelector('.back-link');
      if (backLink && backLink.parentElement) backLink.parentElement.insertBefore(wrap, backLink.nextSibling);
      else {
        const card = document.querySelector('.booking-card, .hero-card, .form-card');
        if (card) card.insertBefore(wrap, card.firstChild);
      }
    }
  }

  document.querySelectorAll('.quick-nav').forEach((nav) => {
    nav.closest('.booking-card, .hero-card, .form-card, .auth-card')?.classList.add('quick-nav-host-open');
    nav.classList.remove('justify-end');
    nav.classList.add('justify-between', 'items-center');

    const home = nav.querySelector('[data-home]');
    const back = nav.querySelector('[data-back]');

    if (back) {
      back.innerHTML = `${iconSvg.back}<span class="sr-only">Voltar</span>`;
      back.setAttribute('aria-label', 'Voltar');
      back.classList.add('!w-10', '!min-h-10', '!px-0', 'rounded-full', 'nav-icon-btn');
      back.onclick = () => {
        if (window.history.length > 1) window.history.back();
        else window.location.href = session?.role === 'client' ? 'client-home.html' : 'index.html';
      };
    }

    if (home) {
      home.innerHTML = `${iconSvg.home}<span class="sr-only">Home</span>`;
      home.setAttribute('aria-label', 'Home');
      home.classList.add('!w-10', '!min-h-10', '!px-0', 'rounded-full', 'nav-icon-btn');
      if (!session) home.setAttribute('href', 'index.html');
      else if (session.role === 'client') home.setAttribute('href', 'client-home.html');
      else if (session.role === 'barber') home.setAttribute('href', 'barber-home.html');
      else if (session.role === 'super_admin') home.setAttribute('href', 'super-admin-tenants.html');
      else home.setAttribute('href', 'admin-home.html');
    }

    const left = document.createElement('div');
    left.className = 'quick-nav-left flex items-center gap-2';
    if (back) left.appendChild(back);
    if (home) left.appendChild(home);
    if (left.children.length) nav.prepend(left);

    const menuBtn = document.createElement('button');
    menuBtn.type = 'button';
    menuBtn.className = 'button button-secondary nav-icon-btn quick-menu-trigger inline-flex items-center justify-center rounded-xl px-3 min-h-10';
    menuBtn.setAttribute('aria-label', 'Abrir menu');
    menuBtn.innerHTML = `${iconSvg.menu}<span class="sr-only">Menu</span>`;

    const panel = document.createElement('div');
    panel.className = 'quick-menu-panel';

    const appendMenuLink = (href, label) => {
      const item = document.createElement('a');
      item.href = href;
      item.className = 'button button-secondary quick-menu-item';
      item.textContent = label;
      panel.appendChild(item);
    };

    const appendMenuButton = (label, onClick) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'button button-secondary quick-menu-item';
      item.textContent = label;
      item.addEventListener('click', onClick);
      panel.appendChild(item);
    };

    const extras = Array.from(nav.children).filter((el) => el !== left && el !== menuBtn && el !== panel);
    extras.forEach((el) => {
      if (el === home || el === back) return;
      if (el.matches('[data-logout]') || el.querySelector?.('[data-logout]')) {
        if (session) appendMenuButton('Sair', handleLogout);
      } else if (el.tagName === 'A') {
        appendMenuLink(el.getAttribute('href') || '#', el.textContent.trim() || 'Acessar');
      } else if (el.tagName === 'BUTTON') {
        appendMenuButton(el.textContent.trim() || 'Ação', () => el.click());
      }
      el.remove();
    });

    if (session?.role === 'client') {
      const existing = new Set(Array.from(panel.querySelectorAll('a')).map((a) => a.getAttribute('href')));
      getClientMenuDefaults().forEach(([href, label]) => {
        if (!existing.has(href)) appendMenuLink(href, label);
      });
      if (!panel.querySelector('button')) appendMenuButton('Sair', handleLogout);
    }

    if (session?.role === 'client' && !panel.children.length) {
      appendMenuButton('Sair', handleLogout);
    }

    const isAdminDashboard = /admin-home(\.html)?$/i.test(window.location.pathname) || document.getElementById('admin-metrics');
    if (isAdminDashboard) panel.innerHTML = '';

    const right = document.createElement('div');
    right.className = 'quick-nav-right relative';

    const notifications = createClientNotificationsBell(session);
    if (notifications) {
      right.appendChild(notifications.bellBtn);
    }

    const showMenu = !isAdminDashboard && !!panel.children.length;
    if (showMenu) {
      right.appendChild(menuBtn);
      right.appendChild(panel);
    }

    if (session && ['admin', 'super_admin', 'barber'].includes(session.role)) {
      const logoutBtn = document.createElement('button');
      logoutBtn.type = 'button';
      logoutBtn.className = 'button button-danger nav-icon-btn inline-flex items-center justify-center rounded-xl px-3 min-h-10';
      logoutBtn.innerHTML = `${iconSvg.logout}<span>Sair</span>`;
      logoutBtn.addEventListener('click', handleLogout);
      right.appendChild(logoutBtn);
    }

    if (!showMenu && !(session && ['admin', 'super_admin', 'barber'].includes(session.role))) return;
    nav.appendChild(right);

    if (showMenu) {
      menuBtn.addEventListener('click', () => {
        panel.classList.toggle('is-open');
      });
    }

    document.addEventListener('click', (e) => {
      if (showMenu && !right.contains(e.target)) {
        panel.classList.remove('is-open');
      }
    });
  });
}


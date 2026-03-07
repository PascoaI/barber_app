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
  requireRole(['barber'], 'login.html');
}

function dbEnabled() {
  return Boolean(DB_CONFIG.supabaseUrl && DB_CONFIG.supabaseAnonKey);
}

function ensureDbSchemaNote() {
  if (dbEnabled()) {
    // placeholder para integração backend real / transações
  }
}



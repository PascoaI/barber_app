function initSuperAdminTenantsPage() {
  const root = document.getElementById('tenants-root');
  if (!root) return;
  if (!requireRole(['super_admin'], 'super-admin-login.html')) return;

  const totalEl = document.getElementById('sa-total-barbershops');
  const totalAllEl = document.getElementById('sa-total-all');
  const totalActiveEl = document.getElementById('sa-total-active');
  const totalTrialEl = document.getElementById('sa-total-trial');
  const totalSuspendedEl = document.getElementById('sa-total-suspended');

  const asDateTime = (iso) => {
    const d = new Date(iso || 0);
    if (!Number.isFinite(d.getTime())) return '-';
    return d.toLocaleString('pt-BR');
  };

  const asDate = (iso) => {
    const d = new Date(iso || 0);
    if (!Number.isFinite(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR');
  };

  const allowedStatus = new Set(['active', 'trial', 'suspended', 'disabled']);
  const allowedPlan = new Set(['free', 'basic', 'pro', 'enterprise']);
  const normalizeStatus = (value) => (allowedStatus.has(value) ? value : 'active');
  const normalizePlan = (value) => (allowedPlan.has(value) ? value : 'basic');
  const getStatusMeta = (status) => {
    if (status === 'trial') return { label: 'Trial', css: 'status-trial' };
    if (status === 'suspended') return { label: 'Suspensa', css: 'status-suspended' };
    if (status === 'disabled') return { label: 'Desativada', css: 'status-canceled' };
    return { label: 'Ativa', css: 'status-confirmed' };
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

  const removeAdminUserForShop = (shop) => {
    savePlatformUsers(getPlatformUsers().filter((u) => !(u.role === 'admin' && u.email.toLowerCase() === shop.email.toLowerCase())));
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

  const removeTenantFromShop = (shop) => {
    setJson(STORAGE_KEYS.tenants, getJson(STORAGE_KEYS.tenants, []).filter((t) => t.id !== shop.tenant_id && t.id !== shop.id));
  };

  const render = () => {
    const rows = getBarbershops()
      .map((row) => ({
        ...row,
        status: normalizeStatus(row.status),
        plan: normalizePlan(row.plan),
        plan_expires_at: row.plan_expires_at || null
      }))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    if (totalEl) totalEl.textContent = String(rows.length);
    if (totalAllEl) totalAllEl.textContent = String(rows.length);
    if (totalActiveEl) totalActiveEl.textContent = String(rows.filter((x) => x.status === 'active').length);
    if (totalTrialEl) totalTrialEl.textContent = String(rows.filter((x) => x.status === 'trial').length);
    if (totalSuspendedEl) totalSuspendedEl.textContent = String(rows.filter((x) => x.status === 'suspended').length);

    root.innerHTML = rows.length
      ? rows
        .map((shop) => `
          <article class="superadmin-table-row">
            <div><strong>${sanitizeText(shop.name)}</strong><small>ID: ${sanitizeText(shop.id)}</small></div>
            <div>${sanitizeText(shop.owner_name || '-')}</div>
            <div>${sanitizeText(shop.email || '-')}</div>
            <div>${sanitizeText(shop.phone || '-')}</div>
            <div><span class="status-badge ${getStatusMeta(shop.status).css}">${getStatusMeta(shop.status).label}</span></div>
            <div><strong>${String(shop.plan || 'basic').toUpperCase()}</strong><small>${shop.plan_expires_at ? `Expira em ${asDate(shop.plan_expires_at)}` : 'Sem expiracao'}</small></div>
            <div>${asDateTime(shop.created_at)}</div>
            <div class="superadmin-actions">
              <button type="button" class="button button-secondary superadmin-action-btn" data-sa-action="edit" data-id="${shop.id}">Editar</button>
              <button type="button" class="button button-secondary superadmin-action-btn" data-sa-action="toggle" data-id="${shop.id}">${shop.status === 'disabled' ? 'Ativar' : 'Desativar'}</button>
              <button type="button" class="button button-secondary superadmin-action-btn" data-sa-action="reset" data-id="${shop.id}">Reset senha</button>
              <button type="button" class="button button-danger superadmin-action-btn superadmin-action-delete" data-sa-action="delete" data-id="${shop.id}">Excluir</button>
            </div>
          </article>
        `)
        .join('')
      : '<article class="schedule-item"><h3>Nenhuma barbearia cadastrada</h3><p>Use o formulario para criar a primeira.</p></article>';
  };

  root.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-sa-action]');
    if (!target) return;
    const action = target.dataset.saAction;
    const id = target.dataset.id;
    const rows = getBarbershops();
    const idx = rows.findIndex((x) => x.id === id);
    if (idx < 0) return;
    const row = rows[idx];

    if (action === 'edit') {
      window.location.href = `super-admin-barbershop-form.html?id=${encodeURIComponent(row.id)}`;
      return;
    }

    if (action === 'toggle') {
      const toDisable = row.status !== 'disabled';
      const ok = await confirmAction(toDisable ? 'Deseja desativar esta barbearia?' : 'Deseja reativar esta barbearia?', {
        title: toDisable ? 'Desativar barbearia' : 'Ativar barbearia',
        confirmText: toDisable ? 'Desativar' : 'Ativar'
      });
      if (!ok) return;

      rows[idx] = { ...row, status: toDisable ? 'disabled' : 'active', updated_at: nowIso() };
      saveBarbershops(rows);
      syncTenantFromShop(rows[idx]);
      logAudit('superadmin_barbershop_status_changed', { barbershop_id: row.id, status: rows[idx].status });
      render();
      return;
    }

    if (action === 'reset') {
      const ok = await confirmAction('Definir senha padrão para esta barbearia?', {
        title: 'Reset de senha',
        confirmText: 'Resetar'
      });
      if (!ok) return;
      const nextPassword = '123456';
      rows[idx] = { ...row, password_hash: `plain:${nextPassword}`, updated_at: nowIso() };
      saveBarbershops(rows);
      syncTenantFromShop(rows[idx]);
      upsertAdminUserForShop(rows[idx], nextPassword);
      await alertAction('Senha redefinida para: 123456', { title: 'Senha atualizada' });
      logAudit('superadmin_barbershop_password_reset', { barbershop_id: row.id });
      render();
      return;
    }

    if (action === 'delete') {
      const ok = await confirmAction('Excluir permanentemente esta barbearia?', {
        title: 'Excluir barbearia',
        confirmText: 'Excluir'
      });
      if (!ok) return;

      const [removed] = rows.splice(idx, 1);
      saveBarbershops(rows);
      removeTenantFromShop(removed);
      removeAdminUserForShop(removed);
      logAudit('superadmin_barbershop_deleted', { barbershop_id: removed.id });
      render();
    }
  });
  render();
}


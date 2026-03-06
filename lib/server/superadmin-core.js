function sanitizeText(value) {
  return String(value || '').replace(/[<>]/g, '').trim();
}

function nowIso() {
  return new Date().toISOString();
}

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function canSuperAdminLogin(users, email, password) {
  return users.find((u) => u.role === 'super_admin' && String(u.email).toLowerCase() === String(email).toLowerCase() && u.password === password) || null;
}

function canAdminLoginForBarbershop(user, barbershops) {
  if (!user || user.role !== 'admin') return true;
  const shop = barbershops.find((s) => String(s.email).toLowerCase() === String(user.email).toLowerCase() || s.id === user.unit_id);
  if (!shop) return true;
  return shop.status !== 'disabled';
}

function createOrUpdateBarbershop({ rows, form, editId, idFactory }) {
  const list = Array.isArray(rows) ? [...rows] : [];
  const isEdit = Boolean(editId);
  const existingIdx = isEdit ? list.findIndex((x) => x.id === editId) : -1;
  if (isEdit && existingIdx < 0) return { ok: false, reason: 'not_found' };

  const incomingEmail = sanitizeText(form.email).toLowerCase();
  const duplicated = list.some((x) => String(x.email).toLowerCase() === incomingEmail && x.id !== editId);
  if (duplicated) return { ok: false, reason: 'duplicate_email' };

  const generatedId = isEdit
    ? editId
    : (idFactory ? idFactory(form) : `shop_${slugify(form.name || form.owner_name || `novo-${Date.now()}`)}_${Date.now().toString().slice(-6)}`);

  const current = existingIdx >= 0 ? list[existingIdx] : null;
  const passwordRaw = sanitizeText(form.password) || String(current?.password_hash || '').replace(/^plain:/, '') || '123456';

  const payload = {
    id: generatedId,
    barbershop_id: generatedId,
    tenant_id: generatedId,
    name: sanitizeText(form.name),
    owner_name: sanitizeText(form.owner_name),
    email: incomingEmail,
    phone: sanitizeText(form.phone),
    password_hash: `plain:${passwordRaw}`,
    address: sanitizeText(form.address || ''),
    status: form.status === 'disabled' ? 'disabled' : 'active',
    created_at: current?.created_at || nowIso(),
    updated_at: nowIso()
  };

  if (existingIdx >= 0) list[existingIdx] = payload;
  else list.unshift(payload);

  return { ok: true, rows: list, payload, isEdit };
}

function toggleBarbershopStatus(rows, id) {
  const list = Array.isArray(rows) ? [...rows] : [];
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return { ok: false, reason: 'not_found' };
  const row = list[idx];
  const nextStatus = row.status === 'active' ? 'disabled' : 'active';
  list[idx] = { ...row, status: nextStatus, updated_at: nowIso() };
  return { ok: true, rows: list, row: list[idx] };
}

function resetBarbershopPassword(rows, id, password = '123456') {
  const list = Array.isArray(rows) ? [...rows] : [];
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return { ok: false, reason: 'not_found' };
  list[idx] = { ...list[idx], password_hash: `plain:${sanitizeText(password) || '123456'}`, updated_at: nowIso() };
  return { ok: true, rows: list, row: list[idx] };
}

function deleteBarbershop(rows, id) {
  const list = Array.isArray(rows) ? [...rows] : [];
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return { ok: false, reason: 'not_found' };
  const removed = list[idx];
  list.splice(idx, 1);
  return { ok: true, rows: list, removed };
}

function upsertAdminUserForShop(users, shop, passwordOverride = '') {
  const list = Array.isArray(users) ? [...users] : [];
  const idx = list.findIndex((u) => String(u.email).toLowerCase() === String(shop.email).toLowerCase());
  const password = passwordOverride || String(shop.password_hash || '').replace(/^plain:/, '') || '123456';
  const payload = {
    email: shop.email,
    password,
    role: 'admin',
    name: shop.owner_name || 'Administrador',
    unit_id: shop.id,
    barbershop_id: shop.id
  };
  if (idx >= 0) list[idx] = { ...list[idx], ...payload };
  else list.push(payload);
  return list;
}

function removeAdminUserForShop(users, shop) {
  const list = Array.isArray(users) ? [...users] : [];
  return list.filter((u) => !(u.role === 'admin' && String(u.email).toLowerCase() === String(shop.email).toLowerCase()));
}

module.exports = {
  canSuperAdminLogin,
  canAdminLoginForBarbershop,
  createOrUpdateBarbershop,
  toggleBarbershopStatus,
  resetBarbershopPassword,
  deleteBarbershop,
  upsertAdminUserForShop,
  removeAdminUserForShop
};

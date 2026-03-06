const test = require('node:test');
const assert = require('node:assert/strict');

const {
  canSuperAdminLogin,
  canAdminLoginForBarbershop,
  createOrUpdateBarbershop,
  toggleBarbershopStatus,
  resetBarbershopPassword,
  deleteBarbershop,
  upsertAdminUserForShop,
  removeAdminUserForShop
} = require('../lib/server/superadmin-core');

test('login exclusivo de super admin valida apenas credenciais corretas', () => {
  const users = [
    { email: 'admin@shop.com', password: '123', role: 'admin' },
    { email: 'super@barber.com', password: '123456', role: 'super_admin' }
  ];

  assert.equal(Boolean(canSuperAdminLogin(users, 'super@barber.com', '123456')), true);
  assert.equal(Boolean(canSuperAdminLogin(users, 'admin@shop.com', '123')), false);
  assert.equal(Boolean(canSuperAdminLogin(users, 'super@barber.com', 'errada')), false);
});

test('admin de barbearia desativada nao pode logar', () => {
  const user = { email: 'owner@shop.com', role: 'admin', unit_id: 'shop_1' };
  const shops = [{ id: 'shop_1', email: 'owner@shop.com', status: 'disabled' }];
  assert.equal(canAdminLoginForBarbershop(user, shops), false);
});

test('cria barbearia nova com dados saneados e status', () => {
  const result = createOrUpdateBarbershop({
    rows: [],
    form: {
      name: 'Barber One',
      owner_name: 'Lucas <Admin>',
      email: 'owner@barber.com',
      phone: '(51) 99999-0000',
      password: 'abc123',
      address: 'Rua A',
      status: 'active'
    },
    editId: '',
    idFactory: () => 'shop_fixed'
  });

  assert.equal(result.ok, true);
  assert.equal(result.payload.id, 'shop_fixed');
  assert.equal(result.payload.owner_name.includes('<'), false);
  assert.equal(result.rows.length, 1);
});

test('nao permite cadastrar barbearia com email duplicado', () => {
  const rows = [{ id: 'shop_1', email: 'owner@barber.com' }];
  const result = createOrUpdateBarbershop({
    rows,
    form: {
      name: 'Outra',
      owner_name: 'Resp',
      email: 'owner@barber.com',
      phone: 'x',
      password: 'x',
      status: 'active'
    },
    editId: ''
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'duplicate_email');
});

test('alterna status da barbearia entre ativa e desativada', () => {
  const rows = [{ id: 'shop_1', status: 'active' }];
  const first = toggleBarbershopStatus(rows, 'shop_1');
  assert.equal(first.ok, true);
  assert.equal(first.row.status, 'disabled');

  const second = toggleBarbershopStatus(first.rows, 'shop_1');
  assert.equal(second.ok, true);
  assert.equal(second.row.status, 'active');
});

test('reset de senha salva hash simples esperado', () => {
  const rows = [{ id: 'shop_1', password_hash: 'plain:old' }];
  const result = resetBarbershopPassword(rows, 'shop_1', '123456');
  assert.equal(result.ok, true);
  assert.equal(result.row.password_hash, 'plain:123456');
});

test('exclusao remove barbearia e retorna removida', () => {
  const rows = [{ id: 'shop_1' }, { id: 'shop_2' }];
  const result = deleteBarbershop(rows, 'shop_1');
  assert.equal(result.ok, true);
  assert.equal(result.rows.length, 1);
  assert.equal(result.removed.id, 'shop_1');
});

test('upsert e remove admin de barbearia no pool de usuarios', () => {
  const users = [{ email: 'super@barber.com', role: 'super_admin', password: '123456' }];
  const shop = { id: 'shop_1', email: 'owner@shop.com', owner_name: 'Owner', password_hash: 'plain:abc123' };

  const withAdmin = upsertAdminUserForShop(users, shop);
  const admin = withAdmin.find((u) => u.email === 'owner@shop.com');
  assert.equal(Boolean(admin), true);
  assert.equal(admin.role, 'admin');
  assert.equal(admin.unit_id, 'shop_1');

  const withoutAdmin = removeAdminUserForShop(withAdmin, shop);
  assert.equal(Boolean(withoutAdmin.find((u) => u.email === 'owner@shop.com')), false);
});

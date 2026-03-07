const test = require('node:test');
const assert = require('node:assert/strict');

const { validateStrongPassword } = require('../lib/server/security-core');
const { isLocked, registerFailure, resetFailures } = require('../lib/server/auth-throttle');

test('senha forte valida passa na politica', () => {
  const result = validateStrongPassword('SenhaForte@2026');
  assert.equal(result.ok, true);
  assert.deepEqual(result.reasons, []);
});

test('senha fraca retorna motivos', () => {
  const result = validateStrongPassword('abc');
  assert.equal(result.ok, false);
  assert.equal(result.reasons.includes('missing_uppercase'), true);
  assert.equal(result.reasons.includes('missing_number'), true);
  assert.equal(result.reasons.includes('missing_special'), true);
});

test('bloqueio apos multiplas tentativas falhas', () => {
  const identity = 'ip:127.0.0.1:user@test.com';
  resetFailures(identity);

  for (let i = 0; i < 5; i += 1) {
    registerFailure(identity, { maxAttempts: 5, windowMs: 60_000, lockMs: 60_000 });
  }

  const lockState = isLocked(identity);
  assert.equal(lockState.locked, true);

  resetFailures(identity);
  const unlocked = isLocked(identity);
  assert.equal(unlocked.locked, false);
});

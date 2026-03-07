const DEFAULT_PASSWORD_POLICY = {
  minLength: 10,
  requireUpper: true,
  requireLower: true,
  requireNumber: true,
  requireSpecial: true
};

function validateStrongPassword(password, policy = DEFAULT_PASSWORD_POLICY) {
  const value = String(password || '');
  const reasons = [];

  if (value.length < policy.minLength) reasons.push(`min_length_${policy.minLength}`);
  if (policy.requireUpper && !/[A-Z]/.test(value)) reasons.push('missing_uppercase');
  if (policy.requireLower && !/[a-z]/.test(value)) reasons.push('missing_lowercase');
  if (policy.requireNumber && !/[0-9]/.test(value)) reasons.push('missing_number');
  if (policy.requireSpecial && !/[^A-Za-z0-9]/.test(value)) reasons.push('missing_special');

  return {
    ok: reasons.length === 0,
    reasons
  };
}

module.exports = {
  DEFAULT_PASSWORD_POLICY,
  validateStrongPassword
};

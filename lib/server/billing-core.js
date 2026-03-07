function mapStripeStatusToTenantStatus(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'active') return 'active';
  if (value === 'trialing') return 'trial';
  if (['past_due', 'unpaid', 'paused'].includes(value)) return 'suspended';
  if (['canceled', 'incomplete_expired'].includes(value)) return 'disabled';
  return 'trial';
}

module.exports = {
  mapStripeStatusToTenantStatus
};

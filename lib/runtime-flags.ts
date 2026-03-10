function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function parseEmails(value: string | undefined) {
  const raw = String(value || 'cliente@barber.com');
  return raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function shouldEnforceStrongPasswordPolicy() {
  const value = process.env.NEXT_PUBLIC_ENFORCE_STRONG_PASSWORDS ?? process.env.ENFORCE_STRONG_PASSWORDS;
  return parseBoolean(value, false);
}

export function shouldEnforceClientNoShowBlocking() {
  const value = process.env.NEXT_PUBLIC_ENFORCE_CLIENT_BLOCKING ?? process.env.ENFORCE_CLIENT_BLOCKING;
  return parseBoolean(value, false);
}

export function isTemporaryBypassUser(email?: string | null) {
  if (!email) return false;
  const value = process.env.NEXT_PUBLIC_TEST_BYPASS_EMAILS ?? process.env.TEST_BYPASS_EMAILS;
  const bypassEmails = parseEmails(value);
  return bypassEmails.includes(String(email).trim().toLowerCase());
}

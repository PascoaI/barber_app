'use client';

import { withCsrfHeaders } from '@/lib/security/csrf-client';

const OUTBOX_KEY = 'barberpro_booking_outbox_v1';

type OutboxItem = {
  id: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

function readOutbox(): OutboxItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(OUTBOX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOutbox(items: OutboxItem[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(items.slice(0, 50)));
}

export function enqueuePendingBooking(payload: Record<string, unknown>) {
  const current = readOutbox();
  current.push({
    id: String(payload.idempotency_key || crypto.randomUUID()),
    payload,
    createdAt: new Date().toISOString()
  });
  writeOutbox(current);
}

export function getPendingBookingsCount() {
  return readOutbox().length;
}

export async function flushPendingBookings() {
  const current = readOutbox();
  if (!current.length) return { flushed: 0, failed: 0 };

  const keep: OutboxItem[] = [];
  let flushed = 0;
  for (const item of current) {
    try {
      const response = await fetch('/api/appointments/create', withCsrfHeaders({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload)
      }));
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) {
        keep.push(item);
        continue;
      }
      flushed += 1;
    } catch {
      keep.push(item);
    }
  }

  writeOutbox(keep);
  return { flushed, failed: keep.length };
}

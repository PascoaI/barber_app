'use client';

const KEY = 'barberpro_booking_wizard_v1';

export type BookingDraft = {
  barbershopName?: string;
  barberId?: string;
  barberName?: string;
  serviceId?: string;
  serviceName?: string;
  serviceDurationMinutes?: number;
  servicePrice?: number;
};

function safeParse(input: string) {
  try {
    return JSON.parse(input);
  } catch {
    return {};
  }
}

export function getBookingDraft(): BookingDraft {
  if (typeof window === 'undefined') return {};
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return {};
  return safeParse(raw) as BookingDraft;
}

export function saveBookingDraft(patch: Partial<BookingDraft>) {
  if (typeof window === 'undefined') return;
  const current = getBookingDraft();
  const next = { ...current, ...patch };
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearBookingDraft() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
}

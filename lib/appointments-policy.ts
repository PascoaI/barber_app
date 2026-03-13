export type AppointmentStatus = 'awaiting_payment' | 'pending' | 'confirmed' | 'in_progress' | 'canceled' | 'completed' | 'no_show';

const TRANSITIONS: Record<string, AppointmentStatus[]> = {
  awaiting_payment: ['pending', 'confirmed', 'in_progress', 'canceled', 'no_show'],
  pending: ['confirmed', 'in_progress', 'canceled', 'completed', 'no_show'],
  confirmed: ['in_progress', 'completed', 'canceled', 'no_show'],
  in_progress: ['completed', 'canceled'],
  canceled: [],
  completed: [],
  no_show: []
};

export function canTransitionStatus(from: string, to: string) {
  if (from === to) return true;
  return (TRANSITIONS[from] || []).includes(to as AppointmentStatus);
}

export function deriveOverdueStatus(input: { currentStatus: string; startDatetime: string; wasPaid: boolean; now?: Date }) {
  const now = input.now || new Date();
  if (!['pending', 'confirmed'].includes(input.currentStatus)) return input.currentStatus;
  if (new Date(input.startDatetime) > now) return input.currentStatus;
  if (input.currentStatus === 'confirmed') return input.wasPaid ? 'completed' : 'no_show';
  return 'no_show';
}

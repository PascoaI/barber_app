'use client';

import { withCsrfHeaders } from '@/lib/security/csrf-client';

export type StatusChangeRequestRow = {
  id: string;
  appointment_id: string;
  barber_name?: string | null;
  barber_email?: string | null;
  client_name?: string | null;
  client_email?: string | null;
  current_status: string;
  requested_status: string;
  reason?: string | null;
  requested_at: string;
  requested_by_user_id?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  status: 'pending' | 'approved' | 'rejected';
};

async function parseApiResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || data?.reason || 'status_change_requests_failed');
  }
  return data;
}

export async function createStatusChangeRequest(input: {
  appointmentId: string;
  requestedStatus: 'confirmed' | 'no_show' | 'canceled';
  reason: string;
}) {
  const response = await fetch('/api/status-change-requests', withCsrfHeaders({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appointment_id: input.appointmentId,
      requested_status: input.requestedStatus,
      reason: input.reason
    })
  }));
  const data = await parseApiResponse(response);
  return data.request as StatusChangeRequestRow;
}

export async function listStatusChangeRequests(filterStatus?: 'pending' | 'approved' | 'rejected') {
  const query = filterStatus ? `?status=${encodeURIComponent(filterStatus)}` : '';
  const response = await fetch(`/api/status-change-requests${query}`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });
  const data = await parseApiResponse(response);
  return (data.requests || []) as StatusChangeRequestRow[];
}

export async function reviewStatusChangeRequest(input: {
  requestId: string;
  action: 'approved' | 'rejected';
  reviewNote?: string;
}) {
  const response = await fetch(`/api/status-change-requests/${encodeURIComponent(input.requestId)}`, withCsrfHeaders({
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: input.action,
      review_note: input.reviewNote || undefined
    })
  }));
  const data = await parseApiResponse(response);
  return data.request as StatusChangeRequestRow;
}

export function getStatusRequestLabel(status: string) {
  const key = String(status || '').toLowerCase();
  if (key === 'confirmed') return 'Confirmado';
  if (key === 'no_show') return 'Não compareceu';
  if (key === 'canceled' || key === 'cancelled') return 'Cancelado';
  if (key === 'pending') return 'Pendente';
  if (key === 'approved') return 'Aprovado';
  if (key === 'rejected') return 'Rejeitado';
  if (key === 'in_progress') return 'Em andamento';
  if (key === 'completed') return 'Concluído';
  return String(status || '-');
}

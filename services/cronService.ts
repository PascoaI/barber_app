import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { deriveOverdueStatus } from '@/lib/appointments-policy';

type AppointmentRow = {
  id: string;
  client_id?: string | null;
  status: string;
  tenant_id?: string | null;
  barbershop_id?: string | null;
  appointment_date?: string | null;
  start_datetime?: string | null;
};

type TenantScope = {
  field: 'tenant_id' | 'barbershop_id';
  value: string;
};

type UserBlockRow = {
  id: string;
  blocked_until?: string | null;
};

export type CheckAppointmentsResult = {
  checked: number;
  updated: number;
  completed: number;
  noShows: number;
  blockedClients: number;
  skipped: number;
};

function getAppointmentStart(row: AppointmentRow) {
  return String(row.appointment_date || row.start_datetime || '');
}

function getTenantScope(row: AppointmentRow) {
  if (row.tenant_id) {
    return { field: 'tenant_id', value: String(row.tenant_id) } satisfies TenantScope;
  }
  if (row.barbershop_id) {
    return { field: 'barbershop_id', value: String(row.barbershop_id) } satisfies TenantScope;
  }
  return null;
}

function isTransitionAllowed(from: string, to: string) {
  const transitions: Record<string, string[]> = {
    awaiting_payment: ['pending', 'confirmed', 'canceled'],
    pending: ['confirmed', 'canceled', 'completed', 'no_show'],
    confirmed: ['completed', 'canceled', 'no_show'],
    canceled: [],
    completed: [],
    no_show: []
  };

  if (from === to) return true;
  return (transitions[from] || []).includes(to);
}

async function blockRecurringNoShows(input: {
  scope: TenantScope;
  clientIds: string[];
  nowIso: string;
}) {
  if (!input.clientIds.length) return 0;

  const supabase = createSupabaseServiceClient();
  const uniqueClientIds = Array.from(new Set(input.clientIds.filter(Boolean)));
  let blockedClients = 0;

  for (const clientId of uniqueClientIds) {
    const { count, error: countError } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'no_show')
      .eq('client_id', clientId)
      .eq(input.scope.field, input.scope.value);
    if (countError) throw countError;
    if ((count || 0) < 3) continue;

    const blockedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('id,blocked_until')
      .eq('id', clientId)
      .eq(input.scope.field, input.scope.value)
      .maybeSingle<UserBlockRow>();
    if (userError) throw userError;
    if (!userRow?.id) continue;

    const { error: updateError } = await supabase
      .from('users')
      .update({ blocked_until: blockedUntil, updated_at: input.nowIso })
      .eq('id', clientId)
      .eq(input.scope.field, input.scope.value);
    if (updateError) throw updateError;
    blockedClients += 1;
  }

  return blockedClients;
}

export async function checkAppointments(): Promise<CheckAppointmentsResult> {
  const supabase = createSupabaseServiceClient();
  const nowIso = new Date().toISOString();

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('id,client_id,status,tenant_id,barbershop_id,appointment_date,start_datetime')
    .in('status', ['pending', 'confirmed']);

  if (error) throw error;

  const result: CheckAppointmentsResult = {
    checked: appointments?.length || 0,
    updated: 0,
    completed: 0,
    noShows: 0,
    blockedClients: 0,
    skipped: 0
  };

  const noShowCandidatesByTenant = new Map<string, { scope: TenantScope; clientIds: string[] }>();

  for (const row of (appointments || []) as AppointmentRow[]) {
    const startDatetime = getAppointmentStart(row);
    const tenantScope = getTenantScope(row);

    if (!startDatetime || !tenantScope) {
      result.skipped += 1;
      continue;
    }

    const nextStatus = deriveOverdueStatus({
      currentStatus: row.status,
      startDatetime,
      wasPaid: row.status === 'confirmed'
    });

    if (nextStatus === row.status || !isTransitionAllowed(row.status, nextStatus)) {
      result.skipped += 1;
      continue;
    }

    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: nextStatus, updated_at: nowIso, updated_by: 'cron_http_trigger' })
      .eq('id', row.id)
      .eq(tenantScope.field, tenantScope.value);
    if (updateError) throw updateError;

    result.updated += 1;
    if (nextStatus === 'completed') result.completed += 1;
    if (nextStatus === 'no_show') {
      result.noShows += 1;
      const current = noShowCandidatesByTenant.get(tenantScope.value) || {
        scope: tenantScope,
        clientIds: []
      };
      current.clientIds.push(String(row.client_id || ''));
      noShowCandidatesByTenant.set(tenantScope.value, current);
    }
  }

  for (const [, tenantData] of noShowCandidatesByTenant.entries()) {
    result.blockedClients += await blockRecurringNoShows({
      scope: tenantData.scope,
      clientIds: tenantData.clientIds,
      nowIso
    });
  }

  return result;
}

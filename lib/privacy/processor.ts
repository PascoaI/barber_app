import { createSupabaseServiceClient } from '@/lib/supabase/server';

function maskEmail(seed: string) {
  const suffix = String(seed || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || Date.now().toString(36);
  return `anon-${suffix}@redacted.local`;
}

function extractClientIds(clients: Array<{ id: string }>) {
  return clients.map((c) => String(c.id)).filter(Boolean);
}

export async function buildPrivacyExport(params: {
  userId: string;
  barbershopId: string | null;
}) {
  const service = createSupabaseServiceClient();
  const { userId, barbershopId } = params;

  const { data: userRow } = await service
    .from('users')
    .select('id,barbershop_id,name,email,role,created_at')
    .eq('id', userId)
    .maybeSingle();

  const profileBarbershopId = String(barbershopId || userRow?.barbershop_id || '');
  const profileEmail = String(userRow?.email || '');

  const { data: clients } = await service
    .from('clients')
    .select('id,barbershop_id,name,email,phone,birthday,created_at')
    .eq('barbershop_id', profileBarbershopId)
    .eq('email', profileEmail);

  const clientIds = extractClientIds((clients || []) as Array<{ id: string }>);
  const appointments = clientIds.length
    ? (await service
      .from('appointments')
      .select('id,barbershop_id,client_id,barber_id,service_id,appointment_date,status,notes,created_at')
      .eq('barbershop_id', profileBarbershopId)
      .in('client_id', clientIds)).data
    : [];

  const notifications = clientIds.length
    ? (await service
      .from('notifications')
      .select('id,barbershop_id,client_id,type,message,sent_at')
      .eq('barbershop_id', profileBarbershopId)
      .in('client_id', clientIds)).data
    : [];

  return {
    generated_at: new Date().toISOString(),
    user: userRow || null,
    clients: clients || [],
    appointments: appointments || [],
    notifications: notifications || []
  };
}

export async function executePrivacyRequest(params: {
  requestId: string;
  userId: string;
  barbershopId: string | null;
  requestType: 'anonymize' | 'delete';
  actorUserId?: string | null;
}) {
  const service = createSupabaseServiceClient();
  const nowIso = new Date().toISOString();
  const exportPayload = await buildPrivacyExport({
    userId: params.userId,
    barbershopId: params.barbershopId
  });

  const { data: exportRow, error: exportError } = await service
    .from('privacy_exports')
    .insert({
      request_id: params.requestId,
      user_id: params.userId,
      barbershop_id: params.barbershopId,
      payload: exportPayload
    })
    .select('id')
    .single();
  if (exportError) throw exportError;

  const profileEmail = String((exportPayload.user as any)?.email || '');
  const clientIds = extractClientIds((exportPayload.clients || []) as Array<{ id: string }>);
  const anonymizedEmail = maskEmail(params.userId);

  if (params.requestType === 'delete') {
    if (clientIds.length) {
      await service.from('notifications').delete().in('client_id', clientIds);
      await service.from('appointments').delete().in('client_id', clientIds);
      await service.from('clients').delete().in('id', clientIds);
    }

    await service
      .from('users')
      .update({
        name: 'Cliente Excluido',
        email: anonymizedEmail,
        blocked_until: null,
        updated_at: nowIso
      })
      .eq('id', params.userId);
  } else {
    await service
      .from('users')
      .update({
        name: 'Cliente Anonimizado',
        email: anonymizedEmail,
        blocked_until: null,
        updated_at: nowIso
      })
      .eq('id', params.userId);

    if (clientIds.length) {
      await service
        .from('clients')
        .update({
          name: 'Cliente Anonimizado',
          email: null,
          phone: null
        })
        .in('id', clientIds);
    } else if (profileEmail && params.barbershopId) {
      await service
        .from('clients')
        .update({
          name: 'Cliente Anonimizado',
          email: null,
          phone: null
        })
        .eq('barbershop_id', params.barbershopId)
        .eq('email', profileEmail);
    }
  }

  await service
    .from('client_privacy_requests')
    .update({
      status: 'done',
      processed_at: nowIso,
      result: {
        export_id: exportRow.id,
        mode: params.requestType
      },
      updated_at: nowIso
    })
    .eq('id', params.requestId);

  await service.from('audit_logs').insert({
    user_id: params.actorUserId || params.userId,
    barbershop_id: params.barbershopId,
    action: params.requestType === 'delete' ? 'privacy_delete_processed' : 'privacy_anonymize_processed',
    entity: 'client_privacy_requests',
    entity_id: params.requestId,
    metadata: {
      export_id: exportRow.id,
      target_user_id: params.userId,
      mode: params.requestType
    }
  });

  return {
    exportId: exportRow.id,
    mode: params.requestType
  };
}

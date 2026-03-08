import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { executePrivacyRequest } from '@/lib/privacy/processor';
import { logger } from '@/lib/observability/logger';

function isAuthorized(req: Request) {
  const expected = process.env.CRON_SECRET || '';
  if (!expected) return false;
  const incoming = req.headers.get('x-cron-secret') || '';
  return incoming === expected;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized cron call.' }, { status: 401 });
  }

  const service = createSupabaseServiceClient();
  const { data: rows, error } = await service
    .from('client_privacy_requests')
    .select('id,user_id,barbershop_id,request_type,status')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let done = 0;
  let rejected = 0;

  for (const row of rows || []) {
    try {
      await executePrivacyRequest({
        requestId: String(row.id),
        userId: String(row.user_id),
        barbershopId: row.barbershop_id ? String(row.barbershop_id) : null,
        requestType: String(row.request_type) === 'delete' ? 'delete' : 'anonymize',
        actorUserId: null
      });
      done += 1;
    } catch (errorRow: any) {
      rejected += 1;
      const nowIso = new Date().toISOString();
      await service
        .from('client_privacy_requests')
        .update({
          status: 'rejected',
          processed_at: nowIso,
          result: {
            reason: errorRow?.message || 'privacy_request_processing_failed'
          },
          updated_at: nowIso
        })
        .eq('id', row.id);
      logger.error('Privacy request processing failed.', {
        requestId: row.id,
        error: errorRow?.message || 'privacy_request_processing_failed'
      });
    }
  }

  return NextResponse.json({
    ok: true,
    checked: (rows || []).length,
    done,
    rejected
  });
}

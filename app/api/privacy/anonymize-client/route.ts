import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getRouteAppSession } from '@/lib/auth/route-session';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';

function maskEmail(id: string) {
  const suffix = String(id || '').slice(0, 8) || Date.now().toString().slice(-8);
  return `anon-${suffix}@redacted.local`;
}

export async function POST(req: Request) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, message: sameOrigin.message }, { status: 403 });

    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ ok: false, message: csrf.message }, { status: 403 });

    const session = await getRouteAppSession();
    if (!session || !['admin', 'super_admin'].includes(session.role)) {
      return NextResponse.json({ ok: false, message: 'Nao autorizado.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const clientId = String(body?.clientId || '').trim();
    if (!clientId) return NextResponse.json({ ok: false, message: 'clientId e obrigatorio.' }, { status: 400 });

    const supabase = createSupabaseServerClient();
    const maskedEmail = maskEmail(clientId);
    const nowIso = new Date().toISOString();
    const profileScope = session.role === 'super_admin' ? {} : { barbershop_id: session.barbershopId };

    await supabase
      .from('users')
      .update({
        name: 'Cliente Anonimizado',
        email: maskedEmail,
        blocked_until: null,
        updated_at: nowIso
      })
      .match({
        id: clientId,
        ...profileScope
      });

    await supabase
      .from('clients')
      .update({
        name: 'Cliente Anonimizado',
        email: null,
        phone: null
      })
      .match({
        id: clientId,
        ...(session.role === 'super_admin' ? {} : { barbershop_id: session.barbershopId })
      });

    await supabase.from('audit_logs').insert({
      user_id: session.userId,
      barbershop_id: session.barbershopId,
      action: 'anonymize_client',
      entity: 'users',
      entity_id: clientId,
      metadata: {
        masked_email: maskedEmail
      }
    });

    return NextResponse.json({ ok: true, maskedEmail });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'anonymize_failed' }, { status: 500 });
  }
}

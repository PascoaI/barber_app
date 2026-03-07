import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';

export async function POST(req: Request) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, message: sameOrigin.message }, { status: 403 });

    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ ok: false, message: csrf.message }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const requestType = String(body?.requestType || 'anonymize');
    if (!['anonymize', 'delete'].includes(requestType)) {
      return NextResponse.json({ ok: false, message: 'requestType invalido.' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return NextResponse.json({ ok: false, message: 'Nao autenticado.' }, { status: 401 });

    const { data: profile } = await supabase
      .from('users')
      .select('barbershop_id')
      .eq('id', authData.user.id)
      .maybeSingle();

    await supabase.from('client_privacy_requests').insert({
      user_id: authData.user.id,
      barbershop_id: profile?.barbershop_id || null,
      request_type: requestType,
      status: 'pending'
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'privacy_request_failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';

export async function POST(req: Request) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, message: sameOrigin.message }, { status: 403 });

    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ ok: false, message: csrf.message }, { status: 403 });

    const payload = await req.json().catch(() => ({}));
    const path = String(payload?.path || '').slice(0, 255);
    if (!path) return NextResponse.json({ ok: false, message: 'path is required' }, { status: 400 });

    const supabase = createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return NextResponse.json({ ok: false, message: 'Nao autenticado.' }, { status: 401 });

    const { data: profile } = await supabase
      .from('users')
      .select('barbershop_id,role')
      .eq('id', authData.user.id)
      .maybeSingle();

    await supabase.from('audit_logs').insert({
      user_id: authData.user.id,
      barbershop_id: profile?.barbershop_id || null,
      action: 'access',
      entity: 'route',
      entity_id: path,
      metadata: {
        role: profile?.role || null,
        pathname: path
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'audit_access_failed' }, { status: 500 });
  }
}

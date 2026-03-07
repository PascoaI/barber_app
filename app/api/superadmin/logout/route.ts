import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { validateCsrfFromRequest, validateSameOrigin } from '@/lib/security/csrf';

export async function POST(req: Request) {
  try {
    const sameOrigin = validateSameOrigin(req);
    if (!sameOrigin.ok) return NextResponse.json({ ok: false, message: sameOrigin.message }, { status: 403 });

    const csrf = validateCsrfFromRequest(req);
    if (!csrf.ok) return NextResponse.json({ ok: false, message: csrf.message }, { status: 403 });

    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'superadmin_logout_failed' }, { status: 500 });
  }
}

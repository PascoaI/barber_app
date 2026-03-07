import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ ok: false, message: 'Informe email e senha.' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: String(email).trim(),
      password: String(password)
    });

    if (signInError || !signInData.user) {
      return NextResponse.json({ ok: false, message: 'Credenciais invalidas.' }, { status: 401 });
    }

    const { data: superAdmin, error: superAdminError } = await supabase
      .from('super_admins')
      .select('id')
      .eq('id', signInData.user.id)
      .maybeSingle();

    if (superAdminError) throw superAdminError;
    if (!superAdmin?.id) {
      await supabase.auth.signOut();
      return NextResponse.json({ ok: false, message: 'Acesso exclusivo do administrador da plataforma.' }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'superadmin_login_failed' }, { status: 500 });
  }
}

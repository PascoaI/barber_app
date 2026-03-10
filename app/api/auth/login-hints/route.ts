import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const service = createSupabaseServiceClient();
    const { data, error } = await service
      .from('users')
      .select('email,role')
      .in('role', ['admin', 'barber', 'client'])
      .order('role', { ascending: true })
      .order('email', { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, message: error.message || 'login_hints_failed' }, { status: 500 });
    }

    const seen = new Set<string>();
    const hints = (data || [])
      .filter((row) => {
        const email = String(row.email || '').trim().toLowerCase();
        if (!email || seen.has(email)) return false;
        seen.add(email);
        return true;
      })
      .map((row) => ({
        email: String(row.email || '').trim().toLowerCase(),
        role: String(row.role || '').toLowerCase()
      }));

    return NextResponse.json({ ok: true, hints });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || 'login_hints_failed' }, { status: 500 });
  }
}

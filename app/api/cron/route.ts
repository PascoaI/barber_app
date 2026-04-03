import { NextResponse } from 'next/server';
import { checkAppointments } from '@/services/cronService';

function isAuthorized(req: Request) {
  const secret = String(process.env.CRON_SECRET || '').trim();
  const header = String(req.headers.get('authorization') || '').trim();
  if (!secret || !header) return false;

  const bearerValue = `Bearer ${secret}`;
  return header === secret || header === bearerValue;
}

export async function GET(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const result = await checkAppointments();
    return NextResponse.json({
      success: true,
      result
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'cron_failed'
      },
      { status: 500 }
    );
  }
}

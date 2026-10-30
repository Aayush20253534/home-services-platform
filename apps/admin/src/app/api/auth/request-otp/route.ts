import { NextResponse } from 'next/server';
import { postAuth } from '../../../../lib/auth';

export async function POST(request: Request) {
  const { phone } = await request.json().catch(() => ({ phone: null })) as { phone: unknown };
  const result = await postAuth('request-otp', { phone, role: 'ADMIN' });
  return NextResponse.json(result.data, { status: result.status, headers: { 'Cache-Control': 'no-store' } });
}

import { NextResponse } from 'next/server';
import { applySessionCookies, postAuth } from '../../../../lib/auth';

export async function POST(request: Request) {
  const { phone, challengeId, code } = await request.json().catch(() => ({ phone: null, challengeId: null, code: null })) as Record<string, unknown>;
  const result = await postAuth('verify-otp', { phone, challengeId, code, role: 'ADMIN' });
  if (!result.ok) return NextResponse.json(result.data, { status: result.status });
  const user = result.data.user as { role?: string } | undefined;
  if (user?.role !== 'ADMIN') return NextResponse.json({ message: 'Access denied' }, { status: 403 });
  const response = NextResponse.json({ success: true, role: 'ADMIN' }, { headers: { 'Cache-Control': 'no-store' } });
  applySessionCookies(response, result.data);
  return response;
}

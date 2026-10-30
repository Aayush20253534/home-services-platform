import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, clearSessionCookies, postAuth } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (token) await postAuth('logout', {}, token);
  const response = NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  clearSessionCookies(response);
  return response;
}

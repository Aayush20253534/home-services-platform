import { NextRequest, NextResponse } from 'next/server';
import { applySessionCookies, clearSessionCookies, REFRESH_COOKIE, postAuth } from '../../../../lib/auth';

export async function GET(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    const result = await postAuth('refresh', { refreshToken });
    if (result.ok && (result.data.user as { role?: string } | undefined)?.role === 'ADMIN') {
      const response = NextResponse.redirect(new URL('/', request.url));
      applySessionCookies(response, result.data);
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }
  }
  const response = NextResponse.redirect(new URL('/login', request.url));
  clearSessionCookies(response);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

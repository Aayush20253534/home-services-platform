import type { NextResponse } from 'next/server';

export const ACCESS_COOKIE = 'hs_admin_access';
export const REFRESH_COOKIE = 'hs_admin_refresh';
export const AUTH_API_BASE = (process.env.AUTH_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

export type ApiResult = { status: number; ok: boolean; data: Record<string, unknown> };
export async function postAuth(endpoint: string, data: unknown, accessToken?: string): Promise<ApiResult> {
  try {
    const response = await fetch(`${AUTH_API_BASE}/auth/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(data),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    const parsed: unknown = await response.json().catch(() => ({}));
    return { status: response.status, ok: response.ok, data: (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown> };
  } catch {
    return { status: 503, ok: false, data: { message: 'Authentication server unavailable' } };
  }
}

export function applySessionCookies(response: NextResponse, data: Record<string, unknown>) {
  if (typeof data.accessToken !== 'string' || typeof data.refreshToken !== 'string') {
    throw new Error('Authentication server response incomplete');
  }
  const common = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/' };
  response.cookies.set(ACCESS_COOKIE, data.accessToken, { ...common, maxAge: 15 * 60 });
  response.cookies.set(REFRESH_COOKIE, data.refreshToken, { ...common, maxAge: 30 * 24 * 60 * 60 });
}
export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, '', { path: '/', maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, '', { path: '/', maxAge: 0 });
}

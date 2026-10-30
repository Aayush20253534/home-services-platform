import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE, AUTH_API_BASE } from '../../../../lib/auth';

/**
 * Server-only same-origin admin proxy. Browser never receives an access token.
 * It deliberately cannot proxy arbitrary API paths or HTTP methods.
 */
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ segments: string[] }> },
  method: 'GET' | 'POST' | 'PATCH',
) {
  const { segments } = await context.params;
  if (!segments || segments.length < 1 || segments.length > 2 ||
    !['categories', 'services'].includes(segments[0]) ||
    (segments.length === 2 && !/^[a-f0-9-]{36}$/i.test(segments[1]))) {
    return NextResponse.json({ message: 'Unknown catalog endpoint' }, { status: 404 });
  }
  if (method === 'GET' && segments.length !== 1) {
    return NextResponse.json({ message: 'Unknown catalog endpoint' }, { status: 404 });
  }
  if (method === 'POST' && segments.length !== 1) {
    return NextResponse.json({ message: 'Unknown catalog endpoint' }, { status: 404 });
  }
  if (method === 'PATCH' && segments.length !== 2) {
    return NextResponse.json({ message: 'Unknown catalog endpoint' }, { status: 404 });
  }

  // Session-cookie writes must originate from our own web origin.
  if (method !== 'GET') {
    const origin = request.headers.get('origin');
    if (origin !== request.nextUrl.origin || request.headers.get('sec-fetch-site') === 'cross-site') {
      return NextResponse.json({ message: 'Invalid request origin' }, { status: 403 });
    }
  }
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: 'Admin authentication required' }, { status: 401 });
  const query = method === 'GET' ? request.nextUrl.search : '';
  let body: string | undefined;
  if (method !== 'GET') {
    if (!(request.headers.get('content-type') ?? '').startsWith('application/json')) {
      return NextResponse.json({ message: 'Content-Type must be application/json' }, { status: 415 });
    }
    body = await request.text();
    if (body.length > 10000) return NextResponse.json({ message: 'Request body too large' }, { status: 413 });
  }

  try {
    const response = await fetch(`${AUTH_API_BASE}/admin/catalog/${segments.join('/')}${query}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    const data: unknown = await response.json().catch(() => ({ message: 'Unexpected API response' }));
    return NextResponse.json(data, {
      status: response.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ message: 'Catalog API unavailable' }, { status: 503 });
  }
}

type RouteContext = { params: Promise<{ segments: string[] }> };
export const GET = (req: NextRequest, context: RouteContext) => proxy(req, context, 'GET');
export const POST = (req: NextRequest, context: RouteContext) => proxy(req, context, 'POST');
export const PATCH = (req: NextRequest, context: RouteContext) => proxy(req, context, 'PATCH');

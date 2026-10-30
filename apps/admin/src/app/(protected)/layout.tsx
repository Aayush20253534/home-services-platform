import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { AUTH_API_BASE, ACCESS_COOKIE } from '../../lib/auth';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) redirect('/api/auth/renew');
  let authorized = false;
  try {
    const response = await fetch(`${AUTH_API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const data: { role?: string } = await response.json().catch(() => ({}));
    authorized = response.ok && data.role === 'ADMIN';
  } catch {
    authorized = false;
  }
  if (!authorized) redirect('/api/auth/renew');
  return <AdminShell>{children}</AdminShell>;
}

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminShell } from '../components/admin-shell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Home Services · Operations',
  description: 'Design preview for the Home Services operations workspace.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight, Bell, CalendarCheck, ChevronDown, ClipboardList, Grid2X2,
  LayoutDashboard, LifeBuoy, Menu, Settings2, ShieldCheck, Users, Wrench, X,
  type LucideIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

const navigation: { href: string; name: string; icon: LucideIcon }[] = [
  { href: '/', name: 'Overview', icon: LayoutDashboard },
  { href: '/bookings', name: 'Bookings', icon: CalendarCheck },
  { href: '/providers', name: 'Providers', icon: Wrench },
  { href: '/customers', name: 'Customers', icon: Users },
  { href: '/services', name: 'Services', icon: Grid2X2 },
  { href: '/settings', name: 'Settings', icon: Settings2 },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const page = navigation.find((item) => item.href === path)?.name ?? 'Overview';

  return (
    <div className="app-frame">
      {open && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Wrench size={22} strokeWidth={2.5} /></div>
          <div className="brand-copy"><strong>HOMESERVE</strong><span>Operations suite</span></div>
          <button className="icon-button sidebar-close" aria-label="Close menu" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>
        <div className="workspace-switch"><span className="workspace-icon"><ShieldCheck size={18} /></span><span><b>Admin workspace</b><small>Design preview</small></span><ChevronDown size={15} /></div>
        <p className="nav-caption">WORKSPACE</p>
        <nav className="side-navigation" aria-label="Main navigation">
          {navigation.map(({ href, name, icon: Icon }) => (
            <Link className={`side-link ${path === href ? 'side-link-active' : ''}`} aria-current={path === href ? 'page' : undefined} href={href} onClick={() => setOpen(false)} key={href}>
              <Icon size={19} strokeWidth={1.9} /> <span>{name}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-panel"><LifeBuoy size={19} /><b>Need help?</b><p>Support workflows are included in later phases.</p></div>
          <div className="sidebar-user"><span className="user-avatar">AD</span><span><b>Admin preview</b><small>Guest demo · Phase 02</small></span><ArrowUpRight size={16} /></div>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button menu-button" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu size={22} /></button>
            <span className="breadcrumb-root">Workspace</span><span className="breadcrumb-separator">/</span><strong>{page}</strong>
          </div>
          <div className="topbar-right">
            <span className="environment-chip"><span className="environment-dot" />UI Demo</span>
            <span className="topbar-divider" />
            <span className="notification-preview" aria-label="Notifications not yet enabled" title="Notifications arrive in Phase 16"><Bell size={19} /></span>
            <span className="user-avatar top-avatar">AD</span>
          </div>
        </header>
        <main className="main-content">{children}</main>
        <footer className="workspace-footer">Phase 02 · Screens use illustrative data only. No live actions, bookings or customer information.</footer>
      </div>
    </div>
  );
}

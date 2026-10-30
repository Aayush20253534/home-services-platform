import type { ReactNode } from 'react';
import { ArrowDownLeft, ArrowUpRight, type LucideIcon, Search } from 'lucide-react';

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="page-heading">
      <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone = /completed|verified|active/i.test(status) ? 'green' : /pending|new/i.test(status) ? 'orange' : /progress|assigned/i.test(status) ? 'blue' : 'neutral';
  return <span className={`status-pill status-${tone}`}><span className="status-dot" />{status}</span>;
}

export function Metric({ icon: Icon, label, value, trend, tint = 'blue' }: { icon: LucideIcon; label: string; value: string; trend: string; tint?: 'blue' | 'teal' | 'orange' | 'purple' }) {
  return (
    <article className="metric-card">
      <div className="metric-top"><span className={`metric-icon metric-${tint}`}><Icon size={20} /></span><ArrowUpRight size={17} color="#91A0B4" /></div>
      <p>{label}</p><h2>{value}</h2><span className="metric-context">{trend}</span>
    </article>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="search-box"><Search size={17} aria-hidden="true" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} /></label>;
}

export function Person({ initials, name, sub }: { initials: string; name: string; sub?: string }) {
  const shades = ['avatar-blue', 'avatar-teal', 'avatar-purple', 'avatar-orange'];
  return <div className="person-cell"><span className={`person-avatar ${shades[initials.charCodeAt(0) % shades.length]}`}>{initials}</span><span><strong>{name}</strong>{sub && <small>{sub}</small>}</span></div>;
}

export function EmptyRows({ label = 'No matching records' }: { label?: string }) {
  return <div className="empty-results">{label}. Try adjusting your search or filter.</div>;
}

export function DemoWarning() {
  return <div className="demo-alert"><ArrowDownLeft size={17} /><span>Demo-only records and totals. This interface is not connected to the booking API.</span></div>;
}

export function DetailDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section className="detail-dialog" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-head"><h2>{title}</h2><button className="secondary-button" onClick={onClose}>Close</button></div>
        {children}
      </section>
    </div>
  );
}

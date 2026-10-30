import { Bell, Database, LockKeyhole, MapPin, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { DemoWarning, PageHeading } from '../../components/ui';

const planned = [
  { icon: ShieldCheck, name: 'Role permissions', description: 'Admin, customer and provider permissions, login sessions and restricted data access. Phase 04.' },
  { icon: MapPin, name: 'Serviceable zones', description: 'Operational cities, areas and service radius settings. Phases 07 and 10.' },
  { icon: SlidersHorizontal, name: 'Dispatch rules', description: 'Provider capability matching, acceptance deadlines and administrator overrides. Phases 13–14.' },
  { icon: Bell, name: 'Notification channels', description: 'Push, email and real-time assignment notifications. Phase 16.' },
  { icon: LockKeyhole, name: 'Security policies', description: 'Audit logs, session management and platform hardening. Phase 21.' },
  { icon: Database, name: 'Database readiness', description: 'PostgreSQL schemas, relational data and migrations. Phase 03.' },
];

export default function Settings() {
  return (
    <>
      <PageHeading eyebrow="Workspace configuration" title="Settings" description="Planned operational settings, with implementation milestones clearly identified." />
      <DemoWarning />
      <div className="settings-grid">{planned.map(({ icon: Icon, name, description }) => <section className="panel setting-row" key={name}><Icon size={24} /><div><h3>{name}</h3><p>{description}</p></div></section>)}</div>
    </>
  );
}

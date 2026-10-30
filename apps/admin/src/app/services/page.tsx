'use client';

import { useMemo, useState } from 'react';
import { Droplets, Paintbrush, Plus, Snowflake, Sparkles, Wrench, Zap, type LucideIcon } from 'lucide-react';
import { services } from '../../components/mock-data';
import { DemoWarning, DetailDialog, PageHeading } from '../../components/ui';

const icons: Record<string, LucideIcon> = { sparkles: Sparkles, zap: Zap, droplets: Droplets, snowflake: Snowflake, wrench: Wrench, paintbrush: Paintbrush };
const categories = ['All', ...new Set(services.map((service) => service.category))];
type PreviewService = { name: string; category: string; price: string; duration: string; icon: string };

export default function Services() {
  const [category, setCategory] = useState('All');
  const [modal, setModal] = useState(false);
  const [draft, setDraft] = useState<PreviewService>({ name: '', category: 'Cleaning', price: '', duration: '', icon: 'sparkles' });
  const [newServices, setNewServices] = useState<PreviewService[]>([]);
  const visible = useMemo(() => [...services, ...newServices].filter((service) => category === 'All' || service.category === category), [category, newServices]);
  function createPreview() {
    if (!draft.name.trim() || !draft.price.trim() || !draft.duration.trim()) return;
    setNewServices((current) => [...current, { ...draft, name: draft.name.trim() }]);
    setModal(false);
    setCategory('All');
    setDraft({ name: '', category: 'Cleaning', price: '', duration: '', icon: 'sparkles' });
  }
  return (
    <>
      <PageHeading eyebrow="Marketplace catalog" title="Services & categories" description="Browse and preview the services customers can select." action={<button className="primary-button" onClick={() => setModal(true)}><Plus size={16} />Add demo service</button>} />
      <DemoWarning />
      <div className="toolbar"><div className="segmented" role="group" aria-label="Filter services by category">{categories.map((item) => <button key={item} className={category === item ? 'segment-active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div></div>
      <div className="service-grid">
        {visible.map((service,index) => {
          const Symbol = icons[service.icon] ?? Wrench;
          return <article className="panel service-card" key={`${service.name}-${index}`}><div className="service-art"><Symbol size={28} strokeWidth={1.9} /></div><h3>{service.name}</h3><p>{service.category} · {service.duration}</p><div className="service-footer"><b>{service.price}</b><span>{index < services.length ? 'Demo catalog' : 'Session-only draft'}</span></div></article>;
        })}
      </div>
      {modal && <DetailDialog title="Add a demo service" onClose={() => setModal(false)}><p className="page-description">This form updates only the current browser session. It does not write to a database.</p><form className="form-stack" onSubmit={(event) => { event.preventDefault(); createPreview(); }}>
        <label>Service name<input required placeholder="e.g. Ceiling fan installation" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
        <label>Category<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{categories.filter((item) => item !== 'All').map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Starting price<input required placeholder="e.g. ₹299" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} /></label>
        <label>Estimated duration<input required placeholder="e.g. 30–45 min" value={draft.duration} onChange={(event) => setDraft({ ...draft, duration: event.target.value })} /></label>
        <button className="primary-button" type="submit">Add to local preview</button>
      </form></DetailDialog>}
    </>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { ShieldCheck, Users, Wrench } from 'lucide-react';
import { providers, type Provider } from '../../../components/mock-data';
import { DemoWarning, DetailDialog, EmptyRows, PageHeading, Person, SearchBox, StatusPill } from '../../../components/ui';

const filters = ['All', 'Verified', 'Pending', 'Unavailable'] as const;

export default function Providers() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Provider | null>(null);
  const visible = useMemo(() => providers.filter((provider) =>
    (filter === 'All' || provider.status === filter) &&
    [provider.name, provider.skill, provider.location].some((value) => value.toLowerCase().includes(query.toLowerCase().trim())),
  ), [filter, query]);
  return (
    <>
      <PageHeading eyebrow="Your professional network" title="Service providers" description="Inspect skills, verification status, and service areas for demo professionals." />
      <DemoWarning />
      <div className="kpi-strip"><div className="panel"><Users size={22} /><span><b>{providers.length}</b><small>Sample professionals</small></span></div><div className="panel"><ShieldCheck size={22} /><span><b>{providers.filter((p) => p.status === 'Verified').length}</b><small>Example verified</small></span></div><div className="panel"><Wrench size={22} /><span><b>5</b><small>Service specializations</small></span></div></div>
      <div className="toolbar"><SearchBox value={query} onChange={setQuery} placeholder="Search provider, skill or area" /><div className="segmented" role="group" aria-label="Filter providers">{filters.map((item) => <button className={filter === item ? 'segment-active' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div></div>
      <section className="panel table-panel"><header className="panel-header"><div><h2>Provider directory</h2><p>{visible.length} matching sample records</p></div></header><div className="table-scroll"><table><thead><tr><th>Provider</th><th>Specialization</th><th>Area</th><th>Example jobs</th><th>Sample rating</th><th>Status</th><th></th></tr></thead><tbody>{visible.map((provider) => <tr key={provider.id}><td><Person initials={provider.initials} name={provider.name} sub={provider.id} /></td><td>{provider.skill}</td><td>{provider.location}</td><td>{provider.jobs}</td><td>{provider.rating}</td><td><StatusPill status={provider.status} /></td><td><button className="table-action" onClick={() => setSelected(provider)}>View profile</button></td></tr>)}</tbody></table></div>{visible.length === 0 && <EmptyRows />}</section>
      {selected && <DetailDialog title={selected.name} onClose={() => setSelected(null)}><div className="dialog-details">{[['Reference',selected.id],['Specialization',selected.skill],['Service area',selected.location],['Sample jobs',String(selected.jobs)],['Sample rating',selected.rating],['Status',selected.status]].map(([label,value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><DemoWarning /></DetailDialog>}
    </>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { bookings, type Booking } from '../../components/mock-data';
import { DemoWarning, DetailDialog, EmptyRows, PageHeading, Person, SearchBox, StatusPill } from '../../components/ui';

const filters = ['All', 'Pending', 'Assigned', 'In progress', 'Completed'] as const;

export default function Bookings() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);
  const visible = useMemo(() => bookings.filter((booking) =>
    (filter === 'All' || booking.status === filter) &&
    [booking.id, booking.customer, booking.service, booking.provider].some((value) => value.toLowerCase().includes(query.trim().toLowerCase())),
  ), [filter, query]);
  return (
    <>
      <PageHeading eyebrow="Service operations" title="Booking management" description="Find requests, review details, and monitor service statuses." action={<span className="environment-chip">UI preview · No live requests</span>} />
      <DemoWarning />
      <div className="kpi-strip">
        <div className="panel"><CalendarCheck size={22} /><span><b>{bookings.length}</b><small>Sample bookings</small></span></div>
        <div className="panel"><CalendarCheck size={22} /><span><b>{bookings.filter((b) => b.status === 'Pending').length}</b><small>Sample pending</small></span></div>
        <div className="panel"><CalendarCheck size={22} /><span><b>{bookings.filter((b) => b.status === 'Completed').length}</b><small>Sample completed</small></span></div>
      </div>
      <div className="toolbar"><SearchBox value={query} onChange={setQuery} placeholder="Search booking, service or customer" /><div className="segmented" role="group" aria-label="Filter booking status">{filters.map((item) => <button className={filter === item ? 'segment-active' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div></div>
      <section className="panel table-panel">
        <header className="panel-header"><div><h2>All requests</h2><p>{visible.length} matching sample records</p></div></header>
        <div className="table-scroll"><table><thead><tr><th>Booking</th><th>Customer</th><th>Service</th><th>Assigned provider</th><th>Schedule</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>{visible.map((booking) => <tr key={booking.id}><td className="table-id">{booking.id}</td><td><Person initials={booking.initials} name={booking.customer} /></td><td><strong>{booking.service}</strong></td><td>{booking.provider}</td><td>{booking.date}</td><td><strong>{booking.amount}</strong></td><td><StatusPill status={booking.status} /></td><td><button className="table-action" onClick={() => setSelected(booking)}>View details</button></td></tr>)}</tbody></table></div>
        {visible.length === 0 && <EmptyRows />}
      </section>
      {selected && <DetailDialog title={`Booking ${selected.id}`} onClose={() => setSelected(null)}><div className="dialog-details">{[['Customer',selected.customer],['Service',selected.service],['Provider',selected.provider],['Schedule',selected.date],['Amount',selected.amount],['Status',selected.status]].map(([label,value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><DemoWarning /></DetailDialog>}
    </>
  );
}

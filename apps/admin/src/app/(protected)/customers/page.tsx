'use client';

import { useMemo, useState } from 'react';
import { CalendarCheck, UserRoundCheck, Users } from 'lucide-react';
import { customers, type Customer } from '../../../components/mock-data';
import { DemoWarning, DetailDialog, EmptyRows, PageHeading, Person, SearchBox, StatusPill } from '../../../components/ui';

export default function Customers() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const visible = useMemo(() => customers.filter((customer) =>
    [customer.name, customer.id, customer.area].some((value) => value.toLowerCase().includes(query.toLowerCase().trim())),
  ), [query]);
  return (
    <>
      <PageHeading eyebrow="Customer relationships" title="Customer directory" description="A clear view of customer profiles and example service history." />
      <DemoWarning />
      <div className="kpi-strip"><div className="panel"><Users size={22} /><span><b>{customers.length}</b><small>Sample customers</small></span></div><div className="panel"><UserRoundCheck size={22} /><span><b>{customers.filter((c) => c.status === 'Active').length}</b><small>Sample active</small></span></div><div className="panel"><CalendarCheck size={22} /><span><b>{customers.reduce((total,c) => total + c.bookings,0)}</b><small>Sample total bookings</small></span></div></div>
      <div className="toolbar"><SearchBox value={query} onChange={setQuery} placeholder="Search name, ID or area" /></div>
      <section className="panel table-panel"><header className="panel-header"><div><h2>Customers</h2><p>{visible.length} matching sample records</p></div></header><div className="table-scroll"><table><thead><tr><th>Customer</th><th>Area</th><th>Sample bookings</th><th>Joined</th><th>Status</th><th></th></tr></thead><tbody>{visible.map((customer) => <tr key={customer.id}><td><Person initials={customer.initials} name={customer.name} sub={customer.id} /></td><td>{customer.area}</td><td>{customer.bookings}</td><td>{customer.joined}</td><td><StatusPill status={customer.status} /></td><td><button className="table-action" onClick={() => setSelected(customer)}>View profile</button></td></tr>)}</tbody></table></div>{visible.length === 0 && <EmptyRows />}</section>
      {selected && <DetailDialog title={selected.name} onClose={() => setSelected(null)}><div className="dialog-details">{[['Reference',selected.id],['Area',selected.area],['Sample bookings',String(selected.bookings)],['Joined',selected.joined],['Status',selected.status]].map(([label,value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><DemoWarning /></DetailDialog>}
    </>
  );
}

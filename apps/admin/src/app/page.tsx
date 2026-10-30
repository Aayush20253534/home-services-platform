import Link from 'next/link';
import { ArrowRight, CalendarCheck, CircleCheck, Clock3, IndianRupee, Users, Wrench } from 'lucide-react';
import { bookings } from '../components/mock-data';
import { DemoWarning, Metric, PageHeading, Person, StatusPill } from '../components/ui';

const weekly = [
  { day: 'Mon', value: 42 }, { day: 'Tue', value: 69 }, { day: 'Wed', value: 53 },
  { day: 'Thu', value: 85 }, { day: 'Fri', value: 73 }, { day: 'Sat', value: 96 }, { day: 'Sun', value: 61 },
];
const breakdown = [
  { label: 'Cleaning', value: 76, count: 42, color: '#415be9' },
  { label: 'Electrical', value: 59, count: 32, color: '#23b49a' },
  { label: 'Plumbing', value: 40, count: 24, color: '#e7a53a' },
  { label: 'AC Repair', value: 31, count: 18, color: '#9672dd' },
];

export default function Overview() {
  return (
    <>
      <PageHeading eyebrow="Operations at a glance" title="Dashboard overview" description="Your service marketplace control centre, designed for effortless daily operations." action={<span className="environment-chip">Preview dataset · October 2026</span>} />
      <DemoWarning />
      <section className="metrics-grid" aria-label="Sample summary">
        <Metric icon={CalendarCheck} label="Sample bookings" value="248" trend="Illustrative monthly volume" />
        <Metric icon={IndianRupee} label="Sample revenue" value="₹1.84L" trend="Illustrative gross service value" tint="teal" />
        <Metric icon={Wrench} label="Sample providers" value="42" trend="Example approved professionals" tint="purple" />
        <Metric icon={Clock3} label="Pending requests" value="18" trend="Example awaiting assignment" tint="orange" />
      </section>
      <div className="content-grid">
        <section className="panel">
          <header className="panel-header"><div><h2>Booking activity</h2><p>Illustrative volume across a seven-day period</p></div><span className="status-pill status-blue">7 days</span></header>
          <div className="chart-layout" aria-label="Sample bookings per weekday bar chart">
            <div className="chart-scale"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div>
            <div className="bar-chart">{weekly.map((entry, index) => <div className="bar-col" key={entry.day}><div className="bar-track"><div className={`bar-fill ${index === 5 ? 'bar-fill-highlight' : ''}`} style={{ height: `${entry.value}%` }} title={`${entry.day}: ${entry.value} example bookings`} /></div><span>{entry.day}</span></div>)}</div>
          </div>
          <p className="source-note">Sample data for design validation only.</p>
        </section>
        <section className="panel">
          <header className="panel-header"><div><h2>Popular services</h2><p>Example demand by category</p></div><Link className="text-link" href="/services">All services <ArrowRight size={15} /></Link></header>
          <div className="service-breakdown">{breakdown.map((entry) => <div className="breakdown-row" key={entry.label}><div className="breakdown-top"><span>{entry.label}</span><b>{entry.count} jobs</b></div><div className="progress-track"><div className="progress-fill" style={{ width: `${entry.value}%`, background: entry.color }} /></div></div>)}</div>
        </section>
      </div>
      <section className="panel table-panel">
        <header className="panel-header"><div><h2>Recent bookings</h2><p>A quick look at the latest example requests</p></div><Link href="/bookings" className="text-link">View bookings <ArrowRight size={15} /></Link></header>
        <div className="table-scroll">
          <table><thead><tr><th>Booking ID</th><th>Customer</th><th>Service</th><th>Schedule</th><th>Amount</th><th>Status</th></tr></thead><tbody>{bookings.slice(0, 5).map((booking) => <tr key={booking.id}><td className="table-id">{booking.id}</td><td><Person initials={booking.initials} name={booking.customer} /></td><td><strong>{booking.service}</strong></td><td>{booking.date}</td><td><strong>{booking.amount}</strong></td><td><StatusPill status={booking.status} /></td></tr>)}</tbody></table>
        </div>
      </section>
      <div className="kpi-strip" style={{ marginTop: 20, marginBottom: 0 }}>
        <div className="panel"><CircleCheck size={23} /><span><b>92%</b><small>Example fulfillment rate</small></span></div>
        <div className="panel"><Users size={23} /><span><b>1,280</b><small>Example customer accounts</small></span></div>
        <div className="panel"><Clock3 size={23} /><span><b>28 min</b><small>Example dispatch response time</small></span></div>
      </div>
    </>
  );
}

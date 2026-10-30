/** Fictional demonstration data. Never present this as actual platform activity. */
export type Booking = {
  id: string;
  customer: string;
  initials: string;
  service: string;
  provider: string;
  date: string;
  amount: string;
  status: 'Pending' | 'Assigned' | 'In progress' | 'Completed';
};
export type Provider = {
  id: string;
  name: string;
  initials: string;
  skill: string;
  location: string;
  jobs: number;
  rating: string;
  status: 'Verified' | 'Pending' | 'Unavailable';
};
export type Customer = { id: string; name: string; initials: string; area: string; bookings: number; joined: string; status: 'Active' | 'New' };

export const bookings: Booking[] = [
  { id: 'HS-1042', customer: 'Aarav Sharma', initials: 'AS', service: 'AC service & inspection', provider: 'Rahul Verma', date: 'Oct 31 · 10:00 AM', amount: '₹499', status: 'Pending' },
  { id: 'HS-1041', customer: 'Meera Joshi', initials: 'MJ', service: 'Deep bathroom cleaning', provider: 'Sanjay Kumar', date: 'Oct 31 · 11:30 AM', amount: '₹799', status: 'Assigned' },
  { id: 'HS-1040', customer: 'Rohan Gupta', initials: 'RG', service: 'Electrical inspection', provider: 'Priya Singh', date: 'Oct 30 · 2:00 PM', amount: '₹249', status: 'In progress' },
  { id: 'HS-1039', customer: 'Sara Khan', initials: 'SK', service: 'Tap & leakage check', provider: 'Rahul Verma', date: 'Oct 30 · 12:00 PM', amount: '₹199', status: 'Completed' },
  { id: 'HS-1038', customer: 'Ishaan Patel', initials: 'IP', service: 'Painting consultation', provider: 'Not assigned', date: 'Nov 01 · 9:30 AM', amount: '₹199', status: 'Pending' },
  { id: 'HS-1037', customer: 'Neha Kapoor', initials: 'NK', service: 'Appliance diagnosis', provider: 'Sanjay Kumar', date: 'Oct 29 · 3:00 PM', amount: '₹299', status: 'Completed' },
];

export const providers: Provider[] = [
  { id: 'PRO-301', name: 'Rahul Verma', initials: 'RV', skill: 'AC & appliance repair', location: 'Civil Lines', jobs: 47, rating: '4.9', status: 'Verified' },
  { id: 'PRO-302', name: 'Priya Singh', initials: 'PS', skill: 'Electrical services', location: 'Katra', jobs: 38, rating: '4.8', status: 'Verified' },
  { id: 'PRO-303', name: 'Sanjay Kumar', initials: 'SK', skill: 'Home cleaning', location: 'Naini', jobs: 63, rating: '4.9', status: 'Verified' },
  { id: 'PRO-304', name: 'Aditya Mishra', initials: 'AM', skill: 'Plumbing', location: 'George Town', jobs: 0, rating: '—', status: 'Pending' },
  { id: 'PRO-305', name: 'Kiran Yadav', initials: 'KY', skill: 'Painting', location: 'Jhunsi', jobs: 22, rating: '4.7', status: 'Unavailable' },
];

export const customers: Customer[] = [
  { id: 'CUS-201', name: 'Aarav Sharma', initials: 'AS', area: 'Civil Lines', bookings: 4, joined: 'Oct 2026', status: 'Active' },
  { id: 'CUS-202', name: 'Meera Joshi', initials: 'MJ', area: 'Katra', bookings: 2, joined: 'Oct 2026', status: 'Active' },
  { id: 'CUS-203', name: 'Rohan Gupta', initials: 'RG', area: 'Naini', bookings: 6, joined: 'Sep 2026', status: 'Active' },
  { id: 'CUS-204', name: 'Sara Khan', initials: 'SK', area: 'George Town', bookings: 1, joined: 'Oct 2026', status: 'New' },
  { id: 'CUS-205', name: 'Ishaan Patel', initials: 'IP', area: 'Jhunsi', bookings: 1, joined: 'Oct 2026', status: 'New' },
];

export const services = [
  { id: 'SER-001', name: 'Bathroom deep cleaning', category: 'Cleaning', price: '₹799', duration: '60–90 min', icon: 'sparkles' },
  { id: 'SER-002', name: 'Electrical inspection', category: 'Electrical', price: '₹249', duration: '30–45 min', icon: 'zap' },
  { id: 'SER-003', name: 'Tap & leakage check', category: 'Plumbing', price: '₹199', duration: '30–60 min', icon: 'droplets' },
  { id: 'SER-004', name: 'AC service & inspection', category: 'AC Repair', price: '₹499', duration: '45–60 min', icon: 'snowflake' },
  { id: 'SER-005', name: 'Appliance diagnosis', category: 'Appliances', price: '₹299', duration: '30–45 min', icon: 'wrench' },
  { id: 'SER-006', name: 'Painting consultation', category: 'Painting', price: '₹199', duration: '30 min', icon: 'paintbrush' },
] as const;

export function initialsColor(initials: string) {
  return ['avatar-blue', 'avatar-teal', 'avatar-purple', 'avatar-orange'][initials.charCodeAt(0) % 4];
}

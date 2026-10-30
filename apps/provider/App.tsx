import { MobileAuthGate, useMobileAuth } from '@home-services/mobile-auth';
import { useState } from 'react';
import { Pressable, StatusBar, StyleSheet, Switch, View } from 'react-native';
import {
  AppButton,
  AppShell,
  AppText,
  Badge,
  Icon,
  Notice,
  PageHeader,
  SectionHeading,
  SurfaceCard,
  type IconName,
  type TabDefinition,
} from '@home-services/mobile-ui';
import { colors, radii } from '@home-services/design-tokens';

type ProviderTab = 'dashboard' | 'jobs' | 'schedule' | 'earnings' | 'profile';
type JobStatus = 'New offer' | 'Scheduled' | 'Completed';
type DemoJob = {
  id: string;
  service: string;
  customer: string;
  area: string;
  date: string;
  time: string;
  fee: string;
  status: JobStatus;
  icon: IconName;
};

const tabs: readonly TabDefinition<ProviderTab>[] = [
  { id: 'dashboard', title: 'Home', icon: 'home-outline' },
  { id: 'jobs', title: 'Jobs', icon: 'briefcase-outline' },
  { id: 'schedule', title: 'Schedule', icon: 'calendar-outline' },
  { id: 'earnings', title: 'Earnings', icon: 'wallet-outline' },
  { id: 'profile', title: 'Profile', icon: 'person-outline' },
];

const jobs: DemoJob[] = [
  { id: 'HS-1027', service: 'Electrical inspection', customer: 'Sample customer', area: 'Civil Lines, Prayagraj', date: 'Sample date', time: '10:30 AM', fee: '₹249', status: 'New offer', icon: 'flash-outline' },
  { id: 'HS-1026', service: 'Tap & leakage check', customer: 'Sample customer', area: 'Katra, Prayagraj', date: 'Sample date', time: '2:00 PM', fee: '₹199', status: 'Scheduled', icon: 'water-outline' },
  { id: 'HS-1025', service: 'Appliance diagnosis', customer: 'Sample customer', area: 'Naini, Prayagraj', date: 'Sample date', time: '11:00 AM', fee: '₹299', status: 'Completed', icon: 'construct-outline' },
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const chartValues = [42, 76, 63, 95, 58, 81, 50];

function JobCard({ job, onPress }: { job: DemoJob; onPress: () => void }) {
  const tone = job.status === 'New offer' ? 'amber' : job.status === 'Completed' ? 'teal' : 'blue';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`View ${job.service}`} onPress={onPress}>
      <SurfaceCard>
        <View style={styles.rowBetween}>
          <Badge label={job.status} tone={tone} />
          <AppText size={11} color={colors.muted}>{job.id}</AppText>
        </View>
        <View style={[styles.row, { marginTop: 17 }]}>
          <View style={styles.jobIcon}><Icon name={job.icon} color={colors.primary} size={23} /></View>
          <View style={{ flex: 1 }}>
            <AppText size={16} weight="bold">{job.service}</AppText>
            <AppText color={colors.inkSoft} size={12} style={{ marginTop: 6 }}>{job.customer}</AppText>
          </View>
          <AppText weight="bold" size={16}>{job.fee}</AppText>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Icon name="location-outline" color={colors.muted} size={16} />
          <AppText color={colors.inkSoft} size={12} style={{ flex: 1 }}>{job.area}</AppText>
        </View>
        <View style={[styles.rowBetween, { marginTop: 13 }]}>
          <View style={styles.row}>
            <Icon name="time-outline" color={colors.muted} size={16} />
            <AppText color={colors.inkSoft} size={12}>{job.date} · {job.time}</AppText>
          </View>
          <Icon name="arrow-forward-outline" color={colors.primary} size={17} />
        </View>
      </SurfaceCard>
    </Pressable>
  );
}

function MiniStat({ label, value, icon, tint }: { label: string; value: string; icon: IconName; tint: string }) {
  return (
    <View style={[styles.statBox, { backgroundColor: tint }]}>
      <Icon name={icon} color={colors.ink} size={21} />
      <AppText size={26} weight="bold" style={{ marginTop: 14 }}>{value}</AppText>
      <AppText color={colors.inkSoft} size={12} style={{ marginTop: 5 }}>{label}</AppText>
    </View>
  );
}

function PreviewApp() {
  const { logout } = useMobileAuth();
  const [tab, setTab] = useState<ProviderTab>('dashboard');
  const [online, setOnline] = useState(false);
  const [jobFilter, setJobFilter] = useState<'All' | JobStatus>('All');
  const [activeJob, setActiveJob] = useState<DemoJob | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [availableDays, setAvailableDays] = useState([true, true, true, true, true, false, false]);

  function navigate(next: ProviderTab) {
    setActiveJob(null);
    setTab(next);
  }

  const filteredJobs = jobs.filter((job) => jobFilter === 'All' || job.status === jobFilter);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <AppShell tabs={tabs} currentTab={tab} onTabChange={navigate}>
        {activeJob ? (
          <>
            <Pressable onPress={() => setActiveJob(null)} style={styles.back} accessibilityRole="button">
              <Icon name="arrow-back" size={19} color={colors.ink} />
              <AppText weight="semibold" size={13}>Back to jobs</AppText>
            </Pressable>
            <PageHeader kicker="Job details / demo" title={activeJob.service} description={`Reference ${activeJob.id}`} />
            <View style={[styles.jobHero, { backgroundColor: '#E8EEFF' }]}>
              <Icon name={activeJob.icon} color={colors.primary} size={65} />
            </View>
            <Badge label={activeJob.status} tone="blue" />
            <SurfaceCard style={{ marginTop: 18 }}>
              {[
                { icon: 'person-outline' as IconName, label: 'Customer', value: activeJob.customer },
                { icon: 'location-outline' as IconName, label: 'Service address', value: activeJob.area },
                { icon: 'time-outline' as IconName, label: 'Appointment', value: `${activeJob.date} · ${activeJob.time}` },
                { icon: 'cash-outline' as IconName, label: 'Illustrative service fee', value: activeJob.fee },
              ].map((item) => (
                <View key={item.label} style={[styles.row, { paddingVertical: 12 }]}>
                  <View style={styles.smallIcon}><Icon name={item.icon} color={colors.primary} size={19} /></View>
                  <View style={{ flex: 1, gap: 5 }}>
                    <AppText size={11} color={colors.muted}>{item.label}</AppText>
                    <AppText weight="semibold" size={14}>{item.value}</AppText>
                  </View>
                </View>
              ))}
            </SurfaceCard>
            <Notice>This is a sample job. Acceptance, rejection and job status changes require backend dispatch implementation in Phase 12–15.</Notice>
            <AppButton label="Accept job (coming later)" disabled onPress={() => {}} icon="checkmark-circle-outline" />
          </>
        ) : tab === 'dashboard' ? (
          <>
            <View style={styles.rowBetween}>
              <View>
                <AppText color={colors.muted} size={13}>Provider workspace</AppText>
                <AppText weight="bold" size={27} style={{ marginTop: 5 }}>Good to see you.</AppText>
              </View>
              <View style={styles.avatar}><Icon name="person-outline" color={colors.primary} size={25} /></View>
            </View>
            <View style={[styles.availability, { marginTop: 24 }]}>
              <View style={[styles.onlineDot, { backgroundColor: online ? '#28CB9E' : '#91A1BB' }]} />
              <View style={{ flex: 1 }}>
                <AppText color="#FFFFFF" size={16} weight="bold">{online ? 'Preview: Available' : 'Preview: Offline'}</AppText>
                <AppText color="#CBD7EF" size={12} style={{ marginTop: 5 }}>Local demo toggle, not connected to dispatch.</AppText>
              </View>
              <Switch
                value={online}
                onValueChange={setOnline}
                trackColor={{ false: '#4C5D7B', true: '#6C8FEB' }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Preview availability"
              />
            </View>
            <View style={styles.stats}>
              <MiniStat label="Sample jobs today" value="03" icon="briefcase-outline" tint="#E8F1FF" />
              <MiniStat label="Sample completed" value="12" icon="checkmark-circle-outline" tint="#E2F8EE" />
            </View>
            <SectionHeading title="New requests" action="View all" onAction={() => { setJobFilter('New offer'); navigate('jobs'); }} />
            <JobCard job={jobs[0]} onPress={() => setActiveJob(jobs[0])} />
            <SectionHeading title="Upcoming" action="Schedule" onAction={() => navigate('schedule')} />
            <JobCard job={jobs[1]} onPress={() => setActiveJob(jobs[1])} />
            <Notice>All statistics, customers and job cards on this screen are demo data.</Notice>
          </>
        ) : tab === 'jobs' ? (
          <>
            <PageHeader kicker="Assignments" title="My jobs" description="Review example requests and appointment details." />
            <View style={styles.filters}>
              {(['All', 'New offer', 'Scheduled', 'Completed'] as const).map((filter) => (
                <Pressable
                  key={filter}
                  onPress={() => setJobFilter(filter)}
                  style={[styles.filter, jobFilter === filter && styles.filterActive]}
                  accessibilityRole="button"
                >
                  <AppText size={12} color={jobFilter === filter ? '#FFFFFF' : colors.inkSoft} weight="semibold">{filter}</AppText>
                </Pressable>
              ))}
            </View>
            <AppText color={colors.muted} size={12} style={{ marginBottom: 13 }}>{filteredJobs.length} sample job{filteredJobs.length === 1 ? '' : 's'}</AppText>
            {filteredJobs.map((job) => <JobCard key={job.id} job={job} onPress={() => setActiveJob(job)} />)}
            <Notice>Job offers and progress are design previews until provider onboarding and assignment logic are implemented.</Notice>
          </>
        ) : tab === 'schedule' ? (
          <>
            <PageHeader kicker="Planning" title="My schedule" description="Preview your weekly availability and assignments." />
            <SurfaceCard>
              <View style={styles.rowBetween}>
                <AppText weight="bold" size={17}>Weekly availability</AppText>
                <Badge label="Local preview" tone="amber" />
              </View>
              <View style={styles.week}>
                {days.map((day, index) => (
                  <Pressable key={day} onPress={() => setActiveDay(index)} style={styles.day} accessibilityRole="button">
                    <AppText size={12} color={colors.muted}>{day}</AppText>
                    <View style={[styles.dayCircle, activeDay === index && styles.dayActive]}>
                      <AppText size={12} weight="bold" color={activeDay === index ? '#FFFFFF' : colors.ink}>{index + 1}</AppText>
                    </View>
                    <View style={[styles.dayDot, { backgroundColor: availableDays[index] ? colors.teal : colors.border }]} />
                  </Pressable>
                ))}
              </View>
              <View style={styles.divider} />
              <View style={styles.rowBetween}>
                <View>
                  <AppText weight="semibold">{days[activeDay]} availability</AppText>
                  <AppText size={12} color={colors.muted} style={{ marginTop: 5 }}>{availableDays[activeDay] ? 'Available for assignments' : 'Not available'}</AppText>
                </View>
                <Switch
                  value={availableDays[activeDay]}
                  onValueChange={(value) => setAvailableDays((current) => current.map((day, index) => index === activeDay ? value : day))}
                  accessibilityLabel="Preview daily availability"
                  trackColor={{ false: '#D4DCE8', true: '#82D6C4' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </SurfaceCard>
            <SectionHeading title="Example appointment" />
            <JobCard job={jobs[1]} onPress={() => setActiveJob(jobs[1])} />
            <Notice>Weekly availability is temporary screen state. Time-zone aware scheduling and conflict checks come in Phase 10.</Notice>
          </>
        ) : tab === 'earnings' ? (
          <>
            <PageHeader kicker="Your finances" title="Earnings overview" description="Illustrative payout reporting interface." />
            <View style={styles.earningsHero}>
              <AppText color="#C9D8F5" size={13}>Sample earnings this week</AppText>
              <AppText color="#FFFFFF" weight="bold" size={38} style={{ marginTop: 10 }}>₹4,850</AppText>
              <View style={[styles.row, { marginTop: 16 }]}>
                <Icon name="trending-up" color="#8FE4CA" size={17} />
                <AppText color="#BDEFD9" size={12}>Example metric · not real funds</AppText>
              </View>
            </View>
            <SectionHeading title="Weekly activity" />
            <SurfaceCard>
              <View style={styles.chart}>
                {chartValues.map((value, index) => (
                  <View key={days[index]} style={styles.chartCol}>
                    <View style={{ height: 130, justifyContent: 'flex-end', width: '100%' }}>
                      <View style={{ height: `${value}%`, borderRadius: 7, backgroundColor: index === 3 ? colors.primary : '#C9D5FC', width: '58%', alignSelf: 'center' }} />
                    </View>
                    <AppText size={11} color={colors.muted}>{days[index]}</AppText>
                  </View>
                ))}
              </View>
            </SurfaceCard>
            <SectionHeading title="Example summary" />
            <SurfaceCard>
              {[
                ['Completed services', '12'],
                ['Platform commission', '₹720'],
                ['Pending settlement', '₹1,200'],
              ].map(([label, value], index) => (
                <View key={label}>
                  <View style={[styles.rowBetween, { paddingVertical: 11 }]}>
                    <AppText size={13} color={colors.inkSoft}>{label}</AppText>
                    <AppText weight="bold" size={14}>{value}</AppText>
                  </View>
                  {index < 2 && <View style={styles.divider} />}
                </View>
              ))}
            </SurfaceCard>
            <Notice>Real payments, commissions and settlements are implemented in Phases 18–19.</Notice>
          </>
        ) : (
          <>
            <PageHeader kicker="Professional account" title="My profile" description="Manage service skills, documents and settings." />
            <SurfaceCard style={{ alignItems: 'center', paddingVertical: 27 }}>
              <View style={styles.bigAvatar}><Icon name="person-outline" color={colors.primary} size={33} /></View>
              <AppText weight="bold" size={19} style={{ marginTop: 15 }}>Provider demo</AppText>
              <Badge label="Verification pending (demo)" tone="amber" />
            </SurfaceCard>
            {[
              ['Skills & services', 'construct-outline' as IconName],
              ['Working areas', 'map-outline' as IconName],
              ['Identity verification', 'shield-checkmark-outline' as IconName],
              ['Payout account', 'card-outline' as IconName],
              ['Help & support', 'help-circle-outline' as IconName],
            ].map(([name, icon]) => (
              <View key={name} style={styles.menuItem}>
                <Icon name={icon as IconName} color={colors.primary} />
                <AppText weight="medium" style={{ flex: 1 }}>{name}</AppText>
                <Badge label="Soon" tone="neutral" />
              </View>
            ))}
            <Notice>Account verification and editable provider details arrive in Phases 04 and 09.</Notice>
            <AppButton label="Sign out" variant="secondary" icon="log-out-outline" onPress={() => { void logout(); }} />
          </>
        )}
      </AppShell>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  smallIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  avatar: { width: 48, height: 48, backgroundColor: colors.primaryLight, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  availability: { borderRadius: radii.xl, backgroundColor: colors.dark, padding: 20, flexDirection: 'row', gap: 12, alignItems: 'center' },
  onlineDot: { width: 11, height: 11, borderRadius: 6 },
  stats: { flexDirection: 'row', gap: 12, marginTop: 17, marginBottom: 8 },
  statBox: { flex: 1, borderRadius: 18, padding: 18, minHeight: 134 },
  jobIcon: { height: 48, width: 48, borderRadius: 14, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  filter: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 30 },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  day: { alignItems: 'center', gap: 9, flex: 1 },
  dayCircle: { width: 35, height: 35, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  dayActive: { backgroundColor: colors.primary },
  dayDot: { width: 5, height: 5, borderRadius: 3 },
  earningsHero: { padding: 25, backgroundColor: colors.dark, borderRadius: radii.xl, marginBottom: 13 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingVertical: 11, gap: 7 },
  chartCol: { flex: 1, alignItems: 'center', gap: 10 },
  bigAvatar: { width: 76, height: 76, backgroundColor: colors.primaryLight, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  menuItem: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 15, flexDirection: 'row', padding: 17, gap: 15, alignItems: 'center', marginBottom: 9 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 23, paddingVertical: 9 },
  jobHero: { minHeight: 170, borderRadius: radii.xl, justifyContent: 'center', alignItems: 'center', marginBottom: 19 },
});

export default function App() {
  return <MobileAuthGate role="PROVIDER"><PreviewApp /></MobileAuthGate>;
}

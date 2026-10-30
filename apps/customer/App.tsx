import { MobileAuthGate, useMobileAuth } from '@home-services/mobile-auth';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  AppButton,
  AppShell,
  AppText,
  Badge,
  Icon,
  Notice,
  PageHeader,
  SearchField,
  SectionHeading,
  SurfaceCard,
  type IconName,
  type TabDefinition,
} from '@home-services/mobile-ui';
import { colors, radii } from '@home-services/design-tokens';

type CustomerTab = 'home' | 'explore' | 'bookings' | 'profile';
type Service = {
  id: string;
  name: string;
  category: string;
  icon: IconName;
  duration: string;
  price: string;
  description: string;
  accent: string;
};

const tabs: readonly TabDefinition<CustomerTab>[] = [
  { id: 'home', title: 'Home', icon: 'home-outline' },
  { id: 'explore', title: 'Explore', icon: 'grid-outline' },
  { id: 'bookings', title: 'Bookings', icon: 'calendar-outline' },
  { id: 'profile', title: 'Profile', icon: 'person-outline' },
];

type CategoryTileItem = { id: string; name: string; slug: string; icon: IconName; tint: string };
type ApiCategory = { id: string; slug: string; name: string; isActive: boolean };
type ApiService = {
  id: string; slug: string; name: string; description: string | null;
  basePricePaise: number; durationMinutes: number;
  category: { id: string; slug: string; name: string };
};

const categoryIcons: Record<string, { icon: IconName; tint: string; accent: string }> = {
  cleaning: { icon: 'sparkles-outline', tint: '#E2F8F0', accent: '#DDF7EB' },
  electrical: { icon: 'flash-outline', tint: '#FFF1D9', accent: '#FFF0D6' },
  plumbing: { icon: 'water-outline', tint: '#E5F0FF', accent: '#E4F0FF' },
  'ac-repair': { icon: 'snow-outline', tint: '#F0E9FF', accent: '#EDE9FF' },
  appliances: { icon: 'construct-outline', tint: '#FFF0EE', accent: '#FFF0EE' },
  painting: { icon: 'color-palette-outline', tint: '#EDF2FD', accent: '#EEF2FF' },
};
const defaultIcon = { icon: 'home-outline' as IconName, tint: '#EDF2FD', accent: '#EEF2FF' };
function toDisplayService(item: ApiService): Service {
  const style = categoryIcons[item.category.slug] ?? defaultIcon;
  return {
    id: item.id, name: item.name, category: item.category.name,
    icon: style.icon, accent: style.accent,
    duration: `${item.durationMinutes} min`,
    price: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.basePricePaise / 100),
    description: item.description || 'Professional home service',
  };
}

type Draft = { id: string; service: string; address: string; time: string; details: string };

function ServiceItem({ service, onPress }: { service: Service; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`View ${service.name}`}>
      <SurfaceCard style={styles.serviceItem}>
        <View style={[styles.serviceArt, { backgroundColor: service.accent }]}>
          <Icon name={service.icon} size={27} color={colors.ink} />
        </View>
        <View style={styles.flex}>
          <AppText weight="bold" size={15}>{service.name}</AppText>
          <AppText color={colors.muted} size={12} style={{ marginTop: 5 }}>{service.duration} • From {service.price}</AppText>
          <AppText color={colors.inkSoft} size={12} style={{ marginTop: 5, lineHeight: 17 }}>{service.category}</AppText>
        </View>
        <Icon name="chevron-forward-outline" color={colors.muted} size={18} />
      </SurfaceCard>
    </Pressable>
  );
}

function CategoryTile({ item, onPress }: { item: CategoryTileItem; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.category} accessibilityRole="button">
      <View style={[styles.categoryArt, { backgroundColor: item.tint }]}>
        <Icon name={item.icon} color={colors.ink} size={26} />
      </View>
      <AppText size={12} weight="semibold">{item.name}</AppText>
    </Pressable>
  );
}

function PreviewApp() {
  const { logout } = useMobileAuth();
  const [categories, setCategories] = useState<CategoryTileItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [tab, setTab] = useState<CustomerTab>('home');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Service | null>(null);
  const [bookingMode, setBookingMode] = useState(false);
  const [review, setReview] = useState(false);
  const [address, setAddress] = useState('');
  const [slot, setSlot] = useState('Tomorrow · 10:00 AM');
  const [problem, setProblem] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true); setCatalogError('');
    try {
      const api = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
      if (!api) throw new Error('EXPO_PUBLIC_API_URL is not configured');
      const [categoriesResponse, servicesResponse] = await Promise.all([
        fetch(`${api}/catalog/categories`),
        fetch(`${api}/catalog/services?limit=100`),
      ]);
      if (!categoriesResponse.ok || !servicesResponse.ok) throw new Error('Service catalog is unavailable');
      const [categoryData, serviceData]: [ApiCategory[], ApiService[]] = await Promise.all([
        categoriesResponse.json(), servicesResponse.json(),
      ]);
      if (!Array.isArray(categoryData) || !Array.isArray(serviceData)) throw new Error('Invalid catalog response');
      setCategories(categoryData.map((c) => ({
        id: c.id, name: c.name, slug: c.slug,
        icon: (categoryIcons[c.slug] ?? defaultIcon).icon,
        tint: (categoryIcons[c.slug] ?? defaultIcon).tint,
      })));
      setServices(serviceData.map(toDisplayService));
    } catch (error) {
      setCategories([]); setServices([]);
      setCatalogError(error instanceof Error ? error.message : 'Catalog loading failed');
    } finally {
      setCatalogLoading(false);
    }
  }, []);
  useEffect(() => { void loadCatalog(); }, [loadCatalog]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    return services.filter((service) =>
      (category === 'All' || service.category === category) &&
      (`${service.name} ${service.category} ${service.description}`).toLowerCase().includes(query),
    );
  }, [category, search, services]);

  function navigate(next: CustomerTab) {
    setSelected(null);
    setBookingMode(false);
    setReview(false);
    setTab(next);
  }

  function openService(service: Service) {
    setSelected(service);
    setBookingMode(false);
    setReview(false);
  }

  function back() {
    if (review) setReview(false);
    else if (bookingMode) setBookingMode(false);
    else setSelected(null);
  }

  function saveDraft() {
    if (!selected) return;
    setDrafts((current) => [
      { id: `LOCAL-${Date.now()}`, service: selected.name, address: address.trim() || 'Address not provided', time: slot, details: problem.trim() },
      ...current,
    ]);
    navigate('bookings');
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <AppShell tabs={tabs} currentTab={tab} onTabChange={navigate}>
        {selected ? (
          <>
            <Pressable style={styles.back} onPress={back} accessibilityRole="button">
              <Icon name="arrow-back" size={18} color={colors.ink} />
              <AppText weight="semibold" size={13}>Back</AppText>
            </Pressable>
            {review ? (
              <>
                <PageHeader kicker="Booking preview" title="Review your request" description="This is a local demo. No service provider will be notified." />
                <SurfaceCard>
                  <AppText size={13} color={colors.muted}>SERVICE</AppText>
                  <AppText weight="bold" size={19} style={styles.detailLine}>{selected.name}</AppText>
                  <View style={styles.divider} />
                  <AppText size={13} color={colors.muted}>ADDRESS</AppText>
                  <AppText style={styles.detailLine}>{address.trim() || 'Not added'}</AppText>
                  <View style={styles.divider} />
                  <AppText size={13} color={colors.muted}>PREFERRED SLOT</AppText>
                  <AppText style={styles.detailLine}>{slot}</AppText>
                  <View style={styles.divider} />
                  <AppText size={13} color={colors.muted}>ESTIMATED STARTING PRICE</AppText>
                  <AppText weight="bold" size={22} style={styles.detailLine}>{selected.price}</AppText>
                </SurfaceCard>
                <Notice>Saving creates a draft on this device only. It is not submitted to an admin or provider.</Notice>
                <AppButton label="Save demo draft" icon="bookmark-outline" onPress={saveDraft} />
              </>
            ) : bookingMode ? (
              <>
                <PageHeader kicker="Step 2 of 2" title="Your appointment" description="Add a service address and choose a preferred time." />
                <AppText weight="bold" size={13} style={styles.formLabel}>SERVICE ADDRESS</AppText>
                <TextInput
                  style={styles.textArea}
                  placeholder="Flat, building, street and area"
                  placeholderTextColor={colors.muted}
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  accessibilityLabel="Service address"
                />
                <AppText weight="bold" size={13} style={styles.formLabel}>PREFERRED TIME</AppText>
                <View style={styles.slotRow}>
                  {['Tomorrow · 10:00 AM', 'Tomorrow · 2:00 PM', 'Saturday · 11:00 AM'].map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => setSlot(item)}
                      style={[styles.slot, slot === item && styles.slotActive]}
                      accessibilityRole="button"
                    >
                      <AppText size={12} weight="semibold" color={slot === item ? colors.primary : colors.inkSoft}>{item}</AppText>
                    </Pressable>
                  ))}
                </View>
                <AppText weight="bold" size={13} style={styles.formLabel}>DESCRIBE THE PROBLEM (OPTIONAL)</AppText>
                <TextInput
                  style={styles.textArea}
                  multiline
                  placeholder="Tell the technician what is wrong..."
                  placeholderTextColor={colors.muted}
                  value={problem}
                  onChangeText={setProblem}
                  accessibilityLabel="Problem description"
                />
                <Notice>Scheduling and addresses are UI previews. Availability is not connected to live data.</Notice>
                <AppButton label="Review request" icon="arrow-forward-outline" onPress={() => setReview(true)} disabled={!address.trim()} />
              </>
            ) : (
              <>
                <View style={[styles.detailHero, { backgroundColor: selected.accent }]}>
                  <Icon name={selected.icon} color={colors.ink} size={72} />
                </View>
                <Badge label={selected.category} tone="teal" />
                <AppText size={28} weight="bold" style={{ marginTop: 16, marginBottom: 10 }}>{selected.name}</AppText>
                <AppText color={colors.inkSoft} style={{ lineHeight: 23 }}>{selected.description}</AppText>
                <SurfaceCard style={{ marginTop: 22 }}>
                  <View style={styles.horizontal}>
                    <Icon name="time-outline" color={colors.primary} />
                    <AppText color={colors.inkSoft} size={13}>{selected.duration}</AppText>
                    <View style={{ flex: 1 }} />
                    <AppText weight="bold" size={20}>{selected.price}</AppText>
                  </View>
                </SurfaceCard>
                <Notice>Service pricing comes from the live catalog. Booking submission is still a preview until Phase 08.</Notice>
                <AppButton label="Choose a time" icon="calendar-outline" onPress={() => setBookingMode(true)} />
              </>
            )}
          </>
        ) : tab === 'home' ? (
          <>
            <View style={styles.welcomeRow}>
              <View>
                <AppText color={colors.muted} size={13}>Welcome to Home Services</AppText>
                <AppText weight="bold" size={25} style={{ marginTop: 5 }}>How can we help?</AppText>
              </View>
              <View style={styles.avatar}><Icon name="person-outline" color={colors.primary} size={22} /></View>
            </View>
            <Pressable style={styles.locationRow} onPress={() => navigate('profile')}>
              <Icon name="location-outline" size={17} color={colors.teal} />
              <AppText color={colors.inkSoft} size={12} weight="medium">Add your service location</AppText>
              <Icon name="chevron-down-outline" size={14} color={colors.muted} />
            </Pressable>
            <View style={styles.promo}>
              <View style={{ flex: 1 }}>
                <AppText size={11} weight="bold" color="#BDE4E4" style={{ letterSpacing: 1.1 }}>AT YOUR DOORSTEP</AppText>
                <AppText size={26} weight="bold" color="#FFFFFF" style={{ marginTop: 13, lineHeight: 33 }}>Expert care for your home.</AppText>
                <AppText size={13} color="#CEDCF4" style={{ marginTop: 10, lineHeight: 20 }}>Explore trusted service categories, all in one place.</AppText>
              </View>
              <View style={styles.promoIcon}><Icon name="home-outline" size={43} color="#FFFFFF" /></View>
            </View>
            <SearchField value={search} onChangeText={(value) => { setSearch(value); setTab('explore'); }} placeholder="What needs fixing today?" />
            {catalogError ? <Notice>{catalogError}. Check the API connection.</Notice> : null}
            {catalogError && <AppButton label="Retry catalog" variant="secondary" compact onPress={() => { void loadCatalog(); }} />}
            {catalogLoading && <AppText size={13} color={colors.muted}>Loading live catalog...</AppText>}
            <SectionHeading title="Browse by category" action="See all" onAction={() => navigate('explore')} />
            <View style={styles.categoriesGrid}>
              {categories.map((item) => (
                <CategoryTile key={item.name} item={item} onPress={() => { setCategory(item.name); navigate('explore'); }} />
              ))}
            </View>
            <SectionHeading title="Popular services" action="View all" onAction={() => { setCategory('All'); navigate('explore'); }} />
            {services.slice(0, 3).map((service) => <ServiceItem key={service.id} service={service} onPress={() => openService(service)} />)}
            <Notice>Categories and prices load from the database. Bookings and checkout are not active yet.</Notice>
          </>
        ) : tab === 'explore' ? (
          <>
            <PageHeader kicker="Service catalog" title="Explore services" description="Find a solution for your home." />
            {catalogError ? <Notice>{catalogError}. Check the API connection.</Notice> : null}
            {catalogError && <AppButton label="Retry" variant="secondary" compact onPress={() => { void loadCatalog(); }} />}
            {catalogLoading && <AppText color={colors.muted}>Loading services...</AppText>}
            <SearchField value={search} onChangeText={setSearch} placeholder="Search categories or services" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 20 }} contentContainerStyle={{ gap: 9 }}>
              {['All', ...categories.map((item) => item.name)].map((item) => (
                <Pressable key={item} onPress={() => setCategory(item)} style={[styles.filter, category === item && styles.filterActive]}>
                  <AppText size={12} weight="semibold" color={category === item ? '#FFFFFF' : colors.inkSoft}>{item}</AppText>
                </Pressable>
              ))}
            </ScrollView>
            <AppText color={colors.muted} size={12} style={{ marginBottom: 13 }}>{filtered.length} service{filtered.length === 1 ? '' : 's'} shown</AppText>
            {filtered.length ? filtered.map((service) => <ServiceItem key={service.id} service={service} onPress={() => openService(service)} />) : (
              <SurfaceCard><AppText color={colors.inkSoft}>No matches. Change your search or category.</AppText></SurfaceCard>
            )}
          </>
        ) : tab === 'bookings' ? (
          <>
            <PageHeader kicker="Your activity" title="My bookings" description="Draft requests saved in this local demo." />
            {drafts.length === 0 ? (
              <SurfaceCard style={styles.empty}>
                <View style={styles.emptyIcon}><Icon name="calendar-outline" size={33} color={colors.primary} /></View>
                <AppText weight="bold" size={19}>No requests yet</AppText>
                <AppText color={colors.inkSoft} size={13} style={{ textAlign: 'center', lineHeight: 20, marginVertical: 12 }}>Browse the current catalog to create a local booking preview.</AppText>
                <AppButton label="Explore services" onPress={() => navigate('explore')} compact />
              </SurfaceCard>
            ) : drafts.map((draft) => (
              <SurfaceCard key={draft.id}>
                <View style={styles.horizontal}>
                  <Badge label="Local draft" tone="amber" />
                  <AppText color={colors.muted} size={11}>{draft.id.slice(-6)}</AppText>
                </View>
                <AppText weight="bold" size={17} style={{ marginTop: 13 }}>{draft.service}</AppText>
                <AppText color={colors.inkSoft} size={12} style={{ marginTop: 7 }}>{draft.time}</AppText>
                <AppText color={colors.muted} size={12} style={{ marginTop: 4 }}>{draft.address}</AppText>
                <Pressable onPress={() => setDrafts((list) => list.filter((item) => item.id !== draft.id))} style={{ marginTop: 15 }}>
                  <AppText color={colors.danger} size={12} weight="semibold">Remove draft</AppText>
                </Pressable>
              </SurfaceCard>
            ))}
            <Notice>Drafts are held in memory only and disappear when the app restarts.</Notice>
          </>
        ) : (
          <>
            <PageHeader kicker="Account" title="Your profile" description="Personal settings and preferences will be connected after authentication." />
            <SurfaceCard style={{ alignItems: 'center', paddingVertical: 28 }}>
              <View style={styles.profileAvatar}><Icon name="person-outline" color={colors.primary} size={34} /></View>
              <AppText weight="bold" size={19} style={{ marginTop: 14 }}>Guest preview</AppText>
              <AppText size={12} color={colors.muted} style={{ marginTop: 5 }}>Sign-in arrives in Phase 04</AppText>
            </SurfaceCard>
            {[
              { label: 'My addresses', icon: 'location-outline' as IconName },
              { label: 'Payments', icon: 'wallet-outline' as IconName },
              { label: 'Help & support', icon: 'help-circle-outline' as IconName },
              { label: 'Privacy & security', icon: 'shield-checkmark-outline' as IconName },
            ].map((item) => (
              <View key={item.label} style={styles.menuItem}>
                <Icon name={item.icon} color={colors.primary} size={20} />
                <AppText weight="medium" style={{ flex: 1 }}>{item.label}</AppText>
                <Badge label="Soon" tone="neutral" />
              </View>
            ))}
            <Notice>No personal information is collected or saved in this design preview.</Notice>
            <AppButton label="Sign out" variant="secondary" icon="log-out-outline" onPress={() => { void logout(); }} />
          </>
        )}
      </AppShell>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  horizontal: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  avatar: { backgroundColor: colors.primaryLight, borderRadius: 15, height: 46, width: 46, alignItems: 'center', justifyContent: 'center' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 13, marginBottom: 22 },
  promo: { minHeight: 208, backgroundColor: colors.dark, borderRadius: radii.xl, padding: 24, flexDirection: 'row', marginBottom: 19, overflow: 'hidden' },
  promoIcon: { width: 80, height: 80, borderWidth: 1, borderColor: '#42628A', borderRadius: 26, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginLeft: 8, backgroundColor: '#223D68', transform: [{ rotate: '-13deg' }] },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 11 },
  category: { width: '33.333%', alignItems: 'center', gap: 9, paddingHorizontal: 6, paddingBottom: 22 },
  categoryArt: { width: '100%', height: 76, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  serviceItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  serviceArt: { width: 66, height: 69, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  back: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 9, marginBottom: 23 },
  detailHero: { minHeight: 200, alignItems: 'center', justifyContent: 'center', borderRadius: radii.xl, marginBottom: 21 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  detailLine: { marginTop: 7 },
  formLabel: { marginBottom: 9, marginTop: 8 },
  textArea: { minHeight: 86, padding: 16, textAlignVertical: 'top', borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 20, color: colors.ink, fontSize: 14 },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 21 },
  slot: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  slotActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  empty: { padding: 30, alignItems: 'center', marginTop: 14 },
  emptyIcon: { width: 72, height: 72, borderRadius: 21, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  profileAvatar: { width: 78, height: 78, borderRadius: 26, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 17, borderRadius: radii.md, backgroundColor: colors.surface, marginBottom: 9, borderWidth: 1, borderColor: colors.border },
  filter: { paddingVertical: 11, paddingHorizontal: 16, borderRadius: 50, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
});

export default function App() {
  return <MobileAuthGate role="CUSTOMER"><PreviewApp /></MobileAuthGate>;
}

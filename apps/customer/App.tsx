import { MobileAuthGate, useMobileAuth } from '@home-services/mobile-auth';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StatusBar, StyleSheet, TextInput, View } from 'react-native';
import {
  AppButton, AppShell, AppText, Badge, Icon, Notice, PageHeader,
  SearchField, SectionHeading, SurfaceCard, type IconName, type TabDefinition,
} from '@home-services/mobile-ui';
import { colors, radii } from '@home-services/design-tokens';
import {
  fetchCatalog, filterServices, priceLabel,
  type CatalogCategory, type CatalogService, type SortMode,
} from './src/catalog';
import {
  formatPreferredSlot, TIME_OPTIONS, upcomingDays, validateDraft,
  type BookingDraft, type BookingInput,
} from './src/booking';

type Tab = 'home' | 'explore' | 'bookings' | 'profile';
type Screen = 'service' | 'schedule' | 'review' | 'addresses' | 'payments' | 'support' | 'privacy' | 'favorites' | null;

const tabs: readonly TabDefinition<Tab>[] = [
  { id: 'home', title: 'Home', icon: 'home-outline' },
  { id: 'explore', title: 'Explore', icon: 'grid-outline' },
  { id: 'bookings', title: 'Requests', icon: 'receipt-outline' },
  { id: 'profile', title: 'Profile', icon: 'person-outline' },
];
const benefits: { icon: IconName; heading: string; caption: string }[] = [
  { icon: 'search-outline', heading: 'Find the service', caption: 'Choose a solution from the current catalog' },
  { icon: 'calendar-outline', heading: 'Share a preference', caption: 'Add an address and preferred appointment' },
  { icon: 'shield-checkmark-outline', heading: 'Get confirmation', caption: 'Provider assignment is planned for later phases' },
];
const faqs = [
  { title: 'Is this a confirmed booking?', body: 'Not yet. This version creates on-device request previews only. Booking submission and provider assignment arrive in later phases.' },
  { title: 'Are prices final?', body: 'Prices are read from the current service catalog. Inspection-based jobs may need an approved quote before any additional work.' },
  { title: 'Where are my saved requests?', body: 'Your request previews are held only in app memory for now. They disappear when the app restarts or you sign out.' },
  { title: 'How do I change my phone number?', body: 'Account settings and number changes are not yet supported. Sign out and use a different existing account to sign in.' },
];

function ServiceTile({
  item, favorite, onOpen, onFavorite,
}: {
  item: CatalogService; favorite: boolean; onOpen: () => void; onFavorite: () => void;
}) {
  return (
    <SurfaceCard style={styles.serviceCard}>
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`View ${item.name}`} style={styles.serviceMain}>
        <View style={[styles.serviceArt, { backgroundColor: item.tint }]}>
          <Icon name={item.icon} size={29} color={colors.ink} />
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <AppText size={11} color={colors.teal} weight="bold">{item.categoryName.toUpperCase()}</AppText>
          <AppText size={15} weight="bold" style={{ lineHeight: 21 }}>{item.name}</AppText>
          <AppText size={12} color={colors.muted}>{item.durationMinutes} min · {item.pricingType === 'FIXED' ? 'Fixed price' : 'Inspection'}</AppText>
          <AppText weight="bold" size={16}>{priceLabel(item.basePricePaise)}</AppText>
        </View>
      </Pressable>
      <Pressable style={styles.favoriteButton} onPress={onFavorite} accessibilityRole="button" accessibilityLabel={favorite ? `Remove ${item.name} from saved` : `Save ${item.name}`}>
        <Icon name={favorite ? 'heart' : 'heart-outline'} size={21} color={favorite ? colors.danger : colors.inkSoft} />
      </Pressable>
    </SurfaceCard>
  );
}

function CategoryTile({ item, onPress }: { item: CatalogCategory; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Browse ${item.name}`} onPress={onPress} style={styles.categoryTile}>
      <View style={[styles.categoryIcon, { backgroundColor: item.tint }]}>
        <Icon name={item.icon} size={28} color={colors.ink} />
      </View>
      <AppText weight="semibold" size={12} style={{ textAlign: 'center' }}>{item.name}</AppText>
    </Pressable>
  );
}

function EmptyState({
  icon, title, detail, action, onAction,
}: {
  icon: IconName; title: string; detail: string; action?: string; onAction?: () => void;
}) {
  return (
    <SurfaceCard style={styles.emptyState}>
      <View style={styles.emptyIcon}><Icon name={icon} color={colors.primary} size={31} /></View>
      <AppText weight="bold" size={18} style={{ textAlign: 'center' }}>{title}</AppText>
      <AppText color={colors.inkSoft} size={13} style={styles.emptyText}>{detail}</AppText>
      {action && onAction && <AppButton compact label={action} onPress={onAction} />}
    </SurfaceCard>
  );
}

function CustomerApp() {
  const { user, logout } = useMobileAuth();
  const [tab, setTab] = useState<Tab>('home');
  const [screen, setScreen] = useState<Screen>(null);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>('name');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const dates = upcomingDays();
  const [preferredDate, setPreferredDate] = useState(dates[0].id);
  const [preferredTime, setPreferredTime] = useState('11:00');
  const [drafts, setDrafts] = useState<BookingDraft[]>([]);
  const [formError, setFormError] = useState('');
  const [faqExpanded, setFaqExpanded] = useState<number | null>(null);

  const load = useCallback(async (signal?: AbortSignal, initial = false) => {
    const version = ++requestVersion.current;
    if (!initial) setRefreshing(true);
    setError('');
    try {
      const data = await fetchCatalog(process.env.EXPO_PUBLIC_API_URL, signal);
      if (version !== requestVersion.current || signal?.aborted) return;
      setCategories(data.categories);
      setServices(data.services);
    } catch (cause) {
      if (version !== requestVersion.current || signal?.aborted) return;
      setError(cause instanceof Error ? cause.message : 'Could not load services');
      // Never replace unavailable live data with fictitious catalog entries.
      if (initial) { setCategories([]); setServices([]); }
    } finally {
      if (version === requestVersion.current && !signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal, true);
    return () => { controller.abort(); requestVersion.current += 1; };
  }, [load]);

  const displayed = useMemo(
    () => filterServices(services, query, categoryId, sort, favoritesOnly, favorites),
    [services, query, categoryId, sort, favoritesOnly, favorites],
  );
  const selected = services.find((service) => service.id === selectedId) ?? null;
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const dateOptions = upcomingDays();
  const draftData: BookingInput | null = selected ? {
    serviceId: selected.id,
    serviceName: selected.name,
    basePricePaise: selected.basePricePaise,
    address,
    note,
    preferredDate,
    preferredTime,
  } : null;

  function navigate(next: Tab) {
    setTab(next); setScreen(null); setFormError('');
  }
  function explore(id: string | null = null, onlyFavorites = false) {
    setTab('explore'); setScreen(null); setCategoryId(id);
    setFavoritesOnly(onlyFavorites); setQuery('');
  }
  function toggleFavorite(id: string) {
    setFavorites((existing) => existing.includes(id) ? existing.filter((item) => item !== id) : [...existing, id]);
  }
  function openService(id: string) {
    setSelectedId(id); setScreen('service'); setFormError('');
  }
  function startRequest() {
    if (!selected) return;
    setAddress(''); setNote(''); setPreferredDate(upcomingDays()[0].id);
    setPreferredTime('11:00'); setFormError(''); setScreen('schedule');
  }
  function goBack() {
    if (screen === 'review') { setScreen('schedule'); return; }
    if (screen === 'schedule') { setScreen('service'); return; }
    setScreen(null);
  }
  useEffect(() => {
    if (!screen) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { goBack(); return true; });
    return () => subscription.remove();
  });

  function validateAndReview() {
    if (!draftData) return;
    const validation = validateDraft(draftData);
    if (validation) { setFormError(validation); return; }
    setFormError(''); setScreen('review');
  }
  function saveDraft() {
    if (!draftData) return;
    const validation = validateDraft(draftData);
    if (validation) { setFormError(validation); setScreen('schedule'); return; }
    setDrafts((existing) => [{
      id: `LOCAL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...draftData,
      address: draftData.address.trim(),
      note: draftData.note.trim(),
    }, ...existing]);
    setSelectedId(null); navigate('bookings');
  }
  function resumeDraft(draft: BookingDraft) {
    const exists = services.some((service) => service.id === draft.serviceId);
    if (!exists) return;
    setSelectedId(draft.serviceId); setAddress(draft.address); setNote(draft.note);
    setPreferredDate(dateOptions.some((day) => day.id === draft.preferredDate) ? draft.preferredDate : dateOptions[0].id);
    setPreferredTime(draft.preferredTime); setFormError(''); setScreen('schedule');
    setDrafts((items) => items.filter((item) => item.id !== draft.id));
  }

  const renderServices = (items: CatalogService[]) => items.map((item) =>
    <ServiceTile key={item.id} item={item} favorite={favorites.includes(item.id)}
      onOpen={() => openService(item.id)} onFavorite={() => toggleFavorite(item.id)} />,
  );
  const reload = () => { void load(); };
  const goToProfile = (name: Screen) => { setTab('profile'); setScreen(name); };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <AppShell tabs={tabs} currentTab={tab} onTabChange={navigate}
        scrollKey={`${tab}:${screen ?? 'root'}`} refreshing={refreshing} onRefresh={reload}>
        {screen ? (
          <>
            <Pressable style={styles.back} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
              <Icon name="arrow-back" color={colors.ink} size={20} />
              <AppText weight="semibold" size={14}>Back</AppText>
            </Pressable>
            {screen === 'service' && (selected ? (
              <>
                <View style={[styles.detailHero, { backgroundColor: selected.tint }]}>
                  <Icon name={selected.icon} color={colors.ink} size={78} />
                </View>
                <View style={styles.inlineBetween}>
                  <Badge label={selected.categoryName} tone="teal" />
                  <Pressable accessibilityRole="button" accessibilityLabel="Toggle saved service" onPress={() => toggleFavorite(selected.id)} style={styles.roundAction}>
                    <Icon name={favorites.includes(selected.id) ? 'heart' : 'heart-outline'} color={favorites.includes(selected.id) ? colors.danger : colors.ink} />
                  </Pressable>
                </View>
                <AppText weight="bold" size={28} style={{ marginTop: 12, lineHeight: 36 }}>{selected.name}</AppText>
                <AppText color={colors.inkSoft} style={{ marginTop: 12, lineHeight: 24 }}>{selected.description}</AppText>
                <SurfaceCard style={{ marginTop: 24 }}>
                  <View style={styles.inlineBetween}>
                    <View style={{ gap: 7 }}>
                      <AppText color={colors.muted} size={12}>{selected.pricingType === 'FIXED' ? 'BASE SERVICE PRICE' : 'INSPECTION STARTING PRICE'}</AppText>
                      <AppText weight="bold" size={26}>{priceLabel(selected.basePricePaise)}</AppText>
                    </View>
                    <View style={styles.iconCircle}><Icon name="time-outline" color={colors.primary} size={24} /></View>
                  </View>
                  <View style={styles.separator} />
                  <AppText color={colors.inkSoft} size={13}>Estimated duration: {selected.durationMinutes} minutes</AppText>
                </SurfaceCard>
                <SectionHeading title="How it works" />
                {benefits.map((benefit, index) => (
                  <View key={benefit.heading} style={styles.step}>
                    <View style={styles.stepNumber}><AppText weight="bold" color={colors.primary}>{index + 1}</AppText></View>
                    <View style={{ flex: 1, gap: 5 }}>
                      <AppText weight="bold">{benefit.heading}</AppText>
                      <AppText size={12} color={colors.muted} style={{ lineHeight: 19 }}>{benefit.caption}</AppText>
                    </View>
                  </View>
                ))}
                <Notice>Prices come from the live catalog. The next step saves a draft, not an actual booking.</Notice>
                <AppButton label="Create request preview" icon="arrow-forward-outline" onPress={startRequest} />
              </>
            ) : (
              <EmptyState icon="alert-circle-outline" title="Service unavailable" detail="The service may have been archived. Refresh the catalog to review active options." action="Explore services" onAction={() => explore()} />
            ))}
            {screen === 'schedule' && (
              <>
                <PageHeader kicker="Request preview · Step 1 of 2" title="Your preferred visit"
                  description="Choose a date, time and address. No provider availability is confirmed yet." />
                <SurfaceCard>
                  <View style={styles.inlineBetween}>
                    <AppText weight="bold">{selected?.name ?? 'Service unavailable'}</AppText>
                    <AppText weight="bold" color={colors.primary}>{selected ? priceLabel(selected.basePricePaise) : ''}</AppText>
                  </View>
                </SurfaceCard>
                <SectionHeading title="Choose a day" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
                  {dateOptions.map((day) => (
                    <Pressable key={day.id} onPress={() => setPreferredDate(day.id)}
                      accessibilityRole="button" accessibilityState={{ selected: preferredDate === day.id }}
                      style={[styles.dayCard, preferredDate === day.id && styles.dayCardActive]}>
                      <AppText color={preferredDate === day.id ? '#fff' : colors.muted} size={12}>{day.day}</AppText>
                      <AppText color={preferredDate === day.id ? '#fff' : colors.ink} size={23} weight="bold">{day.number}</AppText>
                    </Pressable>
                  ))}
                </ScrollView>
                <SectionHeading title="Preferred arrival time" />
                <View style={styles.timeGrid}>
                  {TIME_OPTIONS.map((time) => (
                    <Pressable key={time.value} accessibilityRole="button" accessibilityState={{ selected: preferredTime === time.value }}
                      onPress={() => setPreferredTime(time.value)} style={[styles.timeChip, preferredTime === time.value && styles.timeChipActive]}>
                      <Icon name="time-outline" size={17} color={preferredTime === time.value ? colors.primary : colors.muted} />
                      <AppText color={preferredTime === time.value ? colors.primary : colors.inkSoft} weight="semibold" size={13}>{time.label}</AppText>
                    </Pressable>
                  ))}
                </View>
                <SectionHeading title="Service address" />
                <TextInput style={styles.textArea} multiline maxLength={240} value={address}
                  onChangeText={(value) => { setAddress(value); setFormError(''); }}
                  placeholder="Flat / house number, building, road and area"
                  accessibilityLabel="Service address" placeholderTextColor={colors.muted} />
                <AppText color={colors.muted} size={11} style={{ marginTop: -8, marginBottom: 14 }}>{address.length}/240 characters</AppText>
                <AppText weight="bold" style={{ marginBottom: 10 }}>Describe the issue (optional)</AppText>
                <TextInput style={styles.textArea} multiline maxLength={500} value={note} onChangeText={setNote}
                  placeholder="What needs repairing, cleaning or checking?"
                  accessibilityLabel="Problem description" placeholderTextColor={colors.muted} />
                {formError ? <AppText color={colors.danger} size={13} style={{ marginBottom: 12 }}>{formError}</AppText> : null}
                <Notice>The time is a preference only. Booking submission and provider confirmation are not available in Phase 06.</Notice>
                <AppButton label="Review request" icon="arrow-forward-outline" onPress={validateAndReview} disabled={!selected} />
              </>
            )}
            {screen === 'review' && draftData && (
              <>
                <PageHeader kicker="Request preview · Step 2 of 2" title="Review the details"
                  description="Check your information before saving a local draft." />
                <SurfaceCard>
                  {[
                    { label: 'SERVICE', value: draftData.serviceName },
                    { label: 'PREFERRED VISIT', value: formatPreferredSlot(draftData) },
                    { label: 'SERVICE ADDRESS', value: draftData.address.trim() },
                    { label: 'PROBLEM', value: draftData.note.trim() || 'No extra details' },
                  ].map((item, index) => (
                    <View key={item.label}>
                      {index > 0 && <View style={styles.separator} />}
                      <AppText color={colors.muted} size={11} weight="bold">{item.label}</AppText>
                      <AppText style={{ marginTop: 7, lineHeight: 22 }} weight="semibold">{item.value}</AppText>
                    </View>
                  ))}
                  <View style={styles.separator} />
                  <View style={styles.inlineBetween}>
                    <AppText color={colors.inkSoft}>Catalog starting price</AppText>
                    <AppText weight="bold" size={22}>{priceLabel(draftData.basePricePaise)}</AppText>
                  </View>
                </SurfaceCard>
                <Notice>No service provider will be notified. Saving creates an in-memory draft only; no booking is submitted, charged or confirmed.</Notice>
                <AppButton label="Save local request draft" icon="bookmark-outline" onPress={saveDraft} />
                <View style={{ marginTop: 8 }}><AppButton variant="quiet" label="Edit details" onPress={() => setScreen('schedule')} /></View>
              </>
            )}
            {screen === 'favorites' && (
              <>
                <PageHeader kicker="Your shortlist" title="Saved services" description="A temporary shortlist for this app session." />
                {renderServices(services.filter((service) => favorites.includes(service.id)))}
                {!services.some((service) => favorites.includes(service.id)) && <EmptyState icon="heart-outline" title="Nothing saved yet" detail="Use the heart on a service to add it here." action="Explore services" onAction={() => explore()} />}
                <Notice>Saved services are held in app memory and disappear after a restart.</Notice>
              </>
            )}
            {screen === 'addresses' && (
              <>
                <PageHeader kicker="Account settings" title="My addresses" description="Saved addresses and location selection arrive in Phase 07." />
                <EmptyState icon="location-outline" title="No saved addresses" detail="You can type an address in the request preview. Your address book is not connected yet." />
                <Notice>Location permission is not requested by this phase.</Notice>
              </>
            )}
            {screen === 'payments' && (
              <>
                <PageHeader kicker="Payments" title="Payment history" description="Track transactions here when payments launch." />
                <EmptyState icon="wallet-outline" title="No transactions" detail="The application is not processing payments yet. No request draft creates a charge." />
              </>
            )}
            {screen === 'support' && (
              <>
                <PageHeader kicker="Help centre" title="Common questions" description="Answers about the current application and planned booking experience." />
                {faqs.map((faq, index) => (
                  <SurfaceCard key={faq.title}>
                    <Pressable accessibilityRole="button" accessibilityState={{ expanded: faqExpanded === index }}
                      style={styles.inlineBetween} onPress={() => setFaqExpanded(faqExpanded === index ? null : index)}>
                      <View style={{ flex: 1 }}><AppText weight="bold">{faq.title}</AppText></View>
                      <Icon name={faqExpanded === index ? 'chevron-up' : 'chevron-down'} color={colors.muted} size={20} />
                    </Pressable>
                    {faqExpanded === index && <AppText style={{ marginTop: 14, lineHeight: 21 }} size={13} color={colors.inkSoft}>{faq.body}</AppText>}
                  </SurfaceCard>
                ))}
                <Notice>Live customer-support tickets and messaging are not enabled in this phase.</Notice>
              </>
            )}
            {screen === 'privacy' && (
              <>
                <PageHeader kicker="Account & security" title="Privacy overview" description="What this version stores, and what it does not." />
                <SurfaceCard>
                  {[
                    ['Phone verification', 'Your phone number is used for OTP sign-in through the platform API.'],
                    ['Session security', 'The app stores a refresh token in encrypted device storage.'],
                    ['Request previews', 'Addresses, notes and draft requests are kept in app memory only until you close or restart the app.'],
                    ['Payments and location', 'No payments are charged and device GPS access is not requested in this phase.'],
                  ].map(([title, description], index) => (
                    <View key={title}>
                      {index > 0 && <View style={styles.separator} />}
                      <AppText weight="bold">{title}</AppText>
                      <AppText size={13} color={colors.inkSoft} style={{ lineHeight: 21, marginTop: 6 }}>{description}</AppText>
                    </View>
                  ))}
                </SurfaceCard>
                <Notice>This screen is a feature overview, not a substitute for a published legal privacy policy.</Notice>
                <AppButton variant="secondary" label="Sign out" icon="log-out-outline" onPress={() => { void logout(); }} />
              </>
            )}
          </>
        ) : tab === 'home' ? (
          <>
            <View style={styles.homeTop}>
              <View style={{ gap: 7, flex: 1 }}>
                <AppText size={12} color={colors.inkSoft}>HOME SERVICES / CUSTOMER</AppText>
                <AppText weight="bold" size={27}>What needs attention?</AppText>
              </View>
              <Pressable style={styles.roundAction} onPress={() => setScreen('favorites')} accessibilityRole="button" accessibilityLabel="Saved services">
                <Icon name="heart-outline" color={colors.primary} size={22} />
              </Pressable>
            </View>
            <View style={styles.locationNote}>
              <Icon name="location-outline" color={colors.teal} size={18} />
              <AppText size={12} color={colors.inkSoft} style={{ flex: 1 }}>Location setup available in Phase 07</AppText>
              <Badge label="Coming soon" tone="neutral" />
            </View>
            <View style={styles.hero}>
              <View style={{ flex: 1, gap: 12 }}>
                <AppText size={11} weight="bold" color="#A9DFE5" style={{ letterSpacing: 1.3 }}>YOUR HOME. YOUR WAY.</AppText>
                <AppText size={26} weight="bold" color="#FFFFFF" style={{ lineHeight: 33 }}>The right service, without the guesswork.</AppText>
                <AppText size={13} color="#D2DEEF" style={{ lineHeight: 21 }}>Explore current services and prepare a request in a few steps.</AppText>
              </View>
              <View style={styles.heroSymbol}><Icon name="home-outline" size={44} color="#FFFFFF" /></View>
            </View>
            <SearchField value={query} onChangeText={(value) => { explore(); setQuery(value); }} placeholder="What service do you need?" />
            {error && <Notice>{error}.</Notice>}
            {error && <AppButton compact variant="secondary" label="Retry catalog" icon="refresh-outline" onPress={reload} />}
            {loading && <AppText color={colors.muted} size={13}>Loading services from the catalog...</AppText>}
            <SectionHeading title="Find a category" action="View all" onAction={() => explore()} />
            <View style={styles.categories}>
              {categories.map((category) => <CategoryTile key={category.id} item={category} onPress={() => explore(category.id)} />)}
            </View>
            {!loading && !error && categories.length === 0 && <EmptyState icon="grid-outline" title="No categories published" detail="The catalog is empty. New categories will appear here after an admin publishes them." />}
            <SectionHeading title="Explore services" action="See all" onAction={() => explore()} />
            {renderServices(services.slice(0, 3))}
            {!loading && !error && !services.length && <EmptyState icon="construct-outline" title="No services available" detail="Check again after the catalog has been updated." />}
            <Notice>These are live catalog listings. Request submission, availability and payments are not yet enabled.</Notice>
          </>
        ) : tab === 'explore' ? (
          <>
            <PageHeader kicker="Service discovery" title="Browse services" description="Search by problem or service, then review details and pricing." actionIcon="refresh-outline" onAction={reload} />
            <SearchField value={query} onChangeText={setQuery} placeholder="Search cleaning, plumbing, AC..." />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 18 }} contentContainerStyle={{ gap: 9 }}>
              <Pressable onPress={() => setCategoryId(null)} style={[styles.filter, !categoryId && styles.filterActive]}>
                <AppText size={12} weight="semibold" color={!categoryId ? '#FFFFFF' : colors.inkSoft}>All</AppText>
              </Pressable>
              {categories.map((category) => (
                <Pressable key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.filter, categoryId === category.id && styles.filterActive]}>
                  <AppText size={12} weight="semibold" color={categoryId === category.id ? '#FFFFFF' : colors.inkSoft}>{category.name}</AppText>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.inlineBetween}>
              <AppText size={12} color={colors.inkSoft}>{selectedCategory?.name ?? 'All categories'} · {displayed.length} result{displayed.length === 1 ? '' : 's'}</AppText>
              <Pressable style={styles.savedToggle} onPress={() => setFavoritesOnly(!favoritesOnly)} accessibilityRole="button">
                <Icon name={favoritesOnly ? 'heart' : 'heart-outline'} size={17} color={favoritesOnly ? colors.danger : colors.primary} />
                <AppText size={12} color={colors.primary} weight="semibold">{favoritesOnly ? 'Saved only' : 'Saved'}</AppText>
              </Pressable>
            </View>
            <View style={styles.sortRow}>
              {([
                { id: 'name', label: 'A to Z' },
                { id: 'price-low', label: 'Price: low' },
                { id: 'price-high', label: 'Price: high' },
              ] as const).map((mode) => (
                <Pressable key={mode.id} accessibilityRole="button" accessibilityState={{ selected: sort === mode.id }}
                  style={[styles.sortChip, sort === mode.id && styles.sortActive]} onPress={() => setSort(mode.id)}>
                  <AppText size={12} weight="semibold" color={sort === mode.id ? colors.primary : colors.muted}>{mode.label}</AppText>
                </Pressable>
              ))}
            </View>
            {error && <Notice>{error}. Swipe down or use refresh to retry.</Notice>}
            {loading && <AppText color={colors.muted}>Loading live catalog...</AppText>}
            {renderServices(displayed)}
            {!loading && !error && displayed.length === 0 &&
              <EmptyState icon={favoritesOnly ? 'heart-outline' : 'search-outline'} title="No matching services"
                detail={favoritesOnly ? 'Save services using the heart icon, or show all services.' : 'Try another keyword or category.'}
                action="Clear filters" onAction={() => { setQuery(''); setCategoryId(null); setFavoritesOnly(false); }} />}
            <Notice>Availability and final service costs are confirmed only after live booking workflows are implemented.</Notice>
          </>
        ) : tab === 'bookings' ? (
          <>
            <PageHeader kicker="Requests" title="My request drafts" description="Review or edit requests prepared during this app session." />
            <Notice>Drafts are not bookings. No service provider will be notified or charged.</Notice>
            {drafts.length === 0 && <EmptyState icon="document-text-outline" title="No drafts yet"
              detail="Choose a service, fill in the request form, and save a preview here."
              action="Browse services" onAction={() => explore()} />}
            {drafts.map((draft) => {
              const available = services.some((item) => item.id === draft.serviceId);
              return (
                <SurfaceCard key={draft.id}>
                  <View style={styles.inlineBetween}><Badge label="Local draft" tone="amber" /><AppText color={colors.muted} size={11}>{draft.id.slice(-6)}</AppText></View>
                  <AppText weight="bold" size={17} style={{ marginTop: 15 }}>{draft.serviceName}</AppText>
                  <View style={styles.rowIcon}><Icon name="calendar-outline" color={colors.primary} size={17} /><AppText color={colors.inkSoft} size={13}>{formatPreferredSlot(draft)}</AppText></View>
                  <View style={styles.rowIcon}><Icon name="location-outline" color={colors.muted} size={17} /><AppText color={colors.inkSoft} size={13} style={{ flex: 1 }}>{draft.address}</AppText></View>
                  <View style={styles.separator} />
                  <View style={styles.inlineBetween}><AppText weight="bold">{priceLabel(draft.basePricePaise)}</AppText><AppText color={colors.muted} size={11}>Captured from catalog at draft time</AppText></View>
                  <View style={[styles.inlineBetween, { marginTop: 15, gap: 10 }]}>
                    <View style={{ flex: 1 }}><AppButton variant="secondary" compact label={available ? 'Edit draft' : 'Service unavailable'} disabled={!available} onPress={() => resumeDraft(draft)} /></View>
                    <Pressable style={styles.deleteDraft} onPress={() => setDrafts((items) => items.filter((item) => item.id !== draft.id))} accessibilityRole="button" accessibilityLabel="Delete local draft">
                      <Icon name="trash-outline" color={colors.danger} size={20} />
                    </Pressable>
                  </View>
                </SurfaceCard>
              );
            })}
            <Notice>These drafts disappear when the app restarts or you sign out. Live booking history will replace this preview in a later phase.</Notice>
          </>
        ) : (
          <>
            <PageHeader kicker="Your account" title="Profile & settings" description="Manage sign-in and explore account tools." />
            <SurfaceCard style={styles.accountCard}>
              <View style={styles.profileAvatar}><Icon name="person-outline" color={colors.primary} size={29} /></View>
              <View style={{ flex: 1, gap: 7 }}>
                <AppText weight="bold" size={18}>Customer account</AppText>
                <AppText size={13} color={colors.inkSoft}>{user.phone}</AppText>
                <Badge label="Phone verified" tone="teal" />
              </View>
            </SurfaceCard>
            <SectionHeading title="Your services" />
            {([
              { title: 'Saved services', icon: 'heart-outline', screen: 'favorites', sub: 'Your current shortlist' },
              { title: 'Saved addresses', icon: 'location-outline', screen: 'addresses', sub: 'Coming in Phase 07' },
              { title: 'Payment history', icon: 'card-outline', screen: 'payments', sub: 'Available after payments launch' },
              { title: 'Help & FAQs', icon: 'help-circle-outline', screen: 'support', sub: 'Answers about this app' },
              { title: 'Privacy and security', icon: 'shield-checkmark-outline', screen: 'privacy', sub: 'Data and session details' },
            ] as { title: string; icon: IconName; screen: Screen; sub: string }[]).map((item) => (
              <Pressable key={item.title} accessibilityRole="button" style={styles.profileRow} onPress={() => goToProfile(item.screen)}>
                <View style={styles.profileIcon}><Icon name={item.icon} color={colors.primary} size={21} /></View>
                <View style={{ flex: 1, gap: 5 }}>
                  <AppText weight="semibold">{item.title}</AppText>
                  <AppText color={colors.muted} size={12}>{item.sub}</AppText>
                </View>
                <Icon name="chevron-forward" color={colors.muted} size={18} />
              </Pressable>
            ))}
            <View style={{ marginTop: 19 }}><AppButton label="Sign out" icon="log-out-outline" variant="secondary" onPress={() => { void logout(); }} /></View>
            <AppText size={11} color={colors.muted} style={{ textAlign: 'center', marginTop: 22 }}>Home Services · Customer UI Phase 06</AppText>
          </>
        )}
      </AppShell>
    </>
  );
}

export default function App() {
  return <MobileAuthGate role="CUSTOMER"><CustomerApp /></MobileAuthGate>;
}

const styles = StyleSheet.create({
  homeTop: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 12 },
  inlineBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  locationNote: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 17, marginBottom: 22 },
  hero: { backgroundColor: colors.dark, borderRadius: radii.xl, padding: 23, flexDirection: 'row', alignItems: 'center', minHeight: 218, marginBottom: 18 },
  heroSymbol: { width: 74, height: 84, backgroundColor: '#29436D', borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginLeft: 8, transform: [{ rotate: '9deg' }] },
  roundAction: { width: 45, height: 45, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  categories: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginTop: 4, marginBottom: 5 },
  categoryTile: { width: '33.333%', paddingHorizontal: 5, alignItems: 'center', gap: 9, marginBottom: 20, minHeight: 111 },
  categoryIcon: { alignItems: 'center', justifyContent: 'center', width: '100%', height: 77, borderRadius: 18 },
  serviceCard: { flexDirection: 'row', alignItems: 'center', padding: 13, gap: 6 },
  serviceMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 94 },
  serviceArt: { width: 72, height: 84, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  favoriteButton: { width: 35, height: 45, alignItems: 'center', justifyContent: 'center' },
  back: { paddingVertical: 10, flexDirection: 'row', gap: 9, alignItems: 'center', marginBottom: 15 },
  detailHero: { minHeight: 208, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  iconCircle: { width: 49, height: 49, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight },
  separator: { height: 1, backgroundColor: colors.border, marginVertical: 17 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  stepNumber: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  days: { gap: 10, paddingBottom: 5 },
  dayCard: { width: 61, height: 86, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 8 },
  dayCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 6 },
  timeChip: { width: '48%', minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 13 },
  timeChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  textArea: { minHeight: 96, textAlignVertical: 'top', borderColor: colors.border, borderWidth: 1, backgroundColor: colors.surface, borderRadius: radii.md, padding: 15, fontSize: 14, color: colors.ink, marginBottom: 18 },
  emptyState: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 26, marginTop: 16 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight, marginBottom: 16 },
  emptyText: { textAlign: 'center', lineHeight: 20, marginTop: 11, marginBottom: 17 },
  filter: { paddingHorizontal: 15, paddingVertical: 11, borderRadius: 22, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sortRow: { flexDirection: 'row', gap: 7, marginBottom: 17, marginTop: 12, flexWrap: 'wrap' },
  sortChip: { borderColor: colors.border, borderWidth: 1, backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  sortActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  savedToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 9 },
  rowIcon: { flexDirection: 'row', gap: 9, alignItems: 'center', marginTop: 11 },
  deleteDraft: { height: 41, width: 41, borderRadius: 11, backgroundColor: colors.dangerLight, alignItems: 'center', justifyContent: 'center' },
  accountCard: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 23 },
  profileAvatar: { width: 71, height: 71, borderRadius: 23, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  profileRow: { minHeight: 75, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 15, flexDirection: 'row', gap: 13, alignItems: 'center', marginBottom: 9, padding: 14 },
  profileIcon: { height: 44, width: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight },
});

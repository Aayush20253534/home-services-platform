import type { ComponentProps, ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radii, spacing } from '@home-services/design-tokens';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Icon({
  name,
  color = colors.ink,
  size = 20,
}: {
  name: IconName;
  color?: string;
  size?: number;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

export function AppText({
  children,
  size = 15,
  weight = 'regular',
  color = colors.ink,
  style,
}: {
  children: ReactNode;
  size?: number;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: string;
  style?: StyleProp<import('react-native').TextStyle>;
}) {
  const fontWeight = { regular: '400', medium: '500', semibold: '600', bold: '700' } as const;
  return <Text style={[{ fontSize: size, color, fontWeight: fontWeight[weight] }, style]}>{children}</Text>;
}

export function AppButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'quiet';
  disabled?: boolean;
  compact?: boolean;
}) {
  const secondary = variant === 'secondary';
  const quiet = variant === 'quiet';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        { backgroundColor: quiet ? 'transparent' : secondary ? colors.primaryLight : colors.primary },
        disabled && { opacity: 0.45 },
        pressed && !disabled && { opacity: 0.8 },
      ]}
    >
      {icon && <Icon name={icon} size={17} color={secondary || quiet ? colors.primary : '#FFFFFF'} />}
      <AppText weight="bold" size={compact ? 13 : 14} color={secondary || quiet ? colors.primary : '#FFFFFF'}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function SurfaceCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({
  label,
  tone = 'blue',
}: {
  label: string;
  tone?: 'blue' | 'teal' | 'amber' | 'danger' | 'neutral';
}) {
  const tones = {
    blue: [colors.primaryLight, colors.primary],
    teal: [colors.tealLight, colors.teal],
    amber: [colors.amberLight, colors.amber],
    danger: [colors.dangerLight, colors.danger],
    neutral: [colors.surfaceAlt, colors.inkSoft],
  };
  const [backgroundColor, textColor] = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <AppText size={11} weight="bold" color={textColor}>{label}</AppText>
    </View>
  );
}

export function SectionHeading({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeading}>
      <AppText weight="bold" size={19}>{title}</AppText>
      {action && onAction && (
        <Pressable onPress={onAction} accessibilityRole="button">
          <AppText size={13} color={colors.primary} weight="semibold">{action}  →</AppText>
        </Pressable>
      )}
    </View>
  );
}

export function SearchField({
  value,
  onChangeText,
  placeholder = 'Search services',
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.search}>
      <Icon name="search-outline" size={20} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} accessibilityLabel="Clear search">
          <Icon name="close-circle" color={colors.muted} size={19} />
        </Pressable>
      )}
    </View>
  );
}

export type TabDefinition<T extends string> = {
  id: T;
  title: string;
  icon: IconName;
};

export function AppShell<T extends string>({
  children,
  tabs,
  currentTab,
  onTabChange,
  scrollKey,
  refreshing = false,
  onRefresh,
}: {
  children: ReactNode;
  tabs: readonly TabDefinition<T>[];
  currentTab: T;
  onTabChange: (tab: T) => void;
  scrollKey?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  return (
    <SafeAreaView style={styles.shell}>
      <ScrollView
        key={scrollKey}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.content}>{children}</View>
      </ScrollView>
      <View style={styles.nav}>
        {tabs.map((tab) => {
          const active = tab.id === currentTab;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={styles.navItem}
            >
              <View style={[styles.navIcon, active && styles.navIconActive]}>
                <Icon name={tab.icon} size={21} color={active ? colors.primary : colors.muted} />
              </View>
              <AppText size={10} weight={active ? 'bold' : 'medium'} color={active ? colors.primary : colors.muted}>
                {tab.title}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export function PageHeader({
  kicker,
  title,
  description,
  actionIcon,
  onAction,
}: {
  kicker: string;
  title: string;
  description?: string;
  actionIcon?: IconName;
  onAction?: () => void;
}) {
  return (
    <View style={styles.pageHeader}>
      <View style={{ flex: 1, gap: 7 }}>
        <AppText size={11} weight="bold" color={colors.teal} style={{ letterSpacing: 1.5 }}>
          {kicker.toUpperCase()}
        </AppText>
        <AppText size={27} weight="bold" style={{ letterSpacing: -0.7 }}>{title}</AppText>
        {description && <AppText size={13} color={colors.inkSoft} style={{ lineHeight: 20 }}>{description}</AppText>}
      </View>
      {actionIcon && onAction && (
        <Pressable onPress={onAction} style={styles.headerAction} accessibilityRole="button">
          <Icon name={actionIcon} color={colors.ink} />
        </Pressable>
      )}
    </View>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <View style={styles.notice}>
      <Icon name="information-circle-outline" color={colors.primary} size={18} />
      <AppText color={colors.inkSoft} size={12} style={{ flex: 1, lineHeight: 19 }}>{children}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: 28 },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 7,
    minHeight: 64,
  },
  navItem: { flex: 1, alignItems: 'center', gap: 3 },
  navIcon: { width: 42, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill },
  navIconActive: { backgroundColor: colors.primaryLight },
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  headerAction: {
    width: 42, height: 42, borderRadius: 15, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center',
  },
  button: { minHeight: 48, borderRadius: radii.md, paddingHorizontal: 17, paddingVertical: 13, gap: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonCompact: { minHeight: 38, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 11 },
  card: {
    padding: 18, backgroundColor: colors.surface, borderRadius: radii.lg,
    borderColor: colors.border, borderWidth: 1, marginBottom: 12,
    elevation: 1, shadowColor: '#162B52', shadowOpacity: 0.035, shadowRadius: 14, shadowOffset: { width: 0, height: 5 },
  },
  badge: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 10, borderRadius: radii.pill },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 15 },
  search: { flexDirection: 'row', gap: 10, alignItems: 'center', borderRadius: radii.md, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, paddingHorizontal: 16, minHeight: 53 },
  input: { flex: 1, color: colors.ink, fontSize: 14, paddingVertical: 12 },
  notice: { backgroundColor: colors.primaryLight, borderRadius: radii.md, padding: 13, flexDirection: 'row', gap: 10, marginBottom: 16 },
});

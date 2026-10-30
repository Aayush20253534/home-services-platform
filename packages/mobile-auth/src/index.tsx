import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView,
  ScrollView, StyleSheet, TextInput, View,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { AppButton, AppText, Icon, Notice, SurfaceCard } from '@home-services/mobile-ui';
import { colors, radii } from '@home-services/design-tokens';

type MobileRole = 'CUSTOMER' | 'PROVIDER';
type User = { id: string; phone: string; role: MobileRole };
type SessionResponse = {
  accessToken: string; refreshToken: string; expiresIn: number;
  user: User;
};
type AuthContextValue = {
  user: User;
  accessToken: string;
  logout: () => Promise<void>;
};
const SessionContext = createContext<AuthContextValue | null>(null);
const REFRESH_KEY = 'home-services-refresh-token';

async function authRequest<T>(endpoint: string, payload: unknown, token?: string): Promise<T> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!apiUrl) throw new Error('Set EXPO_PUBLIC_API_URL in the app environment.');
  const response = await fetch(`${apiUrl}/auth/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const info = body as { message?: string | string[] };
    const message = Array.isArray(info.message) ? info.message.join(', ') : info.message;
    throw new Error(message ?? 'Unable to connect to the authentication service.');
  }
  return body as T;
}

export function useMobileAuth(): AuthContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useMobileAuth requires a MobileAuthGate');
  return context;
}

export function MobileAuthGate({ role, children }: { role: MobileRole; children: ReactNode }) {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const storeSession = useCallback(async (next: SessionResponse) => {
    if (next.user.role !== role) throw new Error('Incorrect account role');
    await SecureStore.setItemAsync(REFRESH_KEY, next.refreshToken);
    setSession(next);
  }, [role]);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const token = await SecureStore.getItemAsync(REFRESH_KEY);
        if (token) {
          const next = await authRequest<SessionResponse>('refresh', { refreshToken: token });
          if (active && next.user.role === role) await storeSession(next);
          else if (active) await SecureStore.deleteItemAsync(REFRESH_KEY);
        }
      } catch {
        if (active) await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => undefined);
      } finally {
        if (active) setLoading(false);
      }
    };
    void restore();
    return () => { active = false; };
  }, [role, storeSession]);

  const logout = useCallback(async () => {
    const existing = session;
    setSession(null);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    if (existing) await authRequest('logout', {}, existing.accessToken).catch(() => undefined);
  }, [session]);

  const context = useMemo<AuthContextValue | null>(
    () => session ? { user: session.user, accessToken: session.accessToken, logout } : null,
    [session, logout],
  );

  async function sendCode() {
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      setError('Enter a phone number in international format, such as +919876543210.');
      return;
    }
    setBusy(true); setError(null);
    try {
      const result = await authRequest<{ challengeId: string }>('request-otp', { phone, role });
      setChallengeId(result.challengeId);
      setCode('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send code');
    } finally { setBusy(false); }
  }

  async function verifyCode() {
    if (!challengeId || !/^\d{6}$/.test(code)) return;
    setBusy(true); setError(null);
    try {
      const result = await authRequest<SessionResponse>('verify-otp', { phone, role, code, challengeId });
      await storeSession(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally { setBusy(false); }
  }

  if (loading) return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /><AppText color={colors.inkSoft}>Checking your session...</AppText></View>
    </SafeAreaView>
  );
  if (context) return <SessionContext.Provider value={context}>{children}</SessionContext.Provider>;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}><Icon name="shield-checkmark-outline" color="#FFFFFF" size={28} /></View>
          <AppText color={colors.teal} size={12} weight="bold" style={{ letterSpacing: 1.4 }}>HOME SERVICES</AppText>
          <AppText size={31} weight="bold" style={{ marginTop: 13 }}>
            {role === 'CUSTOMER' ? 'Welcome home.' : 'Your work starts here.'}
          </AppText>
          <AppText color={colors.inkSoft} style={{ marginTop: 13, marginBottom: 26, lineHeight: 23 }}>
            Sign in with a one-time verification code to access your {role === 'CUSTOMER' ? 'service bookings' : 'provider workspace'}.
          </AppText>
          <SurfaceCard style={{ paddingVertical: 23 }}>
            <AppText weight="bold" size={14} style={{ marginBottom: 13 }}>Phone number</AppText>
            <TextInput
              accessibilityLabel="Phone number"
              style={styles.input}
              value={phone}
              onChangeText={(value) => { setPhone(value.trim()); setChallengeId(null); setError(null); }}
              placeholder="+919876543210"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              autoComplete="tel"
              editable={!busy}
            />
            {challengeId && (
              <>
                <AppText weight="bold" size={14} style={{ marginTop: 22, marginBottom: 13 }}>6-digit verification code</AppText>
                <TextInput
                  accessibilityLabel="One-time verification code"
                  style={styles.input}
                  value={code}
                  onChangeText={setCode}
                  placeholder="123456"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoComplete="one-time-code"
                  editable={!busy}
                />
              </>
            )}
            {error && <AppText size={12} color={colors.danger} style={{ marginVertical: 14 }}>{error}</AppText>}
            <View style={{ marginTop: 20 }}>
              <AppButton label={busy ? 'Processing...' : challengeId ? 'Verify and continue' : 'Send verification code'}
                onPress={() => { void (challengeId ? verifyCode() : sendCode()); }}
                disabled={busy || (challengeId ? code.length !== 6 : phone.length < 9)} />
            </View>
            {challengeId && <View style={{ marginTop: 9 }}><AppButton variant="quiet" compact label="Use a different number" onPress={() => { setChallengeId(null); setCode(''); setError(null); }} /></View>}
          </SurfaceCard>
          <Notice>Verification requires a configured SMS provider. The local developer OTP mode prints codes only in the API terminal.</Notice>
          <AppText size={11} color={colors.muted} style={{ textAlign: 'center', marginTop: 18 }}>
            Authentication protects your account. Service data remains in preview mode until later phases.
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 23, paddingTop: 70, paddingBottom: 32 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 15 },
  brand: { width: 65, height: 65, backgroundColor: colors.primary, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  input: { borderColor: colors.border, borderWidth: 1, borderRadius: radii.md, backgroundColor: colors.surfaceAlt, paddingHorizontal: 15, minHeight: 52, color: colors.ink, fontSize: 15 },
});

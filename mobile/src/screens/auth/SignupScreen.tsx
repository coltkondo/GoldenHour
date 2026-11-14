import React, { useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Text, TextInput } from '../../components/ui/AppText';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useLocationPermission } from '../../context/LocationPermissionContext';
import { authAPI } from '../../api/endpoints';
import { AppIcon } from '../../components/icons';
import { apiErrorMessage } from '../../utils/apiError';
import { GuestMarketPicker } from '../../components/GuestMarketPicker';

// Backend's OUTSIDE_AREA_DETAIL (backend/app/api/v1/auth.py); keep in sync.
function isOutsideAreaError(err: any): boolean {
  const detail = err?.response?.data?.detail;
  return (
    err?.response?.status === 422 &&
    typeof detail === 'string' &&
    /available in your area/i.test(detail)
  );
}

export const SignupScreen = () => {
  const { theme } = useTheme();
  const d = theme.derived;
  const { login } = useAuth();
  const { ensureLocationPermission } = useLocationPermission();
  const navigation = useNavigation<any>();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Location is optional (App Review 5.1.1): if it's declined, unavailable, or
  // outside every market, ask which city instead of blocking sign-up.
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const coordsRef = useRef<{ latitude: number; longitude: number } | null>(null);

  async function handleSignup() {
    setError('');
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!email.trim().includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one digit');
      return;
    }
    // Must match backend/app/schemas/user.py, or the server rejects it with a 422.
    if (!/[!@#$%^&*()\-_=+\[\]{}|;:',.<>?/\\`~]/.test(password)) {
      setError('Password must contain at least one special character');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    await register();
  }

  async function register(marketSlug?: string) {
    setError('');
    setLoading(true);
    try {
      if (!marketSlug) {
        coordsRef.current = null;
        const { status: permStatus } = await ensureLocationPermission();
        if (permStatus === 'granted') {
          try {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            coordsRef.current = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            };
          } catch {
            // GPS unavailable: fall through to the city picker
          }
        }
        if (!coordsRef.current) {
          setCityPickerVisible(true);
          return;
        }
      }
      const data = await authAPI.register({
        username: username.trim(),
        email: email.trim(),
        password,
        ...(coordsRef.current ?? {}),
        ...(marketSlug ? { market_slug: marketSlug } : {}),
      });
      await login(data.access_token, data.user);
      navigation.navigate('Main');
    } catch (err: any) {
      if (!marketSlug && isOutsideAreaError(err)) {
        setCityPickerVisible(true);
        return;
      }
      setError(apiErrorMessage(err, 'Sign up failed — try again'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: d.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText, { color: d.text }]}>GLDNHR</Text>
        </View>

        <Text style={[styles.title, { color: d.text }]}>Join Golden Hour</Text>
        <Text style={[styles.subtitle, { color: d.textMuted }]}>
          Help build your city's happy hour map
        </Text>

        {error ? (
          <View
            style={[
              styles.errorBox,
              { backgroundColor: `${brand.error}15`, borderColor: `${brand.error}40` },
            ]}
          >
            <Text style={[styles.errorText, { color: brand.error }]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View
            style={[styles.inputContainer, { backgroundColor: d.surface, borderColor: d.border }]}
          >
            <TextInput
              style={[styles.input, { color: d.text }]}
              placeholder="Username"
              placeholderTextColor={d.textHint}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View
            style={[styles.inputContainer, { backgroundColor: d.surface, borderColor: d.border }]}
          >
            <TextInput
              style={[styles.input, { color: d.text }]}
              placeholder="Email"
              placeholderTextColor={d.textHint}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              autoComplete="email"
            />
          </View>
          <View
            style={[styles.inputContainer, { backgroundColor: d.surface, borderColor: d.border }]}
          >
            <TextInput
              style={[styles.input, { color: d.text }]}
              placeholder="Password (8+ chars, upper, lower, digit, special)"
              placeholderTextColor={d.textHint}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              autoComplete="new-password"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword((s) => !s)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppIcon name={showPassword ? 'eyeSlash' : 'eye'} size={20} role="muted" />
            </TouchableOpacity>
          </View>
          <View
            style={[styles.inputContainer, { backgroundColor: d.surface, borderColor: d.border }]}
          >
            <TextInput
              style={[styles.input, { color: d.text }]}
              placeholder="Confirm password"
              placeholderTextColor={d.textHint}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              textContentType="newPassword"
              autoComplete="new-password"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowConfirm((s) => !s)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppIcon name={showConfirm ? 'eyeSlash' : 'eye'} size={20} role="muted" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.signupBtn, { backgroundColor: d.text }]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={d.background} />
            ) : (
              <Text style={[styles.signupBtnText, { color: d.background }]}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.switchText, { color: d.textMuted }]}>
              Already have an account?{' '}
              <Text style={[styles.switchLink, { color: d.text }]}>Sign In</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestBtn}
            onPress={() => navigation.navigate('Main', { screen: 'HomeTab' })}
          >
            <Text style={[styles.guestText, { color: d.textMuted }]}>Continue as guest</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <GuestMarketPicker
        visible={cityPickerVisible}
        title="Which city are you in?"
        subtitle="We'll show you happy hours and events there. You can switch cities anytime."
        showUseLocation={false}
        onSelect={(slug) => {
          setCityPickerVisible(false);
          register(slug);
        }}
        onDismiss={() => {
          setCityPickerVisible(false);
          setError('Choose a city to finish signing up.');
        }}
      />
    </KeyboardAvoidingView>
  );
};

const brand = { error: '#FF5A5F' };

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 60 },
  logoContainer: { alignSelf: 'center', marginBottom: 24 },
  logoText: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 6, marginBottom: 32 },
  errorBox: { borderWidth: 0.5, borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 13, textAlign: 'center', fontWeight: '500' },
  form: { gap: 12 },
  inputContainer: {
    borderRadius: 14,
    borderWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { flex: 1, padding: 16, fontSize: 15 },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 12 },
  signupBtn: {
    borderRadius: 20,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  signupBtnText: { fontSize: 15, fontWeight: '600' },
  switchBtn: { alignItems: 'center', marginTop: 20 },
  switchText: { fontSize: 14, fontWeight: '500' },
  switchLink: { fontWeight: '600' },
  guestBtn: { alignItems: 'center', marginTop: 28 },
  guestText: { fontSize: 13, fontWeight: '500' },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/endpoints';

export const LoginScreen = () => {
  const { theme } = useTheme();
  const d = theme.derived;
  const { login } = useAuth();
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    setLoading(true);
    try {
      const data = await authAPI.login({ email: email.trim(), password });
      await login(data.access_token, data.user);
      navigation.navigate('Main');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
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

        <Text style={[styles.title, { color: d.text }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: d.textMuted }]}>
          Sign in to submit deals and help build the map
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
              placeholder="Email"
              placeholderTextColor={d.textHint}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View
            style={[styles.inputContainer, { backgroundColor: d.surface, borderColor: d.border }]}
          >
            <TextInput
              style={[styles.input, { color: d.text }]}
              placeholder="Password"
              placeholderTextColor={d.textHint}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: d.text }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={d.background} />
            ) : (
              <Text style={[styles.loginBtnText, { color: d.background }]}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchBtn} onPress={() => navigation.navigate('Signup')}>
            <Text style={[styles.switchText, { color: d.textMuted }]}>
              No account? <Text style={[styles.switchLink, { color: d.text }]}>Sign Up</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestBtn} onPress={() => navigation.navigate('Main', { screen: 'HomeTab' })}>
            <Text style={[styles.guestText, { color: d.textMuted }]}>
              Continue as guest
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const brand = { error: '#FF6B35' };

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
  inputContainer: { borderRadius: 14, borderWidth: 0.5 },
  input: { padding: 16, fontSize: 15 },
  loginBtn: {
    borderRadius: 20,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  loginBtnText: { fontSize: 15, fontWeight: '600' },
  switchBtn: { alignItems: 'center', marginTop: 20 },
  switchText: { fontSize: 14, fontWeight: '500' },
  switchLink: { fontWeight: '600' },
  guestBtn: { alignItems: 'center', marginTop: 28 },
  guestText: { fontSize: 13, fontWeight: '500' },
});

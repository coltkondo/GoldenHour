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

export const SignupScreen = () => {
  const { theme } = useTheme();
  const d = theme.derived;
  const { login } = useAuth();
  const navigation = useNavigation<any>();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setError('');
    if (username.trim().length < 3) { setError('Username must be at least 3 characters'); return; }
    if (!email.trim().includes('@')) { setError('Please enter a valid email address'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(password)) { setError('Password must contain at least one uppercase letter'); return; }
    if (!/[a-z]/.test(password)) { setError('Password must contain at least one lowercase letter'); return; }
    if (!/[0-9]/.test(password)) { setError('Password must contain at least one digit'); return; }
    setLoading(true);
    try {
      const data = await authAPI.register({ username: username.trim(), email: email.trim(), password });
      await login(data.access_token, data.user);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Sign up failed — try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: d.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText, { color: d.text }]}>GLDNHR</Text>
        </View>

        <Text style={[styles.title, { color: d.text }]}>Join Golden Hour</Text>
        <Text style={[styles.subtitle, { color: d.textMuted }]}>Submit deals & earn points for prizes</Text>

        {error ? <View style={[styles.errorBox, { backgroundColor: `${brand.error}15`, borderColor: `${brand.error}40` }]}><Text style={[styles.errorText, { color: brand.error }]}>{error}</Text></View> : null}

        <View style={styles.form}>
          <View style={[styles.inputContainer, { backgroundColor: d.surface, borderColor: d.border }]}>
            <TextInput style={[styles.input, { color: d.text }]} placeholder="Username" placeholderTextColor={d.textHint} value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} />
          </View>
          <View style={[styles.inputContainer, { backgroundColor: d.surface, borderColor: d.border }]}>
            <TextInput style={[styles.input, { color: d.text }]} placeholder="Email" placeholderTextColor={d.textHint} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          </View>
          <View style={[styles.inputContainer, { backgroundColor: d.surface, borderColor: d.border }]}>
            <TextInput style={[styles.input, { color: d.text }]} placeholder="Password (8+ chars, upper, lower, digit)" placeholderTextColor={d.textHint} value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          <TouchableOpacity style={[styles.signupBtn, { backgroundColor: d.text }]} onPress={handleSignup} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color={d.background} /> : <Text style={[styles.signupBtnText, { color: d.background }]}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.switchText, { color: d.textMuted }]}>Already have an account? <Text style={[styles.switchLink, { color: d.text }]}>Sign In</Text></Text>
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
  signupBtn: { borderRadius: 20, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  signupBtnText: { fontSize: 15, fontWeight: '600' },
  switchBtn: { alignItems: 'center', marginTop: 20 },
  switchText: { fontSize: 14, fontWeight: '500' },
  switchLink: { fontWeight: '600' },
});

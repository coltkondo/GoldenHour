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
import { authAPI } from '../../api/endpoints';

type Stage = 'email' | 'code' | 'done';

export const ForgotPasswordScreen = () => {
  const { theme } = useTheme();
  const d = theme.derived;
  const navigation = useNavigation<any>();

  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendCode() {
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword(trimmed);
      // Always advance — 204 whether or not the email is registered
      setStage('code');
    } catch {
      setError('Something went wrong — try again');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase());
    } catch {
      // silently swallow
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setError('');
    if (code.trim().length !== 6) {
      setError('Enter the 6-digit code from your email');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setError('Password must contain at least one digit');
      return;
    }
    if (!/[!@#$%^&*()\-_=+\[\]{}|;:',.<>?/\\`~]/.test(newPassword)) {
      setError('Password must contain at least one special character');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        new_password: newPassword,
      });
      setStage('done');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid or expired code — try again');
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

        {stage === 'email' && (
          <>
            <Text style={[styles.title, { color: d.text }]}>Forgot password?</Text>
            <Text style={[styles.subtitle, { color: d.textMuted }]}>
              Enter your email and we'll send you a reset code
            </Text>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: `${brand.error}15`, borderColor: `${brand.error}40` }]}>
                <Text style={[styles.errorText, { color: brand.error }]}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.form}>
              <View style={[styles.inputContainer, { backgroundColor: d.surface, borderColor: d.border }]}>
                <TextInput
                  style={[styles.input, { color: d.text }]}
                  placeholder="Email"
                  placeholderTextColor={d.textHint}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: d.text }]}
                onPress={handleSendCode}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={d.background} />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: d.background }]}>Send Code</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.backText, { color: d.textMuted }]}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {stage === 'code' && (
          <>
            <Text style={[styles.title, { color: d.text }]}>Check your email</Text>
            <Text style={[styles.subtitle, { color: d.textMuted }]}>
              We sent a 6-digit code to{'\n'}
              <Text style={{ color: d.text, fontWeight: '600' }}>{email.trim()}</Text>
            </Text>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: `${brand.error}15`, borderColor: `${brand.error}40` }]}>
                <Text style={[styles.errorText, { color: brand.error }]}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.form}>
              <View style={[styles.inputContainer, { backgroundColor: d.surface, borderColor: d.border }]}>
                <TextInput
                  style={[styles.input, styles.codeInput, { color: d.text }]}
                  placeholder="6-digit code"
                  placeholderTextColor={d.textHint}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>

              <View style={[styles.inputContainer, { backgroundColor: d.surface, borderColor: d.border }]}>
                <TextInput
                  style={[styles.input, { color: d.text }]}
                  placeholder="New password (8+ chars, upper, lower, digit, special)"
                  placeholderTextColor={d.textHint}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>

              <View style={[styles.inputContainer, { backgroundColor: d.surface, borderColor: d.border }]}>
                <TextInput
                  style={[styles.input, { color: d.text }]}
                  placeholder="Confirm new password"
                  placeholderTextColor={d.textHint}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: d.text }]}
                onPress={handleReset}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={d.background} />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: d.background }]}>Reset Password</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.backBtn} onPress={handleResendCode} disabled={loading}>
                <Text style={[styles.backText, { color: d.textMuted }]}>Didn't get it? Resend code</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backBtn} onPress={() => setStage('email')}>
                <Text style={[styles.backText, { color: d.textMuted }]}>Use a different email</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {stage === 'done' && (
          <>
            <Text style={[styles.title, { color: d.text }]}>Password reset</Text>
            <Text style={[styles.subtitle, { color: d.textMuted }]}>
              Your password has been updated. Sign in with your new password.
            </Text>

            <View style={styles.form}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: d.text }]}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.85}
              >
                <Text style={[styles.primaryBtnText, { color: d.background }]}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 6, marginBottom: 32, lineHeight: 20 },
  errorBox: { borderWidth: 0.5, borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 13, textAlign: 'center', fontWeight: '500' },
  form: { gap: 12 },
  inputContainer: { borderRadius: 14, borderWidth: 0.5 },
  input: { padding: 16, fontSize: 15 },
  codeInput: { textAlign: 'center', fontSize: 22, fontWeight: '700', letterSpacing: 8 },
  primaryBtn: {
    borderRadius: 20,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '600' },
  backBtn: { alignItems: 'center', marginTop: 12 },
  backText: { fontSize: 13, fontWeight: '500' },
});

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
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/endpoints';

export const LoginScreen = () => {
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
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <LinearGradient
          colors={['#FF6B35', '#FFD700']}
          style={styles.logoGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.logoEmoji}>🍻</Text>
        </LinearGradient>

        <Text style={styles.title}>Golden Hour</Text>
        <Text style={styles.subtitle}>Sign in to earn points & submit deals</Text>

        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.switchText}>
              No account? <Text style={styles.switchLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 60,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  logoEmoji: { fontSize: 36 },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 32,
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
  form: { gap: 12 },
  input: {
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#2d3142',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
  },
  loginBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  switchBtn: { alignItems: 'center', marginTop: 16 },
  switchText: { color: '#9ca3af', fontSize: 14 },
  switchLink: { color: '#FF6B35', fontWeight: '700' },
});

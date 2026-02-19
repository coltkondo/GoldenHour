import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { submissionsAPI } from '../api/endpoints';
import { POINTS_CONFIG } from '../config/constants';

type SubmissionType = 'new_bar' | 'new_deal' | 'deal_expired' | 'bar_closed' | 'deal_update' | 'bar_update';

const TYPE_OPTIONS: { type: SubmissionType; label: string; icon: string; desc: string }[] = [
  { type: 'new_bar', label: 'New Bar', icon: '🍺', desc: 'Spotted a bar with happy hour not in the app?' },
  { type: 'new_deal', label: 'New Deal', icon: '🏷️', desc: 'Found a happy hour deal that\'s not listed?' },
  { type: 'deal_expired', label: 'Deal Expired', icon: '❌', desc: 'A listed deal is no longer active?' },
  { type: 'bar_closed', label: 'Bar Closed', icon: '🔒', desc: 'A bar has permanently closed?' },
  { type: 'deal_update', label: 'Deal Info Wrong', icon: '✏️', desc: 'Deal details are incorrect?' },
  { type: 'bar_update', label: 'Bar Info Wrong', icon: '📝', desc: 'Bar details need updating?' },
];

const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const QuickSubmitScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [selectedType, setSelectedType] = useState<SubmissionType | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function updateField(key: string, value: string) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!selectedType) return;
    setError('');
    setLoading(true);
    try {
      await submissionsAPI.submit({
        submission_type: selectedType,
        submitted_data: { ...formData },
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Submission failed — please try again');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    const pts = POINTS_CONFIG[selectedType!] ?? 0;
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.successContainer}>
          <LinearGradient
            colors={['#FF6B35', '#FFD700']}
            style={styles.successIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.successEmoji}>🎉</Text>
          </LinearGradient>
          <Text style={[styles.successTitle, { color: theme.colors.text }]}>Submitted!</Text>
          <Text style={[styles.successSub, { color: theme.colors.textMuted }]}>
            Thanks for helping keep Golden Hour accurate.
          </Text>
          {pts > 0 && (
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsBadgeText}>+{pts} pts when approved</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>I Spotted This</Text>
        </View>

        <Text style={[styles.prompt, { color: theme.colors.textMuted }]}>
          What did you find?
        </Text>

        {/* Type Selector */}
        <View style={styles.typeGrid}>
          {TYPE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.type}
              style={[
                styles.typeCard,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                selectedType === opt.type && styles.typeCardSelected,
              ]}
              onPress={() => { setSelectedType(opt.type); setFormData({}); }}
              activeOpacity={0.8}
            >
              <Text style={styles.typeEmoji}>{opt.icon}</Text>
              <Text style={[styles.typeLabel, { color: theme.colors.text },
                selectedType === opt.type && styles.typeLabelSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form Fields */}
        {selectedType && (
          <View style={styles.formSection}>
            <Text style={[styles.formDesc, { color: theme.colors.textMuted }]}>
              {TYPE_OPTIONS.find(o => o.type === selectedType)?.desc}
            </Text>

            {/* New Bar fields */}
            {selectedType === 'new_bar' && (
              <>
                <TextInput style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Bar name *" placeholderTextColor={theme.colors.textMuted}
                  value={formData.name ?? ''} onChangeText={v => updateField('name', v)} />
                <TextInput style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Address *" placeholderTextColor={theme.colors.textMuted}
                  value={formData.address ?? ''} onChangeText={v => updateField('address', v)} />
                <TextInput style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Neighborhood (optional)" placeholderTextColor={theme.colors.textMuted}
                  value={formData.neighborhood ?? ''} onChangeText={v => updateField('neighborhood', v)} />
                <TextInput style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Deal notes (optional)" placeholderTextColor={theme.colors.textMuted}
                  value={formData.description ?? ''} onChangeText={v => updateField('description', v)}
                  multiline numberOfLines={2} />
              </>
            )}

            {/* New Deal fields */}
            {selectedType === 'new_deal' && (
              <>
                <TextInput style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Bar name *" placeholderTextColor={theme.colors.textMuted}
                  value={formData.bar_name ?? ''} onChangeText={v => updateField('bar_name', v)} />
                <TextInput style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Deal description * (e.g. $3 drafts, half-off apps)" placeholderTextColor={theme.colors.textMuted}
                  value={formData.title ?? ''} onChangeText={v => updateField('title', v)} />
                <TextInput style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Day(s) (e.g. Mon-Fri)" placeholderTextColor={theme.colors.textMuted}
                  value={formData.days ?? ''} onChangeText={v => updateField('days', v)} />
                <TextInput style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Time range (e.g. 4pm – 7pm)" placeholderTextColor={theme.colors.textMuted}
                  value={formData.time_range ?? ''} onChangeText={v => updateField('time_range', v)} />
                <TextInput style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Price details (optional, e.g. $3)" placeholderTextColor={theme.colors.textMuted}
                  value={formData.price_note ?? ''} onChangeText={v => updateField('price_note', v)} />
              </>
            )}

            {/* Flag types: expired, closed, wrong info */}
            {(selectedType === 'deal_expired' || selectedType === 'bar_closed' ||
              selectedType === 'deal_update' || selectedType === 'bar_update') && (
              <>
                <TextInput style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder={`${selectedType.includes('bar') ? 'Bar' : 'Deal'} name *`}
                  placeholderTextColor={theme.colors.textMuted}
                  value={formData.name ?? ''} onChangeText={v => updateField('name', v)} />
                {(selectedType === 'deal_update' || selectedType === 'bar_update') && (
                  <TextInput style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border },
                    { minHeight: 80, textAlignVertical: 'top' }]}
                    placeholder="What's wrong? What should it say? *"
                    placeholderTextColor={theme.colors.textMuted}
                    value={formData.correction ?? ''} onChangeText={v => updateField('correction', v)}
                    multiline numberOfLines={3} />
                )}
                <TextInput style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Any extra notes (optional)" placeholderTextColor={theme.colors.textMuted}
                  value={formData.notes ?? ''} onChangeText={v => updateField('notes', v)} />
              </>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#FF6B35', '#FFD700']}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit — Earn Points!</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={[styles.pointsHint, { color: theme.colors.textMuted }]}>
              {POINTS_CONFIG[selectedType] ?? 0} pts awarded when your submission is approved
            </Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  prompt: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  typeCard: {
    width: '47%',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  typeCardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255,107,53,0.1)',
  },
  typeEmoji: { fontSize: 28 },
  typeLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  typeLabelSelected: { color: '#FF6B35' },
  formSection: { gap: 10 },
  formDesc: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
  submitBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.7 },
  submitGradient: { paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },
  pointsHint: { fontSize: 13, textAlign: 'center', marginTop: 4 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successEmoji: { fontSize: 48 },
  successTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8 },
  successSub: { fontSize: 15, textAlign: 'center', marginBottom: 20 },
  pointsBadge: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 28,
  },
  pointsBadgeText: { color: '#FF6B35', fontWeight: '800', fontSize: 16 },
  doneBtn: { paddingVertical: 14, paddingHorizontal: 48, borderRadius: 14 },
  doneBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

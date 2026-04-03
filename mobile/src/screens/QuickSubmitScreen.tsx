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
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { submissionsAPI } from '../api/endpoints';
import { POINTS_CONFIG } from '../config/constants';
import { AppIcon } from '../components/icons';

type SubmissionType =
  | 'new_bar'
  | 'new_deal'
  | 'deal_expired'
  | 'bar_closed'
  | 'deal_update'
  | 'bar_update';

const TYPE_OPTIONS: { type: SubmissionType; label: string; desc: string }[] = [
  { type: 'new_bar', label: 'New Bar', desc: 'Spotted a bar with happy hour not in the app?' },
  { type: 'new_deal', label: 'New Deal', desc: "Found a happy hour deal that's not listed?" },
  { type: 'deal_expired', label: 'Deal Expired', desc: 'A listed deal is no longer active?' },
  { type: 'bar_closed', label: 'Bar Closed', desc: 'A bar has permanently closed?' },
  { type: 'deal_update', label: 'Deal Info Wrong', desc: 'Deal details are incorrect?' },
  { type: 'bar_update', label: 'Bar Info Wrong', desc: 'Bar details need updating?' },
];

export const QuickSubmitScreen = () => {
  const { theme } = useTheme();
  const d = theme.derived;
  const navigation = useNavigation<any>();
  const [selectedType, setSelectedType] = useState<SubmissionType | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function updateField(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
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
      <View style={[styles.container, { backgroundColor: d.background }]}>
        <View style={styles.successContainer}>
          <AppIcon name="correct" size={64} role="positive" />
          <Text style={[styles.successTitle, { color: d.text }]}>Submitted!</Text>
          <Text style={[styles.successSubtext, { color: d.textMuted }]}>
            Thanks for helping keep GLDNHR accurate.
          </Text>
          {pts > 0 && (
            <View
              style={[
                styles.pointsBadge,
                { backgroundColor: 'rgba(245,166,35,0.12)', borderColor: d.primary },
              ]}
            >
              <AppIcon name="points" size={12} role="brand" />
              <Text style={[styles.pointsBadgeText, { color: d.primary }]}>
                +{pts} pts when approved
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: d.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.doneBtnText, { color: d.buttonPrimaryText }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: d.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <AppIcon name="back" size={22} role="default" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: d.text }]}>Submit</Text>
          </View>

          <Text style={[styles.prompt, { color: d.text }]}>What did you find?</Text>

          <View style={styles.typeGrid}>
            {TYPE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.type}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor:
                      selectedType === opt.type ? 'rgba(245,166,35,0.12)' : d.cardBackground,
                    borderColor: selectedType === opt.type ? d.primary : d.border,
                  },
                ]}
                onPress={() => {
                  setSelectedType(opt.type);
                  setFormData({});
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.typeLabel,
                    { color: selectedType === opt.type ? d.primary : d.text },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedType && (
            <View style={styles.formSection}>
              <Text style={[styles.formDesc, { color: d.textMuted }]}>
                {TYPE_OPTIONS.find((o) => o.type === selectedType)?.desc}
              </Text>

              {selectedType === 'new_bar' && (
                <>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: d.cardBackground, borderColor: d.border },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: d.text }]}
                      placeholder="Bar name *"
                      placeholderTextColor={d.textHint}
                      value={formData.name ?? ''}
                      onChangeText={(v) => updateField('name', v)}
                    />
                  </View>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: d.cardBackground, borderColor: d.border },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: d.text }]}
                      placeholder="Address *"
                      placeholderTextColor={d.textHint}
                      value={formData.address ?? ''}
                      onChangeText={(v) => updateField('address', v)}
                    />
                  </View>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: d.cardBackground, borderColor: d.border },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: d.text }]}
                      placeholder="Neighborhood (optional)"
                      placeholderTextColor={d.textHint}
                      value={formData.neighborhood ?? ''}
                      onChangeText={(v) => updateField('neighborhood', v)}
                    />
                  </View>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: d.cardBackground, borderColor: d.border },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, styles.textArea, { color: d.text }]}
                      placeholder="Deal notes (optional)"
                      placeholderTextColor={d.textHint}
                      value={formData.description ?? ''}
                      onChangeText={(v) => updateField('description', v)}
                      multiline
                      numberOfLines={2}
                    />
                  </View>
                </>
              )}

              {selectedType === 'new_deal' && (
                <>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: d.cardBackground, borderColor: d.border },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: d.text }]}
                      placeholder="Bar name *"
                      placeholderTextColor={d.textHint}
                      value={formData.bar_name ?? ''}
                      onChangeText={(v) => updateField('bar_name', v)}
                    />
                  </View>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: d.cardBackground, borderColor: d.border },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: d.text }]}
                      placeholder="Deal description * (e.g. $3 drafts, half-off apps)"
                      placeholderTextColor={d.textHint}
                      value={formData.title ?? ''}
                      onChangeText={(v) => updateField('title', v)}
                    />
                  </View>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: d.cardBackground, borderColor: d.border },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: d.text }]}
                      placeholder="Day(s) (e.g. Mon-Fri)"
                      placeholderTextColor={d.textHint}
                      value={formData.days ?? ''}
                      onChangeText={(v) => updateField('days', v)}
                    />
                  </View>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: d.cardBackground, borderColor: d.border },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: d.text }]}
                      placeholder="Time range (e.g. 4pm – 7pm)"
                      placeholderTextColor={d.textHint}
                      value={formData.time_range ?? ''}
                      onChangeText={(v) => updateField('time_range', v)}
                    />
                  </View>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: d.cardBackground, borderColor: d.border },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: d.text }]}
                      placeholder="Price details (optional, e.g. $3)"
                      placeholderTextColor={d.textHint}
                      value={formData.price_note ?? ''}
                      onChangeText={(v) => updateField('price_note', v)}
                    />
                  </View>
                </>
              )}

              {(selectedType === 'deal_expired' ||
                selectedType === 'bar_closed' ||
                selectedType === 'deal_update' ||
                selectedType === 'bar_update') && (
                <>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: d.cardBackground, borderColor: d.border },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: d.text }]}
                      placeholder={`${selectedType.includes('bar') ? 'Bar' : 'Deal'} name *`}
                      placeholderTextColor={d.textHint}
                      value={formData.name ?? ''}
                      onChangeText={(v) => updateField('name', v)}
                    />
                  </View>
                  {(selectedType === 'deal_update' || selectedType === 'bar_update') && (
                    <View
                      style={[
                        styles.inputContainer,
                        { backgroundColor: d.cardBackground, borderColor: d.border },
                      ]}
                    >
                      <TextInput
                        style={[styles.input, styles.textArea, { color: d.text }]}
                        placeholder="What's wrong? What should it say? *"
                        placeholderTextColor={d.textHint}
                        value={formData.correction ?? ''}
                        onChangeText={(v) => updateField('correction', v)}
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  )}
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: d.cardBackground, borderColor: d.border },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: d.text }]}
                      placeholder="Any extra notes (optional)"
                      placeholderTextColor={d.textHint}
                      value={formData.notes ?? ''}
                      onChangeText={(v) => updateField('notes', v)}
                    />
                  </View>
                </>
              )}

              {error ? <Text style={[styles.errorText, { color: d.error }]}>{error}</Text> : null}

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: d.primary },
                  loading && { opacity: 0.7 },
                ]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={d.buttonPrimaryText} />
                ) : (
                  <Text style={[styles.submitBtnText, { color: d.buttonPrimaryText }]}>
                    Submit — Earn Points!
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={[styles.pointsHint, { color: d.textMuted }]}>
                {POINTS_CONFIG[selectedType] ?? 0} pts awarded when your submission is approved
              </Text>
            </View>
          )}

          <View style={{ height: 140 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  prompt: { fontSize: 15, fontWeight: '600', marginBottom: 16 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  typeCard: { width: '47%', borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center' },
  typeLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  formSection: { gap: 10 },
  formDesc: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  inputContainer: { borderRadius: 14, borderWidth: 1 },
  input: { padding: 14, fontSize: 15 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  errorText: { fontSize: 13, textAlign: 'center', fontWeight: '500' },
  submitBtn: {
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700' },
  pointsHint: { fontSize: 12, fontWeight: '500', textAlign: 'center', marginTop: 4 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 24,
    marginBottom: 8,
  },
  successSubtext: { fontSize: 14, fontWeight: '500', textAlign: 'center', marginBottom: 20 },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 28,
    borderWidth: 1,
  },
  pointsBadgeText: { fontWeight: '700', fontSize: 14 },
  doneBtn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 14 },
  doneBtnText: { fontWeight: '700', fontSize: 15 },
});

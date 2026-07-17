import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { submissionsAPI, authAPI } from '../api/endpoints';
import { POINTS_CONFIG, REWARDS_THRESHOLD, REWARDS_ENABLED } from '../config/constants';
import { AppIcon } from '../components/icons';

type SubmissionType =
  | 'new_bar'
  | 'new_deal'
  | 'deal_expired'
  | 'bar_closed'
  | 'deal_update'
  | 'bar_update';

const TYPE_OPTIONS: { type: SubmissionType; label: string; desc: string; pts: number }[] = [
  { type: 'new_deal', label: 'New Deal', desc: "Found a happy hour deal that's not listed?", pts: POINTS_CONFIG.new_deal },
  { type: 'new_bar', label: 'New Bar', desc: 'Spotted a bar with happy hour not in the app?', pts: POINTS_CONFIG.new_bar },
  { type: 'deal_update', label: 'Deal Info Wrong', desc: 'Deal details are incorrect?', pts: POINTS_CONFIG.deal_update },
  { type: 'bar_update', label: 'Bar Info Wrong', desc: 'Bar details need updating?', pts: POINTS_CONFIG.bar_update },
  { type: 'deal_expired', label: 'Deal Expired', desc: 'A listed deal is no longer active?', pts: POINTS_CONFIG.deal_expired },
  { type: 'bar_closed', label: 'Bar Closed', desc: 'A bar has permanently closed?', pts: POINTS_CONFIG.bar_closed },
];

export const SubmitScreen = () => {
  const { theme } = useTheme();
  const d = theme.derived;
  const navigation = useNavigation<any>();
  const { user, refreshUser } = useAuth();
  const [selectedType, setSelectedType] = useState<SubmissionType | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      authAPI.me()
        .then((freshUser) => refreshUser(freshUser))
        .catch(() => {});
    }, [user?.id]),
  );

  function updateField(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setSelectedType(null);
    setFormData({});
    setSubmitted(false);
    setError('');
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
      if (err.response?.status === 401) {
        setError('Your session expired — please log out and log back in.');
      } else {
        setError(err.response?.data?.detail || 'Submission failed — please try again');
      }
    } finally {
      setLoading(false);
    }
  }

  const points = user?.points_balance ?? 0;
  const progress = Math.min(points / REWARDS_THRESHOLD, 1);
  const ptsToGo = Math.max(REWARDS_THRESHOLD - points, 0);

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: d.background, justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <AppIcon name="plus" size={48} role="muted" />
        <Text style={[styles.screenTitle, { color: d.text, textAlign: 'center', marginTop: 20 }]}>
          Help Build the Map
        </Text>
        <Text style={[styles.successSubtext, { color: d.textMuted }]}>
          Create a free account to submit happy hour deals for State College bars.
        </Text>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: d.primary, width: '100%', marginTop: 8 }]}
          onPress={() => navigation.navigate('Signup')}
          activeOpacity={0.85}
        >
          <Text style={[styles.submitBtnText, { color: d.buttonPrimaryText }]}>
            Sign Up — It's Free
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.linkText, { color: d.primary }]}>Already have an account? Log in</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 28 }} onPress={() => navigation.navigate('HomeTab')}>
          <Text style={[{ fontSize: 13, fontWeight: '500', color: d.textMuted }]}>
            Just browsing — take me to deals
          </Text>
        </TouchableOpacity>
      </View>
    );
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
          {REWARDS_ENABLED && pts > 0 && (
            <View
              style={[
                styles.pointsBadge,
                { backgroundColor: 'rgba(245,166,35,0.12)', borderColor: d.primary },
              ]}
            >
              <AppIcon name="points" size={14} role="brand" />
              <Text style={[styles.pointsBadgeText, { color: d.primary }]}>
                +{pts} pts when approved
              </Text>
            </View>
          )}
          {!REWARDS_ENABLED && (
            <Text style={[styles.successSubtext, { color: d.textMuted, fontSize: 12 }]}>
              Rewards coming at full launch this fall.
            </Text>
          )}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: d.primary, marginTop: 8 }]}
            onPress={resetForm}
          >
            <Text style={[styles.submitBtnText, { color: d.buttonPrimaryText }]}>
              Submit Another
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginTop: 16 }}
            onPress={() => navigation.navigate('MySubmissions')}
          >
            <Text style={[styles.linkText, { color: d.primary }]}>View My Submissions</Text>
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
          {/* Header */}
          <Text style={[styles.screenTitle, { color: d.text }]}>Contribute</Text>

          {/* Rewards Progress — hidden during Arts Fest beta */}
          {REWARDS_ENABLED && (
            <View style={[styles.progressCard, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
              <View style={styles.progressHeader}>
                <View style={styles.progressLeft}>
                  <AppIcon name="points" size={18} role="brand" />
                  <Text style={[styles.progressPoints, { color: d.primary }]}>
                    {points.toLocaleString()}
                  </Text>
                  <Text style={[styles.progressLabel, { color: d.textMuted }]}>
                    / {REWARDS_THRESHOLD.toLocaleString()} pts
                  </Text>
                </View>
                <AppIcon name="rewards" size={20} role={progress >= 1 ? 'brand' : 'muted'} />
              </View>

              <View style={[styles.progressTrack, { backgroundColor: d.filterInactive }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: d.primary,
                      width: `${Math.max(progress * 100, 2)}%`,
                    },
                  ]}
                />
              </View>

              <Text style={[styles.progressHint, { color: d.textMuted }]}>
                {progress >= 1
                  ? "You've earned a reward! Redeem from your profile."
                  : `${ptsToGo.toLocaleString()} pts to your next $20 reward`}
              </Text>
            </View>
          )}

          {/* Type Selection */}
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
                  setError('');
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
                {REWARDS_ENABLED && (
                  <Text style={[styles.typePts, { color: d.textMuted }]}>
                    +{opt.pts} pts
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Dynamic Form */}
          {selectedType && (
            <View style={styles.formSection}>
              <Text style={[styles.formDesc, { color: d.textMuted }]}>
                {TYPE_OPTIONS.find((o) => o.type === selectedType)?.desc}
              </Text>

              {selectedType === 'new_bar' && (
                <>
                  {renderInput(d, 'Bar name *', formData.name, (v) => updateField('name', v))}
                  {renderInput(d, 'Address *', formData.address, (v) => updateField('address', v))}
                  {renderInput(d, 'Neighborhood (optional)', formData.neighborhood, (v) => updateField('neighborhood', v))}
                  {renderInput(d, 'Deal notes (optional)', formData.description, (v) => updateField('description', v), true)}
                </>
              )}

              {selectedType === 'new_deal' && (
                <>
                  {renderInput(d, 'Bar name *', formData.bar_name, (v) => updateField('bar_name', v))}
                  {renderInput(d, 'Deal description * (e.g. $3 drafts, half-off apps)', formData.title, (v) => updateField('title', v))}
                  {renderInput(d, 'Day(s) (e.g. Mon-Fri)', formData.days, (v) => updateField('days', v))}
                  {renderInput(d, 'Time range (e.g. 4pm – 7pm)', formData.time_range, (v) => updateField('time_range', v))}
                  {renderInput(d, 'Price details (optional, e.g. $3)', formData.price_note, (v) => updateField('price_note', v))}
                </>
              )}

              {(selectedType === 'deal_expired' ||
                selectedType === 'bar_closed' ||
                selectedType === 'deal_update' ||
                selectedType === 'bar_update') && (
                <>
                  {renderInput(
                    d,
                    `${selectedType.includes('bar') ? 'Bar' : 'Deal'} name *`,
                    formData.name,
                    (v) => updateField('name', v),
                  )}
                  {(selectedType === 'deal_update' || selectedType === 'bar_update') &&
                    renderInput(
                      d,
                      "What's wrong? What should it say? *",
                      formData.correction,
                      (v) => updateField('correction', v),
                      true,
                    )}
                  {renderInput(d, 'Any extra notes (optional)', formData.notes, (v) => updateField('notes', v))}
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
                    {REWARDS_ENABLED ? `Submit — Earn ${POINTS_CONFIG[selectedType] ?? 0} pts` : 'Submit'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

function renderInput(
  d: any,
  placeholder: string,
  value: string | undefined,
  onChange: (v: string) => void,
  multiline?: boolean,
) {
  return (
    <View style={[styles.inputContainer, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
      <TextInput
        style={[styles.input, multiline && styles.textArea, { color: d.text }]}
        placeholder={placeholder}
        placeholderTextColor={d.textHint}
        value={value ?? ''}
        onChangeText={onChange}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 60 },

  screenTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginBottom: 20 },

  progressCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 28,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressPoints: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  progressLabel: { fontSize: 13, fontWeight: '500' },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressHint: { fontSize: 12, fontWeight: '500' },

  prompt: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  typeCard: {
    width: '47%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  typeLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  typePts: { fontSize: 11, fontWeight: '500' },

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
    marginBottom: 12,
    borderWidth: 1,
  },
  pointsBadgeText: { fontWeight: '700', fontSize: 14 },
  linkText: { fontSize: 14, fontWeight: '600' },
});

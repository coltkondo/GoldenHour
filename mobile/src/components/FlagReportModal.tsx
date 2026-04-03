import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle, Rect as SvgRect } from 'react-native-svg';
import { useTheme } from '../theme';
import { submissionsAPI } from '../api/endpoints';
import type { Venue, Deal } from '../types/api';
import { AppIcon } from './icons';

type ReportType = 'deal_expired' | 'bar_closed' | 'deal_update';

interface FlagReportModalProps {
  visible: boolean;
  onClose: () => void;
  venue: Venue;
  deal?: Deal;
}

const ClockXIcon = ({ color, size = 22 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.5} />
    <Path d="M12 7v5l3 2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Path d="M16 8l4 4M20 8l-4 4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const LockIcon = ({ color, size = 22 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <SvgRect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth={1.5} />
    <Path d="M8 11V7a4 4 0 018 0v4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Circle cx={12} cy={16} r={1.5} fill={color} />
  </Svg>
);

const REPORT_OPTIONS: {
  type: ReportType;
  label: string;
  icon: React.FC<{ color: string; size?: number }>;
  desc: string;
}[] = [
  {
    type: 'deal_expired',
    label: 'Deal no longer active',
    icon: ClockXIcon,
    desc: 'This deal has ended or changed',
  },
  {
    type: 'bar_closed',
    label: 'Bar is closed',
    icon: LockIcon,
    desc: 'This bar has permanently closed',
  },
  {
    type: 'deal_update',
    label: 'Deal info is wrong',
    icon: ({ color, size }: { color: string; size?: number }) => (
      <AppIcon name="warning" size={size ?? 22} color={color} />
    ),
    desc: 'Something about this deal is incorrect',
  },
];

export const FlagReportModal = ({ visible, onClose, venue, deal }: FlagReportModalProps) => {
  const { theme } = useTheme();
  const d = theme.derived;
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  function reset() {
    setSelectedType(null);
    setNotes('');
    setDone(false);
    setError(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!selectedType) return;
    setLoading(true);
    setError(false);
    try {
      await submissionsAPI.submit({
        submission_type: selectedType,
        submitted_data: {
          bar_name: venue.name,
          deal_title: deal?.title,
          notes,
        },
        related_bar_id: venue.id,
        related_deal_id: deal?.id,
      });
      setDone(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />

        <View style={[styles.sheet, { backgroundColor: d.cardBackground }]}>
          <View style={[styles.handle, { backgroundColor: d.textMuted }]} />

          {done ? (
            <View style={styles.doneContainer}>
              <AppIcon name="correct" size={48} role="positive" />
              <Text style={[styles.doneTitle, { color: d.text }]}>Thanks for the report!</Text>
              <Text style={[styles.doneSub, { color: d.textMuted }]}>
                We'll review it and earn you points if confirmed.
              </Text>
              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: d.primary }]}
                onPress={handleClose}
              >
                <Text style={[styles.closeBtnText, { color: d.buttonPrimaryText }]}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={[styles.title, { color: d.text }]}>Report an Issue</Text>
              <Text style={[styles.subtitle, { color: d.textMuted }]}>
                {venue.name}
                {deal ? ` · ${deal.title}` : ''}
              </Text>

              <View style={styles.optionsList}>
                {REPORT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <TouchableOpacity
                      key={opt.type}
                      style={[
                        styles.optionRow,
                        { borderColor: d.border },
                        selectedType === opt.type && {
                          backgroundColor: 'rgba(255,107,53,0.12)',
                          borderColor: d.error,
                        },
                      ]}
                      onPress={() => setSelectedType(opt.type)}
                      activeOpacity={0.8}
                    >
                      <Icon color={selectedType === opt.type ? d.error : d.textMuted} size={22} />
                      <View style={styles.optionText}>
                        <Text
                          style={[
                            styles.optionLabel,
                            { color: selectedType === opt.type ? d.error : d.text },
                          ]}
                        >
                          {opt.label}
                        </Text>
                        <Text style={[styles.optionDesc, { color: d.textMuted }]}>{opt.desc}</Text>
                      </View>
                      {selectedType === opt.type && (
                        <AppIcon name="correct" size={20} color={d.error} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedType && (
                <TextInput
                  style={[
                    styles.notesInput,
                    { color: d.text, borderColor: d.border, backgroundColor: d.surface },
                  ]}
                  placeholder="Optional: add more detail..."
                  placeholderTextColor={d.textHint}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={2}
                />
              )}

              {error && (
                <View
                  style={[
                    styles.errorBanner,
                    { backgroundColor: 'rgba(255,107,53,0.12)', borderColor: d.error },
                  ]}
                >
                  <AppIcon name="warning" size={16} color={d.error} />
                  <Text style={[styles.errorText, { color: d.error }]}>
                    Submission failed. Please try again.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: d.error },
                  !selectedType && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!selectedType || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={d.buttonPrimaryText} />
                ) : (
                  <Text style={[styles.submitBtnText, { color: d.buttonPrimaryText }]}>
                    Submit Report
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: '85%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14, fontWeight: '500', marginBottom: 20 },
  optionsList: { gap: 10, marginBottom: 16 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '700' },
  optionDesc: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontWeight: '800', fontSize: 16 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  doneContainer: { alignItems: 'center', paddingVertical: 24 },
  doneTitle: { fontSize: 22, fontWeight: '900', marginTop: 16, marginBottom: 8 },
  doneSub: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  closeBtn: { paddingVertical: 13, paddingHorizontal: 40, borderRadius: 14 },
  closeBtnText: { fontWeight: '800', fontSize: 15 },
});

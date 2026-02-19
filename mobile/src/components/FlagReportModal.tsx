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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { submissionsAPI } from '../api/endpoints';
import type { Venue, Deal } from '../types/api';

type ReportType = 'deal_expired' | 'bar_closed' | 'deal_update';

interface FlagReportModalProps {
  visible: boolean;
  onClose: () => void;
  venue: Venue;
  deal?: Deal;
}

const REPORT_OPTIONS: { type: ReportType; label: string; icon: string; desc: string }[] = [
  {
    type: 'deal_expired',
    label: 'Deal no longer active',
    icon: 'close-circle',
    desc: 'This deal has ended or changed',
  },
  {
    type: 'bar_closed',
    label: 'Bar is closed',
    icon: 'lock-closed',
    desc: 'This bar has permanently closed',
  },
  {
    type: 'deal_update',
    label: 'Deal info is wrong',
    icon: 'create',
    desc: 'Something about this deal is incorrect',
  },
];

export const FlagReportModal = ({ visible, onClose, venue, deal }: FlagReportModalProps) => {
  const { theme } = useTheme();
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function reset() {
    setSelectedType(null);
    setNotes('');
    setDone(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!selectedType) return;
    setLoading(true);
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
      // silently fail — user gets no destructive error for a flag
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />

        <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />

          {done ? (
            <View style={styles.doneContainer}>
              <Text style={styles.doneEmoji}>🙏</Text>
              <Text style={[styles.doneTitle, { color: theme.colors.text }]}>Thanks for the report!</Text>
              <Text style={[styles.doneSub, { color: theme.colors.textMuted }]}>
                We'll review it and earn you points if confirmed.
              </Text>
              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: theme.colors.primary }]}
                onPress={handleClose}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={[styles.title, { color: theme.colors.text }]}>Report an Issue</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                {venue.name}{deal ? ` · ${deal.title}` : ''}
              </Text>

              <View style={styles.optionsList}>
                {REPORT_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.type}
                    style={[
                      styles.optionRow,
                      { borderColor: theme.colors.border },
                      selectedType === opt.type && styles.optionRowSelected,
                    ]}
                    onPress={() => setSelectedType(opt.type)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={22}
                      color={selectedType === opt.type ? '#FF6B35' : theme.colors.textMuted}
                    />
                    <View style={styles.optionText}>
                      <Text style={[styles.optionLabel, { color: theme.colors.text },
                        selectedType === opt.type && { color: '#FF6B35' }]}>
                        {opt.label}
                      </Text>
                      <Text style={[styles.optionDesc, { color: theme.colors.textMuted }]}>
                        {opt.desc}
                      </Text>
                    </View>
                    {selectedType === opt.type && (
                      <Ionicons name="checkmark-circle" size={20} color="#FF6B35" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {selectedType && (
                <TextInput
                  style={[styles.notesInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Optional: add more detail..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={2}
                />
              )}

              <TouchableOpacity
                style={[styles.submitBtn, !selectedType && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!selectedType || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Report</Text>
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
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  optionRowSelected: { borderColor: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.08)' },
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
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  submitBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  doneContainer: { alignItems: 'center', paddingVertical: 24 },
  doneEmoji: { fontSize: 48, marginBottom: 12 },
  doneTitle: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
  doneSub: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  closeBtn: { paddingVertical: 13, paddingHorizontal: 40, borderRadius: 14 },
  closeBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

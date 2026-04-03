import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { submissionsAPI } from '../api/endpoints';
import type { Submission } from '../types/api';
import { AppIcon } from '../components/icons';
import { StatusDot } from '../components/ui/StatusDot';

const TYPE_LABELS: Record<string, string> = {
  new_deal: 'New Deal',
  deal_update: 'Deal Update',
  deal_expired: 'Deal Expired',
  new_bar: 'New Bar',
  bar_closed: 'Bar Closed',
  bar_update: 'Bar Update',
};

const AUTO_APPLY: Record<string, string> = {
  new_bar: 'Creates a new bar',
  bar_closed: 'Marks bar as closed',
  bar_update: 'Updates bar info',
  new_deal: 'Creates a new deal',
  deal_expired: 'Marks deal as expired',
  deal_update: 'Updates deal info',
};

const getStatusColor = (status: string) => {
  if (status === 'approved') return '#2DD4A0';
  if (status === 'rejected') return '#FF6B35';
  return '#F5A623';
};

export const AdminReviewScreen = () => {
  const { theme } = useTheme();
  const d = theme.derived;
  const navigation = useNavigation<any>();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState('pending');
  const [reviewing, setReviewing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await submissionsAPI.adminGetAll({ status: statusFilter || undefined });
      setSubmissions(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReview(sub: Submission, status: 'approved' | 'rejected') {
    const notes = adminNotes[sub.id];
    Alert.alert(
      status === 'approved' ? 'Approve Submission' : 'Reject Submission',
      `${status === 'approved' ? AUTO_APPLY[sub.submission_type] + '. ' : ''}Are you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: status === 'approved' ? 'Approve' : 'Reject',
          style: status === 'rejected' ? 'destructive' : 'default',
          onPress: async () => {
            setReviewing(sub.id);
            try {
              await submissionsAPI.review(sub.id, { status, admin_notes: notes });
              setSubmissions((prev) => prev.filter((s) => s.id !== sub.id));
              setExpandedId(null);
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.detail || 'Review failed');
            } finally {
              setReviewing(null);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: d.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={d.primary}
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <AppIcon name="back" size={22} role="default" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: d.text }]}>Review Queue</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {['pending', 'approved', 'rejected', ''].map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                {
                  backgroundColor: statusFilter === f ? d.primary : d.cardBackground,
                  borderColor: statusFilter === f ? d.primary : d.border,
                },
              ]}
              onPress={() => setStatusFilter(f)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: statusFilter === f ? d.buttonPrimaryText : d.textMuted },
                ]}
              >
                {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={d.primary} style={{ marginTop: 40 }} />
        ) : submissions.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: d.cardBackground, borderColor: d.border },
            ]}
          >
            <AppIcon name="correct" size={32} role="positive" />
            <Text style={[styles.emptyText, { color: d.text }]}>Queue is empty</Text>
          </View>
        ) : (
          submissions.map((sub) => {
            const expanded = expandedId === sub.id;
            const statusColor = getStatusColor(sub.status);
            return (
              <View
                key={sub.id}
                style={[styles.card, { backgroundColor: d.cardBackground, borderColor: d.border }]}
              >
                <TouchableOpacity
                  onPress={() => setExpandedId(expanded ? null : sub.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardLeft}>
                      <View style={[styles.typePill, { backgroundColor: d.filterInactive }]}>
                        <Text style={[styles.typePillText, { color: d.text }]}>
                          {TYPE_LABELS[sub.submission_type] ?? sub.submission_type}
                        </Text>
                      </View>
                      <Text style={[styles.submitter, { color: d.textMuted }]}>
                        by {sub.submitter_username}
                      </Text>
                    </View>
                    <View style={styles.cardRight}>
                      <StatusDot
                        status={
                          sub.status === 'pending'
                            ? 'live'
                            : sub.status === 'approved'
                              ? 'live'
                              : 'expiring'
                        }
                        size={8}
                        pulse={false}
                      />
                      <AppIcon name="dropdown" size={16} role="muted" />
                    </View>
                  </View>
                  <Text style={[styles.cardDate, { color: d.textHint }]}>
                    {new Date(sub.created_at).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                {expanded && (
                  <View style={styles.expandedContent}>
                    <Text style={[styles.dataLabel, { color: d.textMuted }]}>Submitted Data</Text>
                    <View
                      style={[
                        styles.jsonBlock,
                        { backgroundColor: d.surface, borderColor: d.border },
                      ]}
                    >
                      <Text style={[styles.jsonText, { color: d.text }]}>
                        {JSON.stringify(sub.submitted_data, null, 2)}
                      </Text>
                    </View>

                    {sub.status === 'pending' && (
                      <>
                        <View
                          style={[
                            styles.applyNote,
                            { backgroundColor: d.filterInactive, borderColor: d.border },
                          ]}
                        >
                          <Text style={[styles.applyNoteText, { color: d.text }]}>
                            On approve: {AUTO_APPLY[sub.submission_type]}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.notesInputContainer,
                            { backgroundColor: d.surface, borderColor: d.border },
                          ]}
                        >
                          <TextInput
                            style={[styles.notesInput, { color: d.text }]}
                            placeholder="Admin notes (optional)"
                            placeholderTextColor={d.textHint}
                            value={adminNotes[sub.id] ?? ''}
                            onChangeText={(v) =>
                              setAdminNotes((prev) => ({ ...prev, [sub.id]: v }))
                            }
                            multiline
                          />
                        </View>

                        <View style={styles.reviewBtns}>
                          <TouchableOpacity
                            style={[styles.approveBtn, { backgroundColor: d.primary }]}
                            onPress={() => handleReview(sub, 'approved')}
                            disabled={reviewing === sub.id}
                          >
                            {reviewing === sub.id ? (
                              <ActivityIndicator color={d.buttonPrimaryText} size="small" />
                            ) : (
                              <Text style={[styles.approveBtnText, { color: d.buttonPrimaryText }]}>
                                Approve
                              </Text>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.rejectBtn,
                              { backgroundColor: 'rgba(255,107,53,0.12)', borderColor: d.error },
                            ]}
                            onPress={() => handleReview(sub, 'rejected')}
                            disabled={reviewing === sub.id}
                          >
                            <Text style={[styles.rejectBtnText, { color: d.error }]}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  filterRow: { marginBottom: 16 },
  filterChip: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { gap: 6 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typePill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  typePillText: { fontSize: 11, fontWeight: '600' },
  submitter: { fontSize: 11, fontWeight: '500' },
  cardDate: { fontSize: 10, fontWeight: '500', marginTop: 6 },
  expandedContent: { marginTop: 14, gap: 10 },
  dataLabel: { fontSize: 11, fontWeight: '600' },
  jsonBlock: { borderRadius: 10, borderWidth: 1, padding: 12 },
  jsonText: { fontFamily: 'monospace', fontSize: 11, lineHeight: 16 },
  applyNote: { borderRadius: 10, borderWidth: 1, padding: 12 },
  applyNoteText: { fontSize: 12, fontWeight: '500' },
  notesInputContainer: { borderRadius: 10, borderWidth: 1 },
  notesInput: { padding: 12, fontSize: 13, minHeight: 60, textAlignVertical: 'top' },
  reviewBtns: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  approveBtnText: { fontWeight: '700', fontSize: 14 },
  rejectBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  rejectBtnText: { fontWeight: '700', fontSize: 14 },
});

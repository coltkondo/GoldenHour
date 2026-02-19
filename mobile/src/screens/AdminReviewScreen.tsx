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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { submissionsAPI } from '../api/endpoints';
import type { Submission } from '../types/api';

const STATUS_COLORS = {
  pending: '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444',
};

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

export const AdminReviewScreen = () => {
  const { theme } = useTheme();
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

  useEffect(() => { load(); }, [load]);

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
              setSubmissions(prev => prev.filter(s => s.id !== sub.id));
              setExpandedId(null);
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.detail || 'Review failed');
            } finally {
              setReviewing(null);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Review Queue</Text>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {['pending', 'approved', 'rejected', ''].map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip,
                { backgroundColor: statusFilter === f ? '#FF6B35' : theme.colors.surface,
                  borderColor: statusFilter === f ? '#FF6B35' : theme.colors.border }]}
              onPress={() => setStatusFilter(f)}
            >
              <Text style={[styles.filterChipText,
                { color: statusFilter === f ? '#fff' : theme.colors.textMuted }]}>
                {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : submissions.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={styles.emptyEmoji}>✅</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Queue is empty</Text>
          </View>
        ) : (
          submissions.map(sub => {
            const expanded = expandedId === sub.id;
            return (
              <View key={sub.id} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TouchableOpacity onPress={() => setExpandedId(expanded ? null : sub.id)} activeOpacity={0.8}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardLeft}>
                      <View style={[styles.typePill, { backgroundColor: 'rgba(255,107,53,.15)' }]}>
                        <Text style={styles.typePillText}>{TYPE_LABELS[sub.submission_type] ?? sub.submission_type}</Text>
                      </View>
                      <Text style={[styles.submitter, { color: theme.colors.textMuted }]}>
                        by {sub.submitter_username}
                      </Text>
                    </View>
                    <View style={styles.cardRight}>
                      <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[sub.status] }]} />
                      <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={theme.colors.textMuted}
                      />
                    </View>
                  </View>
                  <Text style={[styles.cardDate, { color: theme.colors.textMuted }]}>
                    {new Date(sub.created_at).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                {expanded && (
                  <View style={styles.expandedContent}>
                    <Text style={[styles.dataLabel, { color: theme.colors.textMuted }]}>Submitted Data</Text>
                    <View style={[styles.jsonBlock, { backgroundColor: 'rgba(0,0,0,0.3)', borderColor: theme.colors.border }]}>
                      <Text style={[styles.jsonText, { color: theme.colors.text }]}>
                        {JSON.stringify(sub.submitted_data, null, 2)}
                      </Text>
                    </View>

                    {sub.status === 'pending' && (
                      <>
                        <View style={[styles.applyNote, { backgroundColor: 'rgba(255,107,53,.1)', borderColor: 'rgba(255,107,53,.3)' }]}>
                          <Text style={[styles.applyNoteText, { color: theme.colors.text }]}>
                            On approve: {AUTO_APPLY[sub.submission_type]}
                          </Text>
                        </View>

                        <TextInput
                          style={[styles.notesInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                          placeholder="Admin notes (optional)"
                          placeholderTextColor={theme.colors.textMuted}
                          value={adminNotes[sub.id] ?? ''}
                          onChangeText={v => setAdminNotes(prev => ({ ...prev, [sub.id]: v }))}
                          multiline
                        />

                        <View style={styles.reviewBtns}>
                          <TouchableOpacity
                            style={styles.approveBtn}
                            onPress={() => handleReview(sub, 'approved')}
                            disabled={reviewing === sub.id}
                          >
                            {reviewing === sub.id
                              ? <ActivityIndicator color="#fff" size="small" />
                              : <Text style={styles.reviewBtnText}>Approve</Text>}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.rejectBtn}
                            onPress={() => handleReview(sub, 'rejected')}
                            disabled={reviewing === sub.id}
                          >
                            <Text style={styles.reviewBtnText}>Reject</Text>
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

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  filterRow: { marginBottom: 16 },
  filterChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  filterChipText: { fontSize: 13, fontWeight: '700' },
  emptyState: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: 'center' },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '800' },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { gap: 6 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typePill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  typePillText: { color: '#FF6B35', fontSize: 12, fontWeight: '700' },
  submitter: { fontSize: 12, fontWeight: '500' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardDate: { fontSize: 11, fontWeight: '500', marginTop: 6 },
  expandedContent: { marginTop: 14, gap: 10 },
  dataLabel: { fontSize: 12, fontWeight: '600' },
  jsonBlock: { borderRadius: 10, borderWidth: 1, padding: 12 },
  jsonText: { fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
  applyNote: { borderRadius: 10, borderWidth: 1, padding: 12 },
  applyNoteText: { fontSize: 13, fontWeight: '600' },
  notesInput: {
    borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, minHeight: 60, textAlignVertical: 'top',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  reviewBtns: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  rejectBtn: { flex: 1, backgroundColor: '#EF4444', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  reviewBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

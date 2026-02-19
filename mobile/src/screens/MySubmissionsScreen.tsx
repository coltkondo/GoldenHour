import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
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

export const MySubmissionsScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await submissionsAPI.getMine();
      setSubmissions(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalPoints = submissions
    .filter(s => s.status === 'approved')
    .reduce((sum, s) => sum + s.points_awarded, 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Submissions</Text>
        </View>

        {/* Points Banner */}
        <LinearGradient
          colors={['#FF6B35', '#FFD700']}
          style={styles.pointsBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.pointsLabel}>TOTAL POINTS</Text>
          <Text style={styles.pointsNumber}>{user?.points_balance ?? 0}</Text>
          <Text style={styles.pointsEarned}>{totalPoints} earned from submissions</Text>
        </LinearGradient>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {(['pending', 'approved', 'rejected'] as const).map(status => (
            <View key={status} style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.statNum, { color: STATUS_COLORS[status] }]}>
                {submissions.filter(s => s.status === status).length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
          ))}
        </View>

        {/* List */}
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : submissions.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={styles.emptyEmoji}>📮</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No submissions yet</Text>
            <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
              Spot a deal or bar? Submit it and earn points!
            </Text>
          </View>
        ) : (
          submissions.map(sub => (
            <View
              key={sub.id}
              style={[styles.subCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              <View style={styles.subHeader}>
                <Text style={[styles.subType, { color: theme.colors.text }]}>
                  {TYPE_LABELS[sub.submission_type] ?? sub.submission_type}
                </Text>
                <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLORS[sub.status]}22` }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[sub.status] }]}>
                    {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.subDate, { color: theme.colors.textMuted }]}>
                {new Date(sub.created_at).toLocaleDateString()}
              </Text>
              {sub.points_awarded > 0 && (
                <Text style={styles.pointsAwarded}>+{sub.points_awarded} pts</Text>
              )}
              {sub.admin_notes && (
                <Text style={[styles.adminNotes, { color: theme.colors.textMuted }]}>
                  Note: {sub.admin_notes}
                </Text>
              )}
            </View>
          ))
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  pointsBanner: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  pointsLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  pointsNumber: { color: '#fff', fontSize: 56, fontWeight: '900', letterSpacing: -2, lineHeight: 64 },
  pointsEarned: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '800' },
  emptySub: { fontSize: 14, textAlign: 'center', marginTop: 4 },
  subCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 4,
  },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subType: { fontSize: 15, fontWeight: '700' },
  statusPill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },
  subDate: { fontSize: 12, fontWeight: '500' },
  pointsAwarded: { color: '#10B981', fontSize: 14, fontWeight: '700' },
  adminNotes: { fontSize: 12, fontStyle: 'italic', marginTop: 2 },
});

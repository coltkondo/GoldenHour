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
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { submissionsAPI } from '../api/endpoints';
import type { Submission } from '../types/api';
import { AppIcon } from '../components/icons';

const TYPE_LABELS: Record<string, string> = {
  new_deal: 'New Deal',
  deal_update: 'Deal Update',
  deal_expired: 'Deal Expired',
  new_bar: 'New Bar',
  bar_closed: 'Bar Closed',
  bar_update: 'Bar Update',
};

const getStatusColor = (status: string) => {
  if (status === 'approved') return '#2DD4A0';
  if (status === 'rejected') return '#FF6B35';
  return '#F5A623';
};

const getStatusIconName = (status: string): 'clock' | 'correct' | 'x' => {
  if (status === 'approved') return 'correct';
  if (status === 'rejected') return 'x';
  return 'clock';
};

export const MySubmissionsScreen = () => {
  const { theme } = useTheme();
  const d = theme.derived;
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

  useEffect(() => {
    load();
  }, [load]);

  const totalPoints = submissions
    .filter((s) => s.status === 'approved')
    .reduce((sum, s) => sum + s.points_awarded, 0);

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
          <Text style={[styles.headerTitle, { color: d.text }]}>My Submissions</Text>
        </View>

        {/* Points Banner */}
        <View
          style={[
            styles.pointsBanner,
            { backgroundColor: d.cardBackground, borderColor: d.border },
          ]}
        >
          <AppIcon name="points" size={24} role="brand" />
          <Text style={[styles.pointsNumber, { color: d.primary }]}>
            {user?.points_balance ?? 0}
          </Text>
          <Text style={[styles.pointsLabel, { color: d.textMuted }]}>Total Points</Text>
          <Text style={[styles.pointsEarned, { color: d.textMuted }]}>
            {totalPoints} earned from submissions
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {(['pending', 'approved', 'rejected'] as const).map((status) => (
            <View key={status} style={styles.statItem}>
              <Text style={[styles.statNum, { color: getStatusColor(status) }]}>
                {submissions.filter((s) => s.status === status).length}
              </Text>
              <Text style={[styles.statLabel, { color: d.textMuted }]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={d.primary} style={{ marginTop: 40 }} />
        ) : submissions.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: d.cardBackground, borderColor: d.border },
            ]}
          >
            <Text style={[styles.emptyText, { color: d.text }]}>No submissions yet</Text>
            <Text style={[styles.emptySubtext, { color: d.textMuted }]}>
              Spot a deal or bar? Submit it and earn points!
            </Text>
          </View>
        ) : (
          submissions.map((sub) => {
            const statusColor = getStatusColor(sub.status);
            return (
              <View
                key={sub.id}
                style={[
                  styles.subCard,
                  { backgroundColor: d.cardBackground, borderColor: d.border },
                ]}
              >
                <View style={styles.subHeader}>
                  <Text style={[styles.subType, { color: d.text }]}>
                    {TYPE_LABELS[sub.submission_type] ?? sub.submission_type}
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: `${statusColor}15`, borderColor: statusColor },
                    ]}
                  >
                    <AppIcon name={getStatusIconName(sub.status)} size={14} color={statusColor} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.subDate, { color: d.textMuted }]}>
                  {new Date(sub.created_at).toLocaleDateString()}
                </Text>
                {sub.points_awarded > 0 && (
                  <View style={styles.pointsRow}>
                    <AppIcon name="points" size={12} role="brand" />
                    <Text style={[styles.pointsAwarded, { color: d.primary }]}>
                      +{sub.points_awarded} pts
                    </Text>
                  </View>
                )}
                {sub.admin_notes && (
                  <Text style={[styles.adminNotes, { color: d.textMuted }]}>
                    Note: {sub.admin_notes}
                  </Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  pointsBanner: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    gap: 4,
  },
  pointsLabel: { fontSize: 12, fontWeight: '500' },
  pointsNumber: { fontSize: 48, fontWeight: '800', letterSpacing: -2, lineHeight: 56 },
  pointsEarned: { fontSize: 13, fontWeight: '500' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 8,
  },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: '500', marginTop: 4 },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyText: { fontSize: 16, fontWeight: '600' },
  emptySubtext: { fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 4 },
  subCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10, gap: 6 },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subType: { fontSize: 14, fontWeight: '600' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  subDate: { fontSize: 11, fontWeight: '500' },
  pointsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pointsAwarded: { fontSize: 13, fontWeight: '700' },
  adminNotes: { fontSize: 12, fontWeight: '500', fontStyle: 'italic', marginTop: 2 },
});

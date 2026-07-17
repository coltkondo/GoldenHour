import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { leaderboardAPI } from '../api/endpoints';
import type { LeaderboardEntry } from '../types/api';
import { AppIcon } from '../components/icons';

export const LeaderboardScreen = () => {
  const { theme } = useTheme();
  const d = theme.derived;
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await leaderboardAPI.getTop(user?.market_slug);
        setEntries(data);
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const myEntry = entries.find((e) => e.user_id === user?.id);

  return (
    <View style={[styles.container, { backgroundColor: d.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <AppIcon name="back" size={22} role="default" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: d.text }]}>Leaderboard</Text>
        </View>

        {loadError && (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: d.cardBackground, borderColor: d.error },
            ]}
          >
            <Text style={[styles.errorText, { color: d.error }]}>Couldn't load leaderboard</Text>
          </View>
        )}

        {myEntry && (
          <View
            style={[
              styles.myRankBanner,
              { backgroundColor: d.cardBackground, borderColor: d.primary },
            ]}
          >
            <View style={styles.myRankLeft}>
              <Text style={[styles.myRankLabel, { color: d.textMuted }]}>YOUR RANK</Text>
              <Text style={[styles.myRankNum, { color: d.primary }]}>#{myEntry.rank}</Text>
            </View>
            <View style={styles.myRankRight}>
              <AppIcon name="points" size={14} role="brand" />
              <Text style={[styles.myRankPts, { color: d.primary }]}>
                {myEntry.points_balance} pts
              </Text>
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={d.primary} style={{ marginTop: 40 }} />
        ) : entries.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: d.cardBackground, borderColor: d.border },
            ]}
          >
            <Text style={[styles.emptyText, { color: d.text }]}>Be the first!</Text>
            <Text style={[styles.emptySubtext, { color: d.textMuted }]}>
              Submit deals and earn points to appear here
            </Text>
          </View>
        ) : (
          entries.map((entry, idx) => {
            const isMe = entry.user_id === user?.id;
            const isMedal = idx < 3;
            const medalColor = idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : '#CD7F32';
            return (
              <View
                key={entry.user_id}
                style={[
                  styles.entryCard,
                  { backgroundColor: d.cardBackground, borderColor: isMe ? d.primary : d.border },
                ]}
              >
                <View
                  style={[
                    styles.rankBadge,
                    { backgroundColor: isMedal ? medalColor : d.filterInactive },
                  ]}
                >
                  {isMedal ? (
                    <AppIcon name="trophy" size={16} color="#1a1a1a" />
                  ) : (
                    <Text style={[styles.rankNum, { color: d.textMuted }]}>{entry.rank}</Text>
                  )}
                </View>
                <View style={[styles.avatar, { backgroundColor: d.filterInactive }]}>
                  <Text style={[styles.avatarText, { color: d.text }]}>
                    {entry.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.entryInfo}>
                  <Text style={[styles.entryUsername, { color: d.text }]}>
                    {entry.username}
                    {isMe && <Text style={styles.youLabel}> (You)</Text>}
                  </Text>
                  <Text style={[styles.entryMeta, { color: d.textMuted }]}>
                    {entry.approved_count} approved
                  </Text>
                </View>
                <View style={styles.entryPointsRow}>
                  <AppIcon name="points" size={12} color={isMedal ? medalColor : d.primary} />
                  <Text style={[styles.entryPoints, { color: isMedal ? medalColor : d.primary }]}>
                    {entry.points_balance}
                  </Text>
                </View>
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
  errorBanner: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  myRankBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  myRankLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  myRankLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  myRankNum: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  myRankRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  myRankPts: { fontSize: 14, fontWeight: '700' },
  emptyState: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '600' },
  emptySubtext: { fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 4 },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNum: { fontSize: 13, fontWeight: '700' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '600' },
  entryInfo: { flex: 1 },
  entryUsername: { fontSize: 14, fontWeight: '600' },
  youLabel: { fontSize: 12, fontWeight: '500', color: '#888888' },
  entryMeta: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  entryPointsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  entryPoints: { fontSize: 15, fontWeight: '700' },
});

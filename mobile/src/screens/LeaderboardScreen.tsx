import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { leaderboardAPI } from '../api/endpoints';
import type { LeaderboardEntry } from '../types/api';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export const LeaderboardScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await leaderboardAPI.getTop();
        setEntries(data);
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const myEntry = entries.find(e => e.user_id === user?.id);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Leaderboard</Text>
        </View>

        {loadError && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={20} color="#EF4444" />
            <Text style={styles.errorText}>Couldn't load leaderboard</Text>
          </View>
        )}

        {/* My rank banner */}
        {myEntry && (
          <LinearGradient
            colors={['#FF6B35', '#FFD700']}
            style={styles.myRankBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.myRankLabel}>YOUR RANK</Text>
            <Text style={styles.myRankNum}>#{myEntry.rank}</Text>
            <Text style={styles.myRankPts}>{myEntry.points_balance} pts</Text>
          </LinearGradient>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : entries.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Be the first!</Text>
            <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
              Submit deals and earn points to appear here
            </Text>
          </View>
        ) : (
          entries.map((entry, idx) => {
            const isMe = entry.user_id === user?.id;
            const isMedal = idx < 3;
            return (
              <View
                key={entry.user_id}
                style={[
                  styles.entryCard,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  isMe && styles.entryCardMe,
                ]}
              >
                {/* Rank */}
                <View style={[
                  styles.rankBadge,
                  { backgroundColor: isMedal ? MEDAL_COLORS[idx] : theme.colors.border },
                ]}>
                  <Text style={[styles.rankNum, { color: isMedal ? '#000' : theme.colors.textMuted }]}>
                    {entry.rank}
                  </Text>
                </View>

                {/* Avatar */}
                <LinearGradient
                  colors={isMe ? ['#FF6B35', '#FFD700'] : ['#2d3142', '#3a3f56']}
                  style={styles.avatar}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.avatarText}>
                    {entry.username.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>

                {/* Info */}
                <View style={styles.entryInfo}>
                  <Text style={[styles.entryUsername, { color: theme.colors.text }, isMe && styles.usernameMe]}>
                    {entry.username} {isMe && '(You)'}
                  </Text>
                  <Text style={[styles.entryMeta, { color: theme.colors.textMuted }]}>
                    {entry.approved_count} approved submission{entry.approved_count !== 1 ? 's' : ''}
                  </Text>
                </View>

                {/* Points */}
                <Text style={[styles.entryPoints, { color: isMedal ? MEDAL_COLORS[idx] : theme.colors.text }]}>
                  {entry.points_balance}
                </Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  myRankBanner: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  myRankLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  myRankNum: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  myRankPts: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '700', marginLeft: 'auto' },
  emptyState: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: 'center' },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '800' },
  emptySub: { fontSize: 14, textAlign: 'center', marginTop: 4 },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  entryCardMe: { borderColor: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.05)' },
  rankBadge: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rankNum: { fontSize: 14, fontWeight: '900' },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  entryInfo: { flex: 1 },
  entryUsername: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  usernameMe: { color: '#FF6B35' },
  entryMeta: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  entryPoints: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
});

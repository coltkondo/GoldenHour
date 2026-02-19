import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, TimePeriod } from '../theme';
import { GradientBackground } from '../components/common/GradientBackground';
import { useAuth } from '../context/AuthContext';

export const ProfileScreen = () => {
  const { theme, timePeriod, forceTimePeriod } = useTheme();
  const { user, isAdmin, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <GradientBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={['#FF6B35', '#FFD700']}
            style={styles.avatarGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>
              {(user?.username ?? 'G').charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {user?.username ?? 'Guest'}
          </Text>
          <Text style={[styles.userHandle, { color: theme.colors.textMuted }]}>
            {user?.email ?? ''}
          </Text>
          {isAdmin && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#FF6B35" />
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.statCardNum, { color: '#FF6B35' }]}>{user?.points_balance ?? 0}</Text>
            <Text style={[styles.statCardLabel, { color: theme.colors.textMuted }]}>POINTS</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.statCardNum, { color: theme.colors.text }]}>—</Text>
            <Text style={[styles.statCardLabel, { color: theme.colors.textMuted }]}>RANK</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.statCardNum, { color: theme.colors.text }]}>—</Text>
            <Text style={[styles.statCardLabel, { color: theme.colors.textMuted }]}>APPROVED</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Contribute</Text>
          <View style={[styles.actionsList, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('QuickSubmit')} activeOpacity={0.7}>
              <View style={styles.actionLeft}>
                <LinearGradient colors={['#FF6B35', '#FFD700']} style={styles.actionIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="add" size={18} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.actionLabel, { color: theme.colors.text }]}>Submit a Deal</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('MySubmissions')} activeOpacity={0.7}>
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,107,53,0.15)' }]}>
                  <Ionicons name="list" size={18} color="#FF6B35" />
                </View>
                <Text style={[styles.actionLabel, { color: theme.colors.text }]}>My Submissions</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('Leaderboard')} activeOpacity={0.7}>
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,215,0,0.15)' }]}>
                  <Ionicons name="trophy" size={18} color="#FFD700" />
                </View>
                <Text style={[styles.actionLabel, { color: theme.colors.text }]}>Leaderboard</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>

            {isAdmin && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('AdminReview')} activeOpacity={0.7}>
                  <View style={styles.actionLeft}>
                    <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,107,53,0.15)' }]}>
                      <Ionicons name="shield-checkmark" size={18} color="#FF6B35" />
                    </View>
                    <Text style={[styles.actionLabel, { color: theme.colors.text }]}>Review Queue</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Settings</Text>
          <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.settingsRow}>
              <View style={styles.settingsLeft}>
                <Ionicons name="notifications" size={20} color={theme.colors.primary} />
                <Text style={[styles.settingsLabel, { color: theme.colors.text }]}>Happy Hour Alerts</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: theme.colors.border, true: '#FF6B35' }}
                thumbColor="#FFF"
              />
            </View>

            <View style={[styles.settingsDivider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.settingsRow}>
              <View style={styles.settingsLeft}>
                <Ionicons name="color-palette" size={20} color={theme.colors.primary} />
                <Text style={[styles.settingsLabel, { color: theme.colors.text }]}>Theme Preview</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themePreview} contentContainerStyle={styles.themePreviewContent}>
              {(['lateNight', 'morning', 'afternoon', 'goldenHour', 'evening'] as TimePeriod[]).map((period) => {
                const isActive = timePeriod === period;
                const labels: Record<TimePeriod, string> = { lateNight: '12-6am', morning: '6am-12', afternoon: '12-5pm', goldenHour: '5-8pm', evening: '8pm-12' };
                const gradients: Record<TimePeriod, [string, string]> = { lateNight: ['#4A148C', '#7C4DFF'], morning: ['#42A5F5', '#FFD54F'], afternoon: ['#1976D2', '#FFB300'], goldenHour: ['#FF6B35', '#FFD700'], evening: ['#0D1B2A', '#FFD700'] };
                return (
                  <TouchableOpacity key={period} onPress={() => forceTimePeriod(isActive ? null : period)} activeOpacity={0.8}>
                    <LinearGradient colors={gradients[period]} style={[styles.themeChip, isActive && styles.themeChipActive]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      <Text style={styles.themeChipText}>{labels[period]}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={[styles.settingsDivider, { backgroundColor: theme.colors.border }]} />

            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7} onPress={logout}>
              <View style={styles.settingsLeft}>
                <Ionicons name="log-out" size={20} color="#EF4444" />
                <Text style={[styles.settingsLabel, { color: '#EF4444' }]}>Sign Out</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 20 },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  avatarGradient: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#FFFFFF' },
  userName: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  userHandle: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,107,53,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  adminBadgeText: { color: '#FF6B35', fontSize: 12, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 14, alignItems: 'center' },
  statCardNum: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  statCardLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginBottom: 14 },
  actionsList: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, marginHorizontal: 16 },
  settingsCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  settingsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsLabel: { fontSize: 15, fontWeight: '600' },
  settingsDivider: { height: 1, marginHorizontal: 16 },
  themePreview: { marginBottom: 8 },
  themePreviewContent: { paddingHorizontal: 16, gap: 8 },
  themeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  themeChipActive: { borderWidth: 2, borderColor: '#FFD700' },
  themeChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});

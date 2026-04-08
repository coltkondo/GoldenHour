import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { AppIcon } from '../components/icons';
import { authAPI } from '../api/endpoints';

export const ProfileScreen = () => {
  const { user, isAdmin, logout, refreshUser } = useAuth();

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      authAPI.me()
        .then((freshUser) => refreshUser(freshUser))
        .catch(() => {}); // network failure: keep showing stale balance
    }, [user?.id]),
  );
  const navigation = useNavigation<any>();
  const { theme, mode, toggleMode } = useTheme();
  const d = theme.derived;
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const getInitials = () => {
    const username = user?.username ?? 'Guest';
    if (username.length >= 2) return username.substring(0, 2).toUpperCase();
    return username.charAt(0).toUpperCase();
  };

  return (
    <View style={[styles.container, { backgroundColor: d.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View
            style={[styles.avatar, { backgroundColor: d.filterInactive, borderColor: d.border }]}
          >
            <Text style={[styles.avatarText, { color: d.primary }]}>{getInitials()}</Text>
          </View>
          <Text style={[styles.userName, { color: d.text }]}>{user?.username ?? 'Guest'}</Text>
          <Text style={[styles.userEmail, { color: d.textMuted }]}>{user?.email ?? ''}</Text>
          {isAdmin && (
            <View
              style={[
                styles.adminBadge,
                { backgroundColor: 'rgba(45,212,160,0.12)', borderColor: d.live },
              ]}
            >
              <Text style={[styles.adminBadgeText, { color: d.live }]}>Admin</Text>
            </View>
          )}
        </View>

        {/* Stats Row */}
        <View
          style={[styles.statsCard, { backgroundColor: d.cardBackground, borderColor: d.border }]}
        >
          <View style={styles.statItem}>
            <AppIcon name="points" size={16} role="brand" />
            <Text style={[styles.statNum, { color: d.primary }]}>{user?.points_balance ?? 0}</Text>
            <Text style={[styles.statLabel, { color: d.textMuted }]}>Points</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: d.divider }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: d.text }]}>—</Text>
            <Text style={[styles.statLabel, { color: d.textMuted }]}>Rank</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: d.divider }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: d.live }]}>—</Text>
            <Text style={[styles.statLabel, { color: d.textMuted }]}>Approved</Text>
          </View>
        </View>

        {/* Contribute Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: d.text }]}>CONTRIBUTE</Text>
          <View style={[styles.card, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('QuickSubmit')}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: d.filterInactive }]}>
                  <AppIcon name="plus" size={18} role="brand" />
                </View>
                <Text style={[styles.rowLabel, { color: d.text }]}>Submit a Deal</Text>
              </View>
              <AppIcon name="chevronRight" size={16} role="muted" />
            </TouchableOpacity>

            <View style={[styles.separator, { backgroundColor: d.divider }]} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('MySubmissions')}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: d.filterInactive }]}>
                  <AppIcon name="list" size={18} role="brand" />
                </View>
                <Text style={[styles.rowLabel, { color: d.text }]}>My Submissions</Text>
              </View>
              <AppIcon name="chevronRight" size={16} role="muted" />
            </TouchableOpacity>

            <View style={[styles.separator, { backgroundColor: d.divider }]} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('Leaderboard')}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: d.filterInactive }]}>
                  <AppIcon name="trophy" size={18} role="brand" />
                </View>
                <Text style={[styles.rowLabel, { color: d.text }]}>Leaderboard</Text>
              </View>
              <AppIcon name="chevronRight" size={16} role="muted" />
            </TouchableOpacity>

            {isAdmin && (
              <>
                <View style={[styles.separator, { backgroundColor: d.divider }]} />
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => navigation.navigate('AdminReview')}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.rowIcon, { backgroundColor: d.filterInactive }]}>
                      <AppIcon name="shield" size={18} role="positive" />
                    </View>
                    <Text style={[styles.rowLabel, { color: d.text }]}>Review Queue</Text>
                  </View>
                  <AppIcon name="chevronRight" size={16} role="muted" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: d.text }]}>APPEARANCE</Text>
          <View style={[styles.card, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: d.filterInactive }]}>
                  <AppIcon name={mode === 'dark' ? 'moon' : 'sun'} size={18} role="brand" />
                </View>
                <View>
                  <Text style={[styles.rowLabel, { color: d.text }]}>Dark Mode</Text>
                  <Text style={[styles.rowHint, { color: d.textMuted }]}>
                    {mode === 'dark' ? 'On' : 'Off'}
                  </Text>
                </View>
              </View>
              <Switch
                value={mode === 'dark'}
                onValueChange={toggleMode}
                trackColor={{ false: d.filterInactive, true: d.primary }}
                thumbColor={d.background}
              />
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: d.text }]}>SETTINGS</Text>
          <View style={[styles.card, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: d.filterInactive }]}>
                  <AppIcon name="bell" size={18} role="brand" />
                </View>
                <Text style={[styles.rowLabel, { color: d.text }]}>Happy Hour Alerts</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: d.filterInactive, true: d.live }}
                thumbColor={d.background}
              />
            </View>
            <Text style={[styles.hintText, { color: d.textMuted }]}>Active 5pm – 9pm daily</Text>

            <View style={[styles.separator, { backgroundColor: d.divider }]} />

            <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={logout}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: 'rgba(255,107,53,0.12)' }]}>
                  <AppIcon name="logout" size={18} role="urgent" />
                </View>
                <Text style={[styles.logoutLabel, { color: d.error }]}>Sign Out</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 16 },

  profileHeader: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: { fontSize: 20, fontWeight: '700' },
  userName: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  userEmail: { fontSize: 12, fontWeight: '500', marginTop: 4 },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  adminBadgeText: { fontSize: 11, fontWeight: '700' },

  statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 20,
    marginBottom: 28,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, marginHorizontal: 0 },
  statNum: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: '500' },

  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12 },

  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: { fontSize: 14, fontWeight: '500' },
  rowHint: { fontSize: 11, fontWeight: '400', marginTop: 2 },
  separator: { height: 0.5, marginLeft: 60 },

  hintText: {
    fontSize: 11,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 2,
  },
  logoutLabel: { fontSize: 14, fontWeight: '500' },
});

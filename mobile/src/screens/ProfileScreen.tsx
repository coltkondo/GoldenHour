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
import { useTheme, TimePeriod } from '../theme';
import { GradientBackground } from '../components/common/GradientBackground';

// Mock user data (to be replaced with real auth + API)
const USER = {
  name: 'Happy Hour Explorer',
  handle: '@goldenhour_dc',
  totalVisits: 23,
  uniqueVenues: 15,
  totalReviews: 8,
  totalPhotos: 4,
  memberSince: 'Jan 2025',
  favoriteNeighborhood: 'Dupont Circle',
};

const VISITED_VENUES = [
  { id: '1', name: 'The Hamilton', rating: 5, visits: 4, lastVisit: '2 days ago', neighborhood: 'Penn Quarter' },
  { id: '2', name: 'Bar Charley', rating: 5, visits: 3, lastVisit: '1 week ago', neighborhood: 'Dupont Circle' },
  { id: '3', name: 'Dan\'s Cafe', rating: 4, visits: 2, lastVisit: '2 weeks ago', neighborhood: 'Adams Morgan' },
  { id: '4', name: 'Blagden Alley', rating: 4, visits: 2, lastVisit: '3 weeks ago', neighborhood: 'Shaw' },
  { id: '5', name: 'Archipelago', rating: 5, visits: 1, lastVisit: '1 month ago', neighborhood: 'U Street' },
];

const RECENTLY_VIEWED = [
  { id: '6', name: 'The Wharf', neighborhood: 'Southwest' },
  { id: '7', name: 'Bluejacket', neighborhood: 'Navy Yard' },
  { id: '8', name: 'Dacha Beer Garden', neighborhood: 'Shaw' },
];

export const ProfileScreen = () => {
  const { theme, timePeriod, forceTimePeriod } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeOverride, setDarkModeOverride] = useState(false);

  const renderStars = (rating: number) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={12}
          color="#FFD700"
          style={{ marginRight: 1 }}
        />
      ))}
    </View>
  );

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
              {USER.name.charAt(0)}
            </Text>
          </LinearGradient>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {USER.name}
          </Text>
          <Text style={[styles.userHandle, { color: theme.colors.textMuted }]}>
            {USER.handle}
          </Text>
          <Text style={[styles.memberSince, { color: theme.colors.textMuted }]}>
            Member since {USER.memberSince}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.statCardNum, { color: theme.colors.text }]}>{USER.totalVisits}</Text>
            <Text style={[styles.statCardLabel, { color: theme.colors.textMuted }]}>VISITS</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.statCardNum, { color: theme.colors.text }]}>{USER.uniqueVenues}</Text>
            <Text style={[styles.statCardLabel, { color: theme.colors.textMuted }]}>VENUES</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.statCardNum, { color: theme.colors.text }]}>{USER.totalReviews}</Text>
            <Text style={[styles.statCardLabel, { color: theme.colors.textMuted }]}>REVIEWS</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.statCardNum, { color: theme.colors.text }]}>{USER.totalPhotos}</Text>
            <Text style={[styles.statCardLabel, { color: theme.colors.textMuted }]}>PHOTOS</Text>
          </View>
        </View>

        {/* Favorite Neighborhood */}
        <View style={[styles.favoriteCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.favoriteLeft}>
            <Text style={styles.favoriteEmoji}>🏠</Text>
            <View>
              <Text style={[styles.favoriteLabel, { color: theme.colors.textMuted }]}>
                FAVORITE NEIGHBORHOOD
              </Text>
              <Text style={[styles.favoriteName, { color: theme.colors.text }]}>
                {USER.favoriteNeighborhood}
              </Text>
            </View>
          </View>
          <Ionicons name="heart" size={20} color="#FF6B35" />
        </View>

        {/* Rankings / Your Venues */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🏆 Your Rankings
          </Text>
          {VISITED_VENUES.map((venue, index) => (
            <View
              key={venue.id}
              style={[styles.rankCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              <View style={[styles.rankBadge, { backgroundColor: index < 3 ? '#FFD700' : theme.colors.border }]}>
                <Text style={[styles.rankNum, { color: index < 3 ? '#000' : theme.colors.textMuted }]}>
                  #{index + 1}
                </Text>
              </View>
              <View style={styles.rankContent}>
                <Text style={[styles.rankName, { color: theme.colors.text }]}>{venue.name}</Text>
                <View style={styles.rankMeta}>
                  {renderStars(venue.rating)}
                  <Text style={[styles.rankVisits, { color: theme.colors.textMuted }]}>
                    {venue.visits} visits
                  </Text>
                </View>
                <Text style={[styles.rankNeighborhood, { color: theme.colors.textMuted }]}>
                  📍 {venue.neighborhood} · {venue.lastVisit}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recently Viewed */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🕐 Recently Viewed
          </Text>
          {RECENTLY_VIEWED.map((venue) => (
            <TouchableOpacity
              key={venue.id}
              style={[styles.recentCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              activeOpacity={0.8}
            >
              <View style={styles.recentInfo}>
                <Text style={[styles.recentName, { color: theme.colors.text }]}>{venue.name}</Text>
                <Text style={[styles.recentHood, { color: theme.colors.textMuted }]}>{venue.neighborhood}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Settings
          </Text>

          <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {/* Notifications */}
            <View style={styles.settingsRow}>
              <View style={styles.settingsLeft}>
                <Ionicons name="notifications" size={20} color={theme.colors.primary} />
                <Text style={[styles.settingsLabel, { color: theme.colors.text }]}>
                  Happy Hour Alerts
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: theme.colors.border, true: '#FF6B35' }}
                thumbColor="#FFF"
              />
            </View>

            <View style={[styles.settingsDivider, { backgroundColor: theme.colors.border }]} />

            {/* Theme Preview */}
            <View style={styles.settingsRow}>
              <View style={styles.settingsLeft}>
                <Ionicons name="color-palette" size={20} color={theme.colors.primary} />
                <Text style={[styles.settingsLabel, { color: theme.colors.text }]}>
                  Theme Preview
                </Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.themePreview}
              contentContainerStyle={styles.themePreviewContent}
            >
              {(['lateNight', 'morning', 'afternoon', 'goldenHour', 'evening'] as TimePeriod[]).map(
                (period) => {
                  const isActive = timePeriod === period;
                  const labels: Record<TimePeriod, string> = {
                    lateNight: '12-6am',
                    morning: '6am-12',
                    afternoon: '12-5pm',
                    goldenHour: '5-8pm',
                    evening: '8pm-12',
                  };
                  const gradients: Record<TimePeriod, [string, string]> = {
                    lateNight: ['#4A148C', '#7C4DFF'],
                    morning: ['#42A5F5', '#FFD54F'],
                    afternoon: ['#1976D2', '#FFB300'],
                    goldenHour: ['#FF6B35', '#FFD700'],
                    evening: ['#0D1B2A', '#FFD700'],
                  };
                  return (
                    <TouchableOpacity
                      key={period}
                      onPress={() => forceTimePeriod(isActive ? null : period)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={gradients[period]}
                        style={[
                          styles.themeChip,
                          isActive && styles.themeChipActive,
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.themeChipText}>{labels[period]}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                }
              )}
            </ScrollView>

            <View style={[styles.settingsDivider, { backgroundColor: theme.colors.border }]} />

            {/* About */}
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <View style={styles.settingsLeft}>
                <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
                <Text style={[styles.settingsLabel, { color: theme.colors.text }]}>
                  About Golden Hour
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  userHandle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  memberSince: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statCardNum: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statCardLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },

  // Favorite Card
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 24,
  },
  favoriteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  favoriteEmoji: {
    fontSize: 28,
  },
  favoriteLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 14,
  },

  // Rankings
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNum: {
    fontSize: 13,
    fontWeight: '900',
  },
  rankContent: {
    flex: 1,
  },
  rankName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  rankMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
  },
  rankVisits: {
    fontSize: 12,
    fontWeight: '600',
  },
  rankNeighborhood: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  // Recently Viewed
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 15,
    fontWeight: '700',
  },
  recentHood: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },

  // Settings
  settingsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingsDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  themePreview: {
    marginBottom: 8,
  },
  themePreviewContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  themeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  themeChipActive: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  themeChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

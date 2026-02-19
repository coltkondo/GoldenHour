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

// Mock user data
const USER = {
  name: 'Happy Hour Explorer',
  handle: '@goldenhour_dc',
  totalVisits: 23,
  uniqueVenues: 15,
  totalReviews: 8,
  memberSince: 'Jan 2025',
  favoriteNeighborhood: 'Dupont Circle',
};

const VISITED_VENUES = [
  { id: '1', name: 'The Hamilton', rating: 5, visits: 4, neighborhood: 'Penn Quarter' },
  { id: '2', name: 'Bar Charley', rating: 5, visits: 3, neighborhood: 'Dupont Circle' },
  { id: '3', name: 'Dan\'s Cafe', rating: 4, visits: 2, neighborhood: 'Adams Morgan' },
  { id: '4', name: 'Blagden Alley', rating: 4, visits: 2, neighborhood: 'Shaw' },
  { id: '5', name: 'Archipelago', rating: 5, visits: 1, neighborhood: 'U Street' },
];


export const ProfileScreen = () => {
  const { theme, timePeriod, forceTimePeriod } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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
        {/* Profile Header - Gold accent */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.avatarGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>
              {USER.name.charAt(0)}
            </Text>
          </LinearGradient>
          <Text style={styles.userName}>{USER.name}</Text>
          <Text style={styles.userHandle}>{USER.handle}</Text>
          <Text style={styles.memberSince}>Member since {USER.memberSince}</Text>
        </View>

        {/* Stats Grid - Simplified */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statCardNum}>{USER.totalVisits}</Text>
            <Text style={styles.statCardLabel}>VISITS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCardNum}>{USER.uniqueVenues}</Text>
            <Text style={styles.statCardLabel}>VENUES</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCardNum}>{USER.totalReviews}</Text>
            <Text style={styles.statCardLabel}>REVIEWS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statCardNum, { color: '#FFD700' }]}>#{3}</Text>
            <Text style={styles.statCardLabel}>RANK</Text>
          </View>
        </View>

        {/* Favorite Hood - Simplified */}
        <View style={styles.favoriteCard}>
          <View style={styles.favoriteContent}>
            <Text style={styles.favoriteLabel}>FAVORITE NEIGHBORHOOD</Text>
            <Text style={styles.favoriteName}>{USER.favoriteNeighborhood}</Text>
          </View>
          <Ionicons name="heart" size={24} color="#FFD700" />
        </View>

        {/* Rankings - Max 3 elements per card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Top Venues</Text>
          {VISITED_VENUES.map((venue, index) => (
            <View key={venue.id} style={styles.rankCard}>
              {/* Gold badge for top 3 */}
              <View style={[styles.rankBadge, index < 3 && styles.rankBadgeGold]}>
                <Text style={[styles.rankNum, index < 3 && styles.rankNumGold]}>
                  #{index + 1}
                </Text>
              </View>
              <View style={styles.rankContent}>
                {/* 1. Venue name */}
                <Text style={styles.rankName}>{venue.name}</Text>
                {/* 2. Rating + visits */}
                <View style={styles.rankMeta}>
                  {renderStars(venue.rating)}
                  <Text style={styles.rankVisits}>{venue.visits} visits</Text>
                </View>
                {/* 3. Location */}
                <View style={styles.rankLocation}>
                  <Ionicons name="location" size={12} color="#5A5D66" />
                  <Text style={styles.rankNeighborhood}>{venue.neighborhood}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.settingsCard}>
            {/* Notifications */}
            <View style={styles.settingsRow}>
              <View style={styles.settingsLeft}>
                <Ionicons name="notifications-outline" size={22} color="#FFD700" />
                <Text style={styles.settingsLabel}>Happy Hour Alerts</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: '#FFD700' }}
                thumbColor="#F5F7FA"
                ios_backgroundColor="rgba(255, 255, 255, 0.1)"
              />
            </View>

            <View style={styles.settingsDivider} />

            {/* Theme Preview */}
            <View style={styles.settingsSection}>
              <View style={styles.settingsRow}>
                <View style={styles.settingsLeft}>
                  <Ionicons name="color-palette-outline" size={22} color="#FFD700" />
                  <Text style={styles.settingsLabel}>Theme Preview</Text>
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
                    return (
                      <TouchableOpacity
                        key={period}
                        onPress={() => forceTimePeriod(isActive ? null : period)}
                        activeOpacity={0.8}
                        style={[
                          styles.themeChip,
                          isActive && styles.themeChipActive,
                        ]}
                      >
                        <Text style={styles.themeChipText}>{labels[period]}</Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </ScrollView>
            </View>

            <View style={styles.settingsDivider} />

            {/* About */}
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <View style={styles.settingsLeft}>
                <Ionicons name="information-circle-outline" size={22} color="#FFD700" />
                <Text style={styles.settingsLabel}>About Golden Hour</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#5A5D66" />
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
    marginBottom: 28,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F0F14',
  },
  userName: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.8,
    color: '#F5F7FA',
  },
  userHandle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    color: '#A0A3AD',
  },
  memberSince: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    color: '#5A5D66',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#171A21',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 16,
    alignItems: 'center',
  },
  statCardNum: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#F5F7FA',
  },
  statCardLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 4,
    color: '#5A5D66',
  },

  // Favorite Card
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#171A21',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    padding: 16,
    marginBottom: 28,
  },
  favoriteContent: {
    flex: 1,
  },
  favoriteLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#5A5D66',
    marginBottom: 4,
  },
  favoriteName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F5F7FA',
    letterSpacing: -0.3,
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 14,
    color: '#F5F7FA',
  },

  // Rankings - Max 3 elements
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171A21',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
    marginBottom: 10,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rankBadgeGold: {
    backgroundColor: '#FFD700',
  },
  rankNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#5A5D66',
  },
  rankNumGold: {
    color: '#0F0F14',
  },
  rankContent: {
    flex: 1,
  },
  rankName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: '#F5F7FA',
    marginBottom: 6,
  },
  rankMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
  },
  rankVisits: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0A3AD',
  },
  rankLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rankNeighborhood: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A5D66',
  },

  // Settings
  settingsCard: {
    backgroundColor: '#171A21',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  settingsSection: {
    paddingVertical: 12,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F5F7FA',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: 18,
  },
  themePreview: {
    marginTop: 12,
  },
  themePreviewContent: {
    paddingHorizontal: 18,
    gap: 10,
  },
  themeChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeChipActive: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  themeChipText: {
    color: '#F5F7FA',
    fontSize: 13,
    fontWeight: '800',
  },
});
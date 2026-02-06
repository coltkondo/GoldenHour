import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useLocation } from '../hooks/useLocation';
import { venuesAPI, dealsAPI } from '../api/endpoints';
import { Venue, Deal } from '../types/api';
import { MiniMap } from '../components/Map/MiniMap';
import { DealCard } from '../components/Cards/DealCard';
import { GradientBackground } from '../components/common/GradientBackground';

const { width } = Dimensions.get('window');

const TIME_GREETINGS: Record<string, { greeting: string; emoji: string; sub: string }> = {
  lateNight: { greeting: "Night Owl", emoji: "🦉", sub: "Late night specials are calling" },
  morning: { greeting: "Rise & Sip", emoji: "☀️", sub: "Plan today's happy hour moves" },
  afternoon: { greeting: "Almost Time", emoji: "⏰", sub: "Happy hour is right around the corner" },
  goldenHour: { greeting: "It's Golden Hour", emoji: "🌅", sub: "The deals are live. Go get 'em." },
  evening: { greeting: "Cheers", emoji: "🌙", sub: "Night's young, deals are flowing" },
};

export const HomeScreen = () => {
  const { theme, timePeriod } = useTheme();
  const { location, loading: locationLoading } = useLocation();
  const navigation = useNavigation<any>();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const greetingData = TIME_GREETINGS[timePeriod];

  useEffect(() => {
    if (!locationLoading && location) {
      loadData();
    }
  }, [locationLoading, location]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [venueData, dealData] = await Promise.all([
        venuesAPI.getNearby(location.latitude, location.longitude, 10000),
        dealsAPI.getActive().catch(() => []),
      ]);
      setVenues(venueData);
      setDeals(dealData);
    } catch (err) {
      console.error('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const navigateToMap = () => {
    navigation.navigate('MapTab');
  };

  const navigateToVenue = (venue: Venue) => {
    navigation.navigate('HappyHour', { venue });
  };

  const navigateToExplorer = () => {
    navigation.navigate('ExplorerTab');
  };

  if (locationLoading || loading) {
    return (
      <GradientBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.textOnPrimary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Finding happy hours near you...
          </Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.text} />
        }
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greetingEmoji]}>{greetingData.emoji}</Text>
            <Text style={[styles.greetingTitle, { color: theme.colors.text }]}>
              {greetingData.greeting}
            </Text>
            <Text style={[styles.greetingSub, { color: theme.colors.textSecondary }]}>
              {greetingData.sub}
            </Text>
          </View>

          {/* COD-style Mini Map */}
          <MiniMap
            userLocation={location}
            venues={venues}
            onPress={navigateToMap}
          />
        </View>

        {/* Quick Stats Bar */}
        <View style={[styles.statsBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>{venues.length}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>NEARBY</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>{deals.length}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>DEALS LIVE</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.secondary }]}>
              {timePeriod === 'goldenHour' ? 'NOW' : '5PM'}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
              {timePeriod === 'goldenHour' ? 'LIVE' : 'NEXT UP'}
            </Text>
          </View>
        </View>

        {/* Quick Navigation Cards */}
        <View style={styles.quickNav}>
          <TouchableOpacity
            style={[styles.quickNavCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            activeOpacity={0.8}
            onPress={navigateToMap}
          >
            <LinearGradient
              colors={['#FF6B35', '#FF8A50']}
              style={styles.quickNavIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="map" size={22} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.quickNavTitle, { color: theme.colors.text }]}>Map View</Text>
            <Text style={[styles.quickNavSub, { color: theme.colors.textMuted }]}>See all spots</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickNavCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            activeOpacity={0.8}
            onPress={navigateToExplorer}
          >
            <LinearGradient
              colors={['#FFD700', '#FFB300']}
              style={styles.quickNavIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="compass" size={22} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.quickNavTitle, { color: theme.colors.text }]}>Explore</Text>
            <Text style={[styles.quickNavSub, { color: theme.colors.textMuted }]}>Earn rewards</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickNavCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ProfileTab')}
          >
            <LinearGradient
              colors={['#7C4DFF', '#B388FF']}
              style={styles.quickNavIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="person" size={22} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.quickNavTitle, { color: theme.colors.text }]}>Profile</Text>
            <Text style={[styles.quickNavSub, { color: theme.colors.textMuted }]}>Your stats</Text>
          </TouchableOpacity>
        </View>

        {/* Active Deals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              🔥 Deals Right Now
            </Text>
            <TouchableOpacity onPress={navigateToMap}>
              <Text style={[styles.seeAll, { color: theme.colors.secondary }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {deals.length > 0 ? (
            deals.slice(0, 5).map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onPress={() => {
                  const venue = venues.find(v => v.id === deal.venue_id);
                  if (venue) navigateToVenue(venue);
                }}
              />
            ))
          ) : (
            <View style={[styles.emptyDeals, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={styles.emptyIcon}>🍻</Text>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                Deals loading up soon
              </Text>
              <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
                Check back during happy hour for live deals
              </Text>
            </View>
          )}
        </View>

        {/* Nearby Venues Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              📍 Near You
            </Text>
            <TouchableOpacity onPress={navigateToMap}>
              <Text style={[styles.seeAll, { color: theme.colors.secondary }]}>Map View</Text>
            </TouchableOpacity>
          </View>

          {venues.slice(0, 6).map((venue) => (
            <TouchableOpacity
              key={venue.id}
              style={[styles.venueRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              activeOpacity={0.8}
              onPress={() => navigateToVenue(venue)}
            >
              <View style={styles.venueEmoji}>
                <Text style={{ fontSize: 24 }}>
                  {getVenueEmoji(venue.venue_type)}
                </Text>
              </View>
              <View style={styles.venueInfo}>
                <Text style={[styles.venueRowName, { color: theme.colors.text }]} numberOfLines={1}>
                  {venue.name}
                </Text>
                <Text style={[styles.venueRowNeighborhood, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  {venue.neighborhood || venue.address}
                </Text>
              </View>
              {venue.active && (
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </GradientBackground>
  );
};

function getVenueEmoji(type: string | null): string {
  if (!type) return '🍻';
  const lower = type.toLowerCase();
  if (lower.includes('bar')) return '🍺';
  if (lower.includes('restaurant')) return '🍽️';
  if (lower.includes('club')) return '🎵';
  if (lower.includes('rooftop')) return '🌆';
  if (lower.includes('brewery')) return '🍺';
  if (lower.includes('wine')) return '🍷';
  if (lower.includes('lounge')) return '🍸';
  if (lower.includes('pub')) return '🍺';
  return '🍻';
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },

  // Header
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  greetingEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  greetingTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 36,
  },
  greetingSub: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 6,
    lineHeight: 20,
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },

  // Quick Nav
  quickNav: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  quickNavCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  quickNavIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickNavTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickNavSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Empty deals state
  emptyDeals: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Venue Rows
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  venueEmoji: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  venueInfo: {
    flex: 1,
    marginRight: 8,
  },
  venueRowName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  venueRowNeighborhood: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  liveText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

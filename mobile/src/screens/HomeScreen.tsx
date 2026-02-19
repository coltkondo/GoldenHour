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
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>
            Finding happy hours near you...
          </Text>
        </View>
      </GradientBackground>
    );
  }

  // PRIMARY ACTION: Show Map if deals are live, otherwise show Explore
  const primaryAction = timePeriod === 'goldenHour' || deals.length > 0 ? 'map' : 'explore';

  return (
    <GradientBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />
        }
      >
        {/* Header Section - Simplified */}
        <View style={styles.headerSection}>
          <Text style={styles.greetingTitle}>
            {greetingData.greeting}
          </Text>
          <Text style={styles.greetingSub}>
            {greetingData.sub}
          </Text>
        </View>

        {/* ONE HERO ACTION - Gold CTA */}
        {primaryAction === 'map' ? (
          <TouchableOpacity
            style={styles.heroCTA}
            activeOpacity={0.9}
            onPress={navigateToMap}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroLeft}>
                  <Text style={styles.heroTitle}>View Deals on Map</Text>
                  <Text style={styles.heroSub}>{deals.length} deals live now</Text>
                </View>
                <Ionicons name="map" size={32} color="#0F0F14" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.heroCTA}
            activeOpacity={0.9}
            onPress={navigateToExplorer}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroLeft}>
                  <Text style={styles.heroTitle}>Explore & Earn Points</Text>
                  <Text style={styles.heroSub}>Find hidden gems nearby</Text>
                </View>
                <Ionicons name="compass" size={32} color="#0F0F14" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Quick Stats Bar - Reduced contrast on secondary info */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{venues.length}</Text>
            <Text style={styles.statLabel}>NEARBY</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{deals.length}</Text>
            <Text style={styles.statLabel}>LIVE</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, timePeriod === 'goldenHour' && styles.statNumberActive]}>
              {timePeriod === 'goldenHour' ? 'NOW' : '5PM'}
            </Text>
            <Text style={styles.statLabel}>
              {timePeriod === 'goldenHour' ? 'ACTIVE' : 'NEXT'}
            </Text>
          </View>
        </View>

        {/* Active Deals Section - Simplified cards */}
        {deals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Deals Right Now</Text>
            </View>

            {deals.slice(0, 5).map((deal) => {
              const venue = venues.find(v => v.id === deal.venue_id);
              return (
                <TouchableOpacity
                  key={deal.id}
                  style={styles.dealCard}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (venue) navigateToVenue(venue);
                  }}
                >
                  <View style={styles.dealCardContent}>
                    <Text style={styles.dealVenueName} numberOfLines={1}>
                      {venue?.name || 'Venue'}
                    </Text>
                    <Text style={styles.dealHighlight} numberOfLines={2}>
                      {deal.title}
                    </Text>
                    {deal.discount_percentage && (
                      <View style={styles.dealBadge}>
                        <Text style={styles.dealBadgeText}>{deal.discount_percentage}% OFF</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#5A5D66" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Nearby Venues Section - Max 3 elements per card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Near You</Text>
          </View>

          {venues.slice(0, 6).map((venue) => (
            <TouchableOpacity
              key={venue.id}
              style={styles.venueCard}
              activeOpacity={0.8}
              onPress={() => navigateToVenue(venue)}
            >
              <View style={styles.venueCardContent}>
                <Text style={styles.venueName} numberOfLines={1}>
                  {venue.name}
                </Text>
                <Text style={styles.venueLocation} numberOfLines={1}>
                  {venue.neighborhood || venue.address}
                </Text>
                {venue.active && (
                  <View style={styles.popularityBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE NOW</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#5A5D66" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Secondary Action - Lower contrast outline button */}
        <TouchableOpacity
          style={styles.secondaryCTA}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('ProfileTab')}
        >
          <Text style={styles.secondaryCTAText}>View Your Profile & Stats</Text>
          <Ionicons name="chevron-forward" size={18} color="#A0A3AD" />
        </TouchableOpacity>

        {/* Bottom spacing */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#A0A3AD',
  },

  // Header - Simplified, no emoji clutter
  headerSection: {
    marginBottom: 24,
  },
  greetingTitle: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 40,
    color: '#F5F7FA',
    marginBottom: 8,
  },
  greetingSub: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A0A3AD',
    lineHeight: 22,
  },

  // ONE HERO CTA - Gold, high contrast, dominant
  heroCTA: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    // Subtle glow effect
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  heroGradient: {
    padding: 24,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLeft: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F0F14',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F0F14',
    opacity: 0.8,
  },

  // Stats Bar - Reduced contrast (30-40% as per rulebook)
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#171A21',
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#F5F7FA',
  },
  statNumberActive: {
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 4,
    color: '#5A5D66',
  },
  statDivider: {
    width: 1,
    height: '70%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Sections
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#F5F7FA',
  },

  // Deal Cards - Max 3 elements: venue name, deal, badge
  dealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171A21',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
  },
  dealCardContent: {
    flex: 1,
    marginRight: 12,
  },
  dealVenueName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F5F7FA',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  dealHighlight: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0A3AD',
    lineHeight: 19,
    marginBottom: 8,
  },
  dealBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dealBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 0.5,
  },

  // Venue Cards - Max 3 elements: name, location, popularity
  venueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171A21',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  venueCardContent: {
    flex: 1,
    marginRight: 12,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F5F7FA',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  venueLocation: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A0A3AD',
    marginBottom: 8,
  },
  popularityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
    marginRight: 6,
  },
  liveText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  // Secondary CTA - Lower contrast, outline style
  secondaryCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 20,
  },
  secondaryCTAText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#A0A3AD',
    marginRight: 8,
  },
});
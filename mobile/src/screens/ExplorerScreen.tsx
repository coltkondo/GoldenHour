import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { GradientBackground } from '../components/common/GradientBackground';
import { venuesAPI, dealsAPI } from '../api/endpoints';
import { Venue, Deal, DAY_NAMES } from '../types/api';

const { width } = Dimensions.get('window');

const TAG_ICONS: Record<string, string> = {
  'Sports Bar': '🏈',
  'Dive Bar': '🍺',
  'College Bar': '🎓',
  'Live Music': '🎵',
  'Cocktail Bar': '🍸',
  'Brewery': '🍻',
  'Restaurant': '🍽️',
  'Rooftop': '🌇',
  'Wine Bar': '🍷',
  'Pub': '🍺',
  'Club': '🎶',
  'Lounge': '🛋️',
};

const formatTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return minutes === 0 ? `${displayHour}${period}` : `${displayHour}:${String(minutes).padStart(2, '0')}${period}`;
};

export const ExplorerScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [selectedTab, setSelectedTab] = useState<'browse' | 'tonight' | 'submit'>('browse');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [todayDeals, setTodayDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const today = new Date().getDay();
  const todayDb = today === 0 ? 6 : today - 1;
  const todayName = DAY_NAMES[todayDb];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [venueData, dealData] = await Promise.all([
        venuesAPI.getAll({ limit: 100 }),
        dealsAPI.getToday(),
      ]);
      setVenues(venueData);
      setTodayDeals(dealData);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique tags from venues
  const allTags = Array.from(
    new Set(
      venues.flatMap((v: any) => v.tags || []).filter(Boolean)
    )
  ).sort();

  // Also extract unique venue types
  const venueTypes = Array.from(
    new Set(venues.map((v) => v.venue_type).filter(Boolean))
  ).sort() as string[];

  // Combine tags and venue types for browse categories
  const categories = Array.from(new Set([...venueTypes, ...allTags])).sort();

  // Filter venues by selected tag
  const filteredVenues = selectedTag
    ? venues.filter(
        (v: any) =>
          v.venue_type === selectedTag ||
          (v.tags && v.tags.includes(selectedTag))
      )
    : venues;

  // Group tonight's deals by venue
  const dealsByVenue = todayDeals.reduce<Record<string, Deal[]>>((acc, deal) => {
    if (!acc[deal.venue_id]) acc[deal.venue_id] = [];
    acc[deal.venue_id].push(deal);
    return acc;
  }, {});

  const venueMap = venues.reduce<Record<string, Venue>>((acc, v) => {
    acc[v.id] = v;
    return acc;
  }, {});

  if (loading) {
    return (
      <GradientBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
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
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Explorer
          </Text>
          <Text style={[styles.headerSub, { color: theme.colors.textSecondary }]}>
            Discover happy hours in Happy Valley
          </Text>
        </View>

        {/* Load Error */}
        {loadError && (
          <View style={[styles.errorCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#EF4444' }]}>
            <Ionicons name="warning" size={24} color="#EF4444" />
            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>Couldn't load data</Text>
              <Text style={[styles.errorDesc, { color: theme.colors.textMuted }]}>
                Check your connection and pull down to retry
              </Text>
            </View>
          </View>
        )}

        {/* Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: theme.colors.text }]}>{venues.length}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>BARS</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: theme.colors.text }]}>{todayDeals.length}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>DEALS TONIGHT</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: theme.colors.text }]}>{categories.length}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>CATEGORIES</Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {(['browse', 'tonight', 'submit'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && { backgroundColor: theme.colors.primary }]}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: selectedTab === tab ? '#FFF' : theme.colors.textMuted },
                ]}
              >
                {tab === 'browse' ? 'Browse' : tab === 'tonight' ? 'Tonight' : 'Submit'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Browse Tab */}
        {selectedTab === 'browse' && (
          <View style={styles.section}>
            {/* Category chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipContainer}
            >
              <TouchableOpacity
                style={[
                  styles.chip,
                  !selectedTag && styles.chipActive,
                  { borderColor: theme.colors.border },
                ]}
                onPress={() => setSelectedTag(null)}
              >
                <Text style={[styles.chipText, { color: !selectedTag ? '#FFF' : theme.colors.text }]}>
                  All ({venues.length})
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    selectedTag === cat && styles.chipActive,
                    { borderColor: theme.colors.border },
                  ]}
                  onPress={() => setSelectedTag(selectedTag === cat ? null : cat)}
                >
                  <Text style={[styles.chipText, { color: selectedTag === cat ? '#FFF' : theme.colors.text }]}>
                    {TAG_ICONS[cat] || '📍'} {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Venue list */}
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {selectedTag || 'All Bars'} ({filteredVenues.length})
            </Text>
            {filteredVenues.map((venue: any) => (
              <TouchableOpacity
                key={venue.id}
                style={[styles.venueCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('HappyHour', { venue })}
              >
                <View style={styles.venueCardLeft}>
                  <Text style={styles.venueEmoji}>
                    {TAG_ICONS[venue.venue_type] || '🍺'}
                  </Text>
                </View>
                <View style={styles.venueCardContent}>
                  <Text style={[styles.venueName, { color: theme.colors.text }]}>
                    {venue.nickname || venue.name}
                  </Text>
                  <Text style={[styles.venueAddress, { color: theme.colors.textMuted }]} numberOfLines={1}>
                    {venue.address}
                  </Text>
                  <View style={styles.venueTagRow}>
                    {venue.venue_type && (
                      <View style={[styles.venueTag, { backgroundColor: 'rgba(255, 107, 53, 0.15)' }]}>
                        <Text style={styles.venueTagText}>{venue.venue_type}</Text>
                      </View>
                    )}
                    {venue.cash_only && (
                      <View style={[styles.venueTag, { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]}>
                        <Text style={[styles.venueTagText, { color: '#FFD700' }]}>Cash Only</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tonight Tab */}
        {selectedTab === 'tonight' && (
          <View style={styles.section}>
            <View style={styles.tonightHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {todayName}'s Deals
              </Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveLabel}>LIVE</Text>
              </View>
            </View>

            {Object.keys(dealsByVenue).length > 0 ? (
              Object.entries(dealsByVenue).map(([venueId, deals]) => {
                const venue = venueMap[venueId];
                if (!venue) return null;
                return (
                  <TouchableOpacity
                    key={venueId}
                    style={[styles.tonightCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('HappyHour', { venue })}
                  >
                    <View style={styles.tonightCardHeader}>
                      <Text style={[styles.tonightVenueName, { color: theme.colors.text }]}>
                        {(venue as any).nickname || venue.name}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
                    </View>
                    {deals.map((deal) => (
                      <View key={deal.id} style={styles.tonightDealRow}>
                        <View style={styles.tonightDealDot} />
                        <Text style={[styles.tonightDealTitle, { color: theme.colors.textSecondary }]}>
                          {deal.title}
                        </Text>
                        {deal.deal_price != null && (
                          <Text style={styles.tonightDealPrice}>
                            ${deal.deal_price.toFixed(2)}
                          </Text>
                        )}
                      </View>
                    ))}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={styles.emptyEmoji}>🌙</Text>
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                  No deals tonight
                </Text>
                <Text style={[styles.emptyDesc, { color: theme.colors.textMuted }]}>
                  Check back on another day for happy hour specials
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Submit Tab */}
        {selectedTab === 'submit' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Submit a Happy Hour
            </Text>
            <View style={[styles.submitCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={styles.submitEmoji}>🍻</Text>
              <Text style={[styles.submitTitle, { color: theme.colors.text }]}>
                Know a spot we're missing?
              </Text>
              <Text style={[styles.submitDesc, { color: theme.colors.textMuted }]}>
                Help the Penn State community by adding a new happy hour venue or deal!
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('QuickSubmit')}
                style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={20} color="#FFF" />
                <Text style={styles.submitButtonText}>Submit New Venue</Text>
              </TouchableOpacity>
            </View>

            {/* Submission tips */}
            <View style={[styles.tipsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>
                Tips
              </Text>
              {[
                'Include the venue name and address',
                'Add happy hour days and times',
                'List specific deals (e.g. $5 drafts)',
                'Mention any food specials',
              ].map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.colors.secondary} />
                  <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

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

  // Error
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  errorDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },

  // Header
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  headerSub: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Sections
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 14,
  },

  // Category Chips
  chipScroll: {
    marginBottom: 16,
    marginHorizontal: -20,
  },
  chipContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Venue Cards
  venueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  venueCardLeft: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  venueEmoji: {
    fontSize: 22,
  },
  venueCardContent: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  venueAddress: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  venueTagRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  venueTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  venueTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6B35',
  },

  // Tonight
  tonightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  liveLabel: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tonightCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  tonightCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tonightVenueName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  tonightDealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  tonightDealDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B35',
    marginRight: 10,
  },
  tonightDealTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  tonightDealPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4CAF50',
  },

  // Empty
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyDesc: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },

  // Submit
  submitCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  submitTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  submitDesc: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  // Tips
  tipsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});

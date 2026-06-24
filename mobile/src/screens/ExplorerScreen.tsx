import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { venuesAPI, dealsAPI } from '../api/endpoints';
import { Venue, Deal, DAY_NAMES } from '../types/api';
import { AppIcon } from '../components/icons';
import { LiveBadge } from '../components/ui/LiveBadge';
import { StatusDot } from '../components/ui/StatusDot';

const { width } = Dimensions.get('window');

export const ExplorerScreen = () => {
  const { theme } = useTheme();
  const d = theme.derived;
  const navigation = useNavigation<any>();
  const [selectedTab, setSelectedTab] = useState<'browse' | 'tonight'>('browse');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [todayDeals, setTodayDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const isMounted = useRef(true);

  const today = new Date().getDay();
  const todayDb = today === 0 ? 6 : today - 1;
  const todayName = DAY_NAMES[todayDb];

  useEffect(() => {
    isMounted.current = true;
    loadData();
    return () => {
      isMounted.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      const [venueData, dealData] = await Promise.all([
        venuesAPI.getAll({ limit: 100 }),
        dealsAPI.getToday(),
      ]);
      if (!isMounted.current) return;
      setVenues(venueData);
      setTodayDeals(dealData);
    } catch {
      if (!isMounted.current) return;
      setLoadError(true);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const allTags = Array.from(
    new Set(venues.flatMap((v: any) => v.tags || []).filter(Boolean)),
  ).sort();
  const venueTypes = Array.from(
    new Set(venues.map((v) => v.venue_type).filter(Boolean)),
  ).sort() as string[];
  const categories = Array.from(new Set([...venueTypes, ...allTags])).sort();

  const filteredVenues = selectedTag
    ? venues.filter(
        (v: any) => v.venue_type === selectedTag || (v.tags && v.tags.includes(selectedTag)),
      )
    : venues;

  const dealsByVenue = todayDeals.reduce<Record<string, Deal[]>>((acc, deal) => {
    if (!acc[deal.venue_id]) acc[deal.venue_id] = [];
    acc[deal.venue_id].push(deal);
    return acc;
  }, {});

  const venueMap = venues.reduce<Record<string, Venue>>((acc, v) => {
    acc[v.id] = v;
    return acc;
  }, {});

  const getVenueIconName = (type: string | null): 'deals' | 'martini' => {
    if (!type) return 'deals';
    const lower = type.toLowerCase();
    if (lower.includes('cocktail') || lower.includes('lounge') || lower.includes('wine'))
      return 'martini';
    return 'deals';
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: d.background }]}>
        <View style={[styles.loadingSpinner, { backgroundColor: d.filterInactive }]}>
          <ActivityIndicator size="large" color={d.primary} />
        </View>
        <Text style={[styles.loadingText, { color: d.textMuted }]}>Loading venues</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: d.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.wordmark, { color: d.primary }]}>GLDNHR</Text>
          <View style={styles.locationChip}>
            <AppIcon name="location" size={12} role="muted" />
            <Text style={[styles.locationText, { color: d.textMuted }]}>Happy Valley, PA</Text>
          </View>
        </View>

        {/* Load Error */}
        {loadError && (
          <View
            style={[styles.errorCard, { backgroundColor: d.cardBackground, borderColor: d.error }]}
          >
            <AppIcon name="warning" size={20} role="urgent" />
            <View style={styles.errorContent}>
              <Text style={[styles.errorTitle, { color: d.error }]}>Couldn't load data</Text>
              <Text style={[styles.errorDesc, { color: d.textMuted }]}>
                Check your connection and pull down to retry
              </Text>
            </View>
          </View>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: d.primary }]}>{venues.length}</Text>
            <Text style={[styles.statLabel, { color: d.textMuted }]}>Bars</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: d.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: d.live }]}>{todayDeals.length}</Text>
            <Text style={[styles.statLabel, { color: d.textMuted }]}>Deals tonight</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: d.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: d.text }]}>{categories.length}</Text>
            <Text style={[styles.statLabel, { color: d.textMuted }]}>Categories</Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabBar, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
          {(['browse', 'tonight'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                selectedTab === tab && {
                  backgroundColor: 'rgba(245,166,35,0.12)',
                  borderColor: d.primary,
                  borderWidth: 1,
                },
              ]}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.tabText, { color: selectedTab === tab ? d.primary : d.textMuted }]}
              >
                {tab === 'browse' ? 'Browse' : 'Tonight'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Browse Tab */}
        {selectedTab === 'browse' && (
          <View style={styles.section}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipContainer}
            >
              <TouchableOpacity
                style={[
                  styles.chip,
                  {
                    backgroundColor: !selectedTag ? 'rgba(245,166,35,0.12)' : d.filterInactive,
                    borderColor: !selectedTag ? d.primary : 'transparent',
                    borderWidth: 1,
                  },
                ]}
                onPress={() => setSelectedTag(null)}
              >
                <Text style={[styles.chipText, { color: !selectedTag ? d.primary : d.textMuted }]}>
                  All ({venues.length})
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        selectedTag === cat ? 'rgba(245,166,35,0.12)' : d.filterInactive,
                      borderColor: selectedTag === cat ? d.primary : 'transparent',
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => setSelectedTag(selectedTag === cat ? null : cat)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: selectedTag === cat ? d.primary : d.textMuted },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.sectionLabel, { color: d.text }]}>
              {selectedTag || 'All Bars'} ({filteredVenues.length})
            </Text>

            {filteredVenues.map((venue: any) => {
              return (
                <TouchableOpacity
                  key={venue.id}
                  style={[
                    styles.venueCard,
                    { backgroundColor: d.cardBackground, borderColor: d.border },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('HappyHour', { venue })}
                >
                  <View style={[styles.venueThumb, { backgroundColor: d.filterInactive }]}>
                    <AppIcon name={getVenueIconName(venue.venue_type)} size={20} role="brand" />
                  </View>
                  <View style={styles.venueContent}>
                    <Text style={[styles.venueName, { color: d.text }]} numberOfLines={1}>
                      {venue.nickname || venue.name}
                    </Text>
                    <Text style={[styles.venueAddress, { color: d.textMuted }]} numberOfLines={1}>
                      {venue.address}
                    </Text>
                    <View style={styles.venueTagRow}>
                      {venue.venue_type && (
                        <View style={[styles.venueTag, { backgroundColor: d.filterInactive }]}>
                          <Text style={[styles.venueTagText, { color: d.textMuted }]}>
                            {venue.venue_type}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <AppIcon name="chevronRight" size={16} role="muted" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Tonight Tab */}
        {selectedTab === 'tonight' && (
          <View style={styles.section}>
            <View style={styles.tonightHeader}>
              <Text style={[styles.tonightTitle, { color: d.text }]}>{todayName}'s Deals</Text>
              <LiveBadge />
            </View>

            {Object.keys(dealsByVenue).length > 0 ? (
              Object.entries(dealsByVenue).map(([venueId, deals]) => {
                const venue = venueMap[venueId];
                if (!venue) return null;
                return (
                  <TouchableOpacity
                    key={venueId}
                    style={[
                      styles.tonightCard,
                      { backgroundColor: d.cardBackground, borderColor: d.border },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('HappyHour', { venue })}
                  >
                    <View style={styles.tonightCardHeader}>
                      <Text style={[styles.tonightVenueName, { color: d.text }]} numberOfLines={1}>
                        {(venue as any).nickname || venue.name}
                      </Text>
                      <AppIcon name="chevronRight" size={16} role="muted" />
                    </View>
                    {deals.map((deal, index) => (
                      <React.Fragment key={deal.id}>
                        <View style={styles.dealRow}>
                          <StatusDot status="live" size={6} pulse={false} />
                          <Text style={[styles.dealName, { color: d.text }]} numberOfLines={1}>
                            {deal.title}
                          </Text>
                          {deal.deal_price != null ? (
                            <Text style={[styles.dealPrice, { color: d.primary }]}>
                              ${deal.deal_price.toFixed(0)}
                            </Text>
                          ) : deal.discount_percentage != null ? (
                            <Text style={[styles.dealPrice, { color: d.primary }]}>
                              {deal.discount_percentage}%
                            </Text>
                          ) : null}
                        </View>
                        {index < deals.length - 1 && (
                          <View style={[styles.dealSeparator, { backgroundColor: d.divider }]} />
                        )}
                      </React.Fragment>
                    ))}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: d.cardBackground, borderColor: d.border },
                ]}
              >
                <Text style={[styles.emptyText, { color: d.text }]}>No deals tonight</Text>
                <Text style={[styles.emptySubtext, { color: d.textMuted }]}>
                  Check back on another day for happy hour specials
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingSpinner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: { fontSize: 15, fontWeight: '600' },

  header: { marginBottom: 24 },
  wordmark: { fontSize: 22, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  locationChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  locationText: { fontSize: 13, fontWeight: '500' },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  errorContent: { flex: 1 },
  errorTitle: { fontSize: 14, fontWeight: '700' },
  errorDesc: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 8,
  },
  statItem: { alignItems: 'center' },
  statDivider: { width: 1, height: 32, marginHorizontal: 8 },
  statNum: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  tabBar: { flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 24, borderWidth: 1 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '600' },

  section: { marginBottom: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '600', marginBottom: 12 },

  chipScroll: { marginBottom: 16, marginLeft: -16, marginRight: -16 },
  chipContainer: { paddingHorizontal: 16, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  chipText: { fontSize: 13, fontWeight: '500' },

  venueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  venueThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  venueContent: { flex: 1, minWidth: 0 },
  venueName: { fontSize: 14, fontWeight: '600', letterSpacing: -0.1 },
  venueAddress: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  venueTagRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  venueTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  venueTagText: { fontSize: 10, fontWeight: '500' },

  tonightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  tonightTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  tonightCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  tonightCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tonightVenueName: { fontSize: 14, fontWeight: '600', flex: 1, marginRight: 8 },
  dealRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  dealName: { flex: 1, fontSize: 13, fontWeight: '500' },
  dealPrice: { fontSize: 14, fontWeight: '700', marginLeft: 8 },
  dealSeparator: { height: 0.5, marginLeft: 16 },

  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 15, fontWeight: '600' },
  emptySubtext: { fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 4 },

});

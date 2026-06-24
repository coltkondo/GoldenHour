import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { venuesAPI, dealsAPI } from '../api/endpoints';
import { Venue, Deal, HappyHourSchedule, DAY_NAMES } from '../types/api';
import { formatScheduleRange, parseTimeString } from '../utils/scheduleUtils';
import { AppIcon } from '../components/icons';
import { StatusDot } from '../components/ui/StatusDot';

const TAG_ALIASES: Record<string, string> = {
  gaffeoke: 'Karaoke',
};

function normalizeTag(tag: string): string {
  return TAG_ALIASES[tag.toLowerCase()] ?? tag;
}

function isCurrentlyLive(schedule: HappyHourSchedule | undefined): boolean {
  if (!schedule) return false;
  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const start = parseTimeString(schedule.start_time);
    const end = parseTimeString(schedule.end_time);
    const startMinutes = start.hour * 60 + start.minute;
    const endMinutes = end.hour * 60 + end.minute;
    if (endMinutes > startMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } catch {
    return false;
  }
}

export const ExplorerScreen = () => {
  const { theme } = useTheme();
  const d = theme.derived;
  const navigation = useNavigation<any>();
  const [selectedTab, setSelectedTab] = useState<'browse' | 'tonight'>('browse');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [todayDeals, setTodayDeals] = useState<Deal[]>([]);
  const [schedules, setSchedules] = useState<Map<string, HappyHourSchedule>>(new Map());
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
    return () => { isMounted.current = false; };
  }, []);

  const loadData = async () => {
    try {
      const [venueData, dealData] = await Promise.all([
        venuesAPI.getAll({ limit: 100 }),
        dealsAPI.getToday(),
      ]);
      if (!isMounted.current) return;
      setVenues(venueData);
      setTodayDeals(dealData);

      const venueIds = [...new Set(dealData.map((d) => d.venue_id))];
      const scheduleSets = await Promise.all(
        venueIds.map((id) => venuesAPI.getSchedules(id).catch(() => [] as HappyHourSchedule[])),
      );
      if (!isMounted.current) return;

      const newMap = new Map<string, HappyHourSchedule>();
      for (const scheds of scheduleSets) {
        for (const s of scheds) {
          if (s.day_of_week !== todayDb) continue;
          for (const dealId of s.deal_ids ?? []) {
            newMap.set(dealId, s);
          }
        }
      }
      setSchedules(newMap);
    } catch {
      if (!isMounted.current) return;
      setLoadError(true);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const raw = venues.flatMap((v) => {
      const tags = (v.tags || []).map(normalizeTag);
      if (v.venue_type) tags.push(v.venue_type);
      return tags;
    });
    return [...new Set(raw)].filter(Boolean).sort();
  }, [venues]);

  const filteredVenues = selectedTag
    ? venues.filter((v: any) => {
        const normalizedTags = (v.tags || []).map(normalizeTag);
        return v.venue_type === selectedTag || normalizedTags.includes(selectedTag);
      })
    : venues;

  const dealsByVenue = useMemo(() => {
    return todayDeals.reduce<Record<string, Deal[]>>((acc, deal) => {
      if (!acc[deal.venue_id]) acc[deal.venue_id] = [];
      acc[deal.venue_id].push(deal);
      return acc;
    }, {});
  }, [todayDeals]);

  const venueMap = useMemo(
    () => venues.reduce<Record<string, Venue>>((acc, v) => { acc[v.id] = v; return acc; }, {}),
    [venues],
  );

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
        <ActivityIndicator size="large" color={d.primary} />
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
          <Text style={[styles.title, { color: d.text }]}>Explore</Text>
          <View style={styles.locationChip}>
            <AppIcon name="location" size={12} role="muted" />
            <Text style={[styles.locationText, { color: d.textMuted }]}>Happy Valley, PA</Text>
          </View>
        </View>

        {/* Load Error */}
        {loadError && (
          <View style={[styles.errorCard, { backgroundColor: d.cardBackground, borderColor: d.error }]}>
            <AppIcon name="warning" size={20} role="urgent" />
            <View style={styles.errorContent}>
              <Text style={[styles.errorTitle, { color: d.error }]}>Couldn't load data</Text>
              <Text style={[styles.errorDesc, { color: d.textMuted }]}>
                Check your connection and pull down to retry
              </Text>
            </View>
          </View>
        )}

        {/* Deals tonight count */}
        {todayDeals.length > 0 && (
          <View style={[styles.dealCountBanner, { backgroundColor: 'rgba(45,212,160,0.08)' }]}>
            <StatusDot status="live" size={6} pulse={false} />
            <Text style={[styles.dealCountText, { color: d.live }]}>
              {todayDeals.length} {todayDeals.length === 1 ? 'deal' : 'deals'} tonight
            </Text>
          </View>
        )}

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
              <Text style={[styles.tabText, { color: selectedTab === tab ? d.primary : d.textMuted }]}>
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
                      backgroundColor: selectedTag === cat ? 'rgba(245,166,35,0.12)' : d.filterInactive,
                      borderColor: selectedTag === cat ? d.primary : 'transparent',
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => setSelectedTag(selectedTag === cat ? null : cat)}
                >
                  <Text style={[styles.chipText, { color: selectedTag === cat ? d.primary : d.textMuted }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.sectionLabel, { color: d.text }]}>
              {selectedTag || 'All Bars'} ({filteredVenues.length})
            </Text>

            {filteredVenues.map((venue: any) => (
              <TouchableOpacity
                key={venue.id}
                style={[styles.venueCard, { backgroundColor: d.cardBackground, borderColor: d.border }]}
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
                </View>
                <AppIcon name="chevronRight" size={16} role="muted" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tonight Tab */}
        {selectedTab === 'tonight' && (
          <View style={styles.section}>
            <Text style={[styles.tonightTitle, { color: d.text }]}>{todayName}'s Deals</Text>

            {Object.keys(dealsByVenue).length > 0 ? (
              Object.entries(dealsByVenue).map(([venueId, deals]) => {
                const venue = venueMap[venueId];
                if (!venue) return null;
                return (
                  <TouchableOpacity
                    key={venueId}
                    style={[styles.tonightCard, { backgroundColor: d.cardBackground, borderColor: d.border }]}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('HappyHour', { venue })}
                  >
                    <View style={styles.tonightCardHeader}>
                      <Text style={[styles.tonightVenueName, { color: d.text }]} numberOfLines={1}>
                        {(venue as any).nickname || venue.name}
                      </Text>
                      <AppIcon name="chevronRight" size={16} role="muted" />
                    </View>
                    {deals.map((deal, index) => {
                      const schedule = schedules.get(deal.id);
                      const live = isCurrentlyLive(schedule);
                      const timeLabel = formatScheduleRange(schedule?.start_time, schedule?.end_time, '');
                      return (
                        <React.Fragment key={deal.id}>
                          <View style={styles.dealRow}>
                            <StatusDot status={live ? 'live' : 'inactive'} size={6} pulse={false} />
                            <View style={styles.dealInfo}>
                              <Text style={[styles.dealName, { color: d.text }]} numberOfLines={1}>
                                {deal.title}
                              </Text>
                              {timeLabel ? (
                                <Text style={[styles.dealTime, { color: live ? d.live : d.textMuted }]}>
                                  {live ? 'Live' : ''} {timeLabel}
                                </Text>
                              ) : null}
                            </View>
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
                      );
                    })}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
                <AppIcon name="clock" size={24} role="muted" />
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
  scrollContent: { paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '500' },

  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  locationChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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

  dealCountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  dealCountText: { fontSize: 13, fontWeight: '600' },

  tabBar: { flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 20, borderWidth: 1 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '600' },

  section: { marginBottom: 8 },
  sectionLabel: { fontSize: 14, fontWeight: '700', marginBottom: 12 },

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
  venueName: { fontSize: 15, fontWeight: '600', letterSpacing: -0.1 },
  venueAddress: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  tonightTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2, marginBottom: 14 },
  tonightCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  tonightCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tonightVenueName: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  dealRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  dealInfo: { flex: 1, minWidth: 0 },
  dealName: { fontSize: 14, fontWeight: '500' },
  dealTime: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  dealPrice: { fontSize: 15, fontWeight: '800' },
  dealSeparator: { height: 0.5, marginLeft: 16 },

  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 28, alignItems: 'center', gap: 6 },
  emptyText: { fontSize: 16, fontWeight: '700' },
  emptySubtext: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
});

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { venuesAPI, dealsAPI } from '../api/endpoints';
import { Venue, Deal, HappyHourSchedule, DAY_NAMES } from '../types/api';
import { formatScheduleRange, parseTimeString } from '../utils/scheduleUtils';
import { AppIcon } from '../components/icons';
import { REWARDS_ENABLED } from '../config/constants';
import { LiveBadge } from '../components/ui/LiveBadge';
import { GuestMarketPicker } from '../components/GuestMarketPicker';

const GUEST_MARKET_KEY = 'gh_guest_market';

type FilterCategory = 'All' | 'Cocktails' | 'Beer' | 'Wine' | 'Food';

const FILTERS: FilterCategory[] = ['All', 'Cocktails', 'Beer', 'Wine', 'Food'];

const FILTER_KEYWORDS: Record<string, string[]> = {
  Cocktails: ['cocktail', 'mixed', 'martini', 'margarita', 'marg'],
  Beer: ['beer', 'draft', 'pint', 'ipa', 'lager', 'brew'],
  Wine: ['wine', 'glass', 'bottle', 'red', 'white', 'rose'],
  Food: ['food', 'bite', 'appetizer', 'snack', 'wings', 'tacos', 'pizza', 'burger', 'app'],
};

interface DealWithSchedule extends Deal {
  schedule?: HappyHourSchedule;
  venueName: string;
  isLiveNow: boolean;
}

interface TimeGroup {
  key: string;
  label: string;
  deals: DealWithSchedule[];
}

interface VenueGroup {
  venueId: string;
  venueName: string;
  timeGroups: TimeGroup[];
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

function matchesFilter(deal: Deal, filter: FilterCategory): boolean {
  if (filter === 'All') return true;
  const keywords = FILTER_KEYWORDS[filter] ?? [];
  const searchText = `${deal.title} ${deal.category} ${deal.description ?? ''} ${(deal.items ?? []).join(' ')}`.toLowerCase();
  return keywords.some((kw) => searchText.includes(kw));
}

function groupDealsByVenue(deals: DealWithSchedule[]): VenueGroup[] {
  const venueMap = new Map<string, VenueGroup>();
  for (const deal of deals) {
    if (!venueMap.has(deal.venue_id)) {
      venueMap.set(deal.venue_id, { venueId: deal.venue_id, venueName: deal.venueName, timeGroups: [] });
    }
    const group = venueMap.get(deal.venue_id)!;
    const timeKey = deal.schedule ? `${deal.schedule.start_time}-${deal.schedule.end_time}` : 'all-day';
    let tg = group.timeGroups.find((t) => t.key === timeKey);
    if (!tg) {
      const label = deal.schedule
        ? `HH (${formatScheduleRange(deal.schedule.start_time, deal.schedule.end_time, '')})`
        : 'All Day';
      tg = { key: timeKey, label, deals: [] };
      group.timeGroups.push(tg);
    }
    tg.deals.push(deal);
  }
  return Array.from(venueMap.values());
}

export const HomeScreen = () => {
  const { theme } = useTheme();
  const d = theme.derived;
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [todayDeals, setTodayDeals] = useState<Deal[]>([]);
  const [schedules, setSchedules] = useState<Map<string, HappyHourSchedule>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('All');
  const [guestMarketSlug, setGuestMarketSlug] = useState<string | null>(null);
  const [showMarketPicker, setShowMarketPicker] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const init = async () => {
      if (user) {
        await loadData(user.market_slug);
      } else {
        const stored = await AsyncStorage.getItem(GUEST_MARKET_KEY);
        if (stored) {
          setGuestMarketSlug(stored);
          await loadData(stored);
        } else {
          setShowMarketPicker(true);
          await loadData(null);
        }
      }
    };
    init();
    return () => { isMounted.current = false; };
  }, [user?.market_slug]);

  const handleCitySelect = useCallback(async (slug: string) => {
    setShowMarketPicker(false);
    setGuestMarketSlug(slug);
    await AsyncStorage.setItem(GUEST_MARKET_KEY, slug);
    await loadData(slug);
  }, []);

  const loadData = async (marketSlug: string | null) => {
    try {
      setLoading(true);
      const [venueData, dealData] = await Promise.all([
        venuesAPI.getAll({ limit: 100, market_slug: marketSlug }),
        dealsAPI.getToday(marketSlug),
      ]);
      if (!isMounted.current) return;
      setVenues(venueData);
      setTodayDeals(dealData);

      const venueIds = [...new Set(dealData.map((d) => d.venue_id))];
      const scheduleSets = await Promise.all(
        venueIds.map((id) => venuesAPI.getSchedules(id).catch(() => [] as HappyHourSchedule[])),
      );
      if (!isMounted.current) return;

      const today = new Date().getDay();
      const todayDb = today === 0 ? 6 : today - 1;
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
    } catch (err) {
      if (!isMounted.current) return;
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const slug = user?.market_slug ?? guestMarketSlug ?? null;
    await loadData(slug);
    if (isMounted.current) setRefreshing(false);
  };

  const venueMap = useMemo(() => new Map(venues.map((v) => [v.id, v])), [venues]);

  const enrichedDeals: DealWithSchedule[] = useMemo(() => {
    return todayDeals.map((deal) => {
      const venue = venueMap.get(deal.venue_id);
      const schedule = schedules.get(deal.id);
      return {
        ...deal,
        schedule,
        venueName: venue?.nickname || venue?.name || 'Unknown',
        isLiveNow: isCurrentlyLive(schedule),
      };
    });
  }, [todayDeals, venueMap, schedules]);

  const filteredDeals = useMemo(
    () => enrichedDeals.filter((deal) => matchesFilter(deal, activeFilter)),
    [enrichedDeals, activeFilter],
  );

  const happeningNow = useMemo(
    () => filteredDeals.filter((d) => d.isLiveNow),
    [filteredDeals],
  );

  const comingUp = useMemo(() => {
    const notLive = filteredDeals.filter((d) => !d.isLiveNow);
    return notLive.sort((a, b) => {
      const aStart = a.schedule ? parseTimeString(a.schedule.start_time).hour * 60 + parseTimeString(a.schedule.start_time).minute : 9999;
      const bStart = b.schedule ? parseTimeString(b.schedule.start_time).hour * 60 + parseTimeString(b.schedule.start_time).minute : 9999;
      return aStart - bStart;
    });
  }, [filteredDeals]);

  const happeningNowGroups = useMemo(() => groupDealsByVenue(happeningNow), [happeningNow]);
  const comingUpGroups = useMemo(() => groupDealsByVenue(comingUp), [comingUp]);

  const navigateToVenue = (venueId: string) => {
    const venue = venueMap.get(venueId);
    if (venue) navigation.navigate('HappyHour', { venue });
  };

  const today = new Date().getDay();
  const todayDb = today === 0 ? 6 : today - 1;
  const todayName = DAY_NAMES[todayDb];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: d.background }]}>
        <ActivityIndicator size="large" color={d.primary} />
        <Text style={[styles.loadingText, { color: d.textMuted }]}>Loading today's deals</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: d.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={d.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.wordmark, { color: d.primary }]}>GLDNHR</Text>
          {REWARDS_ENABLED && user && (
            <TouchableOpacity
              style={[styles.pointsPill, { borderColor: d.border, backgroundColor: d.cardBackground }]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ProfileTab')}
            >
              <AppIcon name="points" size={12} role="brand" />
              <Text style={[styles.pointsText, { color: d.primary }]}>
                {user.points_balance}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Day title */}
        <Text style={[styles.dayTitle, { color: d.text }]}>{todayName}</Text>
        <Text style={[styles.daySubtitle, { color: d.textMuted }]}>
          {(() => {
            const slug = user?.market_slug ?? guestMarketSlug;
            if (slug === 'arlington') return 'Arlington, VA';
            if (slug === 'state-college') return 'Happy Valley, PA';
            return 'Happy Hour Deals';
          })()}
        </Text>

        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                {
                  backgroundColor: activeFilter === filter ? 'rgba(245,166,35,0.12)' : d.filterInactive,
                  borderColor: activeFilter === filter ? d.primary : 'transparent',
                  borderWidth: 1,
                },
              ]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: activeFilter === filter ? d.primary : d.textMuted },
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Happening Now ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: d.text }]}>Happening Now</Text>
              <LiveBadge />
            </View>
            {happeningNow.length > 0 && (
              <Text style={[styles.dealCount, { color: d.textMuted }]}>
                {happeningNow.length} {happeningNow.length === 1 ? 'deal' : 'deals'} live
              </Text>
            )}
          </View>

          {happeningNowGroups.length > 0 ? (
            <View style={[styles.dealList, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
              {happeningNowGroups.map((group, index) => (
                <React.Fragment key={group.venueId}>
                  <VenueGroupCard
                    group={group}
                    d={d}
                    onPress={() => navigateToVenue(group.venueId)}
                    labelColor={d.live}
                  />
                  {index < happeningNowGroups.length - 1 && (
                    <View style={[styles.separator, { backgroundColor: d.divider }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
              <AppIcon name="clock" size={24} role="muted" />
              <Text style={[styles.emptyTitle, { color: d.text }]}>Nothing live right now</Text>
              <Text style={[styles.emptySubtext, { color: d.textMuted }]}>
                Check below for what's coming up later
              </Text>
            </View>
          )}
        </View>

        {/* ── Coming Up Tonight ── */}
        {comingUpGroups.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: d.text }]}>Coming Up Tonight</Text>
              <Text style={[styles.dealCount, { color: d.textMuted }]}>
                {comingUp.length} {comingUp.length === 1 ? 'deal' : 'deals'}
              </Text>
            </View>

            <View style={[styles.dealList, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
              {comingUpGroups.map((group, index) => (
                <React.Fragment key={group.venueId}>
                  <VenueGroupCard
                    group={group}
                    d={d}
                    onPress={() => navigateToVenue(group.venueId)}
                    labelColor={d.primary}
                  />
                  {index < comingUpGroups.length - 1 && (
                    <View style={[styles.separator, { backgroundColor: d.divider }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {/* ── No deals at all ── */}
        {happeningNow.length === 0 && comingUp.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: d.cardBackground, borderColor: d.border, marginTop: 12 }]}>
            <AppIcon name="deals" size={32} role="muted" />
            <Text style={[styles.emptyTitle, { color: d.text }]}>No deals today</Text>
            <Text style={[styles.emptySubtext, { color: d.textMuted }]}>
              Check back tomorrow or browse all venues
            </Text>
            <TouchableOpacity
              style={[styles.browseBtn, { backgroundColor: d.primary }]}
              onPress={() => navigation.navigate('ExplorerTab')}
              activeOpacity={0.85}
            >
              <Text style={[styles.browseBtnText, { color: d.buttonPrimaryText }]}>Browse Venues</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <GuestMarketPicker visible={showMarketPicker} onSelect={handleCitySelect} />
    </View>
  );
};

/* ── Venue Group Card ── */

interface VenueGroupCardProps {
  group: VenueGroup;
  d: any;
  onPress: () => void;
  labelColor: string;
}

const VenueGroupCard: React.FC<VenueGroupCardProps> = ({ group, d, onPress, labelColor }) => (
  <Pressable
    style={({ pressed }) => [styles.venueGroupRow, pressed && { backgroundColor: d.filterInactive }]}
    onPress={onPress}
  >
    <View style={styles.venueNameCol}>
      <Text style={[styles.venueGroupName, { color: d.text }]} numberOfLines={3}>
        {group.venueName}
      </Text>
    </View>

    <View style={[styles.verticalDivider, { backgroundColor: d.divider }]} />

    <View style={styles.timeGroupsCol}>
      {group.timeGroups.map((tg) => (
        <View key={tg.key} style={styles.timeGroup}>
          <Text style={[styles.timeGroupLabel, { color: labelColor }]}>{tg.label}</Text>
          <Text style={[styles.timeGroupDeals, { color: d.text }]} numberOfLines={3}>
            {tg.deals.map((deal) => deal.title).join(', ')}
          </Text>
        </View>
      ))}
    </View>

    <AppIcon name="chevronRight" size={14} role="muted" />
  </Pressable>
);

/* ── Styles ── */

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: 16 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '500' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  wordmark: { fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  pointsText: { fontSize: 13, fontWeight: '700' },

  dayTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  daySubtitle: { fontSize: 14, fontWeight: '500', marginTop: 2, marginBottom: 20 },

  filterScroll: { marginBottom: 28, marginLeft: -16, marginRight: -16 },
  filterContainer: { paddingHorizontal: 16, gap: 8 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterText: { fontSize: 13, fontWeight: '600' },

  section: { marginBottom: 28 },
  sectionHeader: { marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  dealCount: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  dealList: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  separator: { height: 0.5, marginLeft: 16 },

  venueGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  venueNameCol: { width: 88, flexShrink: 0 },
  venueGroupName: { fontSize: 13, fontWeight: '800', letterSpacing: -0.1, lineHeight: 18 },
  verticalDivider: { width: 1, alignSelf: 'stretch', marginVertical: 2 },
  timeGroupsCol: { flex: 1, gap: 10 },
  timeGroup: { gap: 2 },
  timeGroupLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  timeGroupDeals: { fontSize: 14, fontWeight: '500', lineHeight: 20 },

  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  emptySubtext: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  browseBtn: {
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  browseBtnText: { fontSize: 14, fontWeight: '700' },
});

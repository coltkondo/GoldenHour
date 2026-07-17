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
import { StatusDot } from '../components/ui/StatusDot';
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

          {happeningNow.length > 0 ? (
            <View style={[styles.dealList, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
              {happeningNow.map((deal, index) => (
                <React.Fragment key={deal.id}>
                  <DealRow deal={deal} d={d} onPress={() => navigateToVenue(deal.venue_id)} isLive />
                  {index < happeningNow.length - 1 && (
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
        {comingUp.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: d.text }]}>Coming Up Tonight</Text>
              <Text style={[styles.dealCount, { color: d.textMuted }]}>
                {comingUp.length} {comingUp.length === 1 ? 'deal' : 'deals'}
              </Text>
            </View>

            <View style={[styles.dealList, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
              {comingUp.map((deal, index) => (
                <React.Fragment key={deal.id}>
                  <DealRow deal={deal} d={d} onPress={() => navigateToVenue(deal.venue_id)} />
                  {index < comingUp.length - 1 && (
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

/* ── Helpers ── */

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatValidThrough(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number);
  return `Thru ${MONTH_SHORT[m - 1]} ${d}`;
}

/* ── Deal Row Component ── */

interface DealRowProps {
  deal: DealWithSchedule;
  d: any;
  onPress: () => void;
  isLive?: boolean;
}

const DealRow: React.FC<DealRowProps> = ({ deal, d, onPress, isLive }) => {
  const timeLabel = formatScheduleRange(deal.schedule?.start_time, deal.schedule?.end_time, '');
  const priceDisplay = deal.deal_price
    ? `$${deal.deal_price}`
    : deal.discount_percentage
      ? `${deal.discount_percentage}% off`
      : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.dealRow, pressed && { backgroundColor: d.filterInactive }]}
      onPress={onPress}
    >
      <View style={styles.dealRowMain}>
        <View style={styles.dealRowTop}>
          <Text style={[styles.dealTitle, { color: d.text }]} numberOfLines={1}>
            {deal.title}
          </Text>
          {priceDisplay && (
            <Text style={[styles.dealPrice, { color: d.primary }]}>{priceDisplay}</Text>
          )}
        </View>
        <View style={styles.dealRowMeta}>
          <Text style={[styles.dealVenue, { color: d.textMuted }]} numberOfLines={1}>
            {deal.venueName}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            {deal.valid_through && (
              <View style={[styles.timeBadge, { backgroundColor: 'rgba(245,166,35,0.10)', borderColor: d.primary, borderWidth: 1 }]}>
                <Text style={[styles.timeText, { color: d.primary }]}>
                  {formatValidThrough(deal.valid_through)}
                </Text>
              </View>
            )}
            {timeLabel ? (
              <View style={[
                styles.timeBadge,
                {
                  backgroundColor: isLive ? 'rgba(45,212,160,0.12)' : d.filterInactive,
                  borderColor: isLive ? d.live : 'transparent',
                  borderWidth: isLive ? 1 : 0,
                },
              ]}>
                {isLive && <StatusDot status="live" size={5} pulse={false} />}
                <Text style={[styles.timeText, { color: isLive ? d.live : d.textMuted }]}>
                  {timeLabel}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
      <AppIcon name="chevronRight" size={14} role="muted" />
    </Pressable>
  );
};

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

  dealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  dealRowMain: { flex: 1, minWidth: 0 },
  dealRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  dealTitle: { fontSize: 15, fontWeight: '600', flex: 1 },
  dealPrice: { fontSize: 16, fontWeight: '800' },
  dealRowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  dealVenue: { fontSize: 13, fontWeight: '500' },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timeText: { fontSize: 11, fontWeight: '600' },

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

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme';
import { dealsAPI, venuesAPI, submissionsAPI } from '../api/endpoints';
import { Venue, Deal, HappyHourSchedule, DAY_NAMES } from '../types/api';
import { FlagReportModal } from '../components/FlagReportModal';
import { AppIcon } from '../components/icons';
import { LiveBadge } from '../components/ui/LiveBadge';
import { VenueLogo } from '../components/ui/VenueLogo';
import { useAuth } from '../context/AuthContext';

const CORROBORATE_RADIUS_M = 50;

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type HappyHourRouteParams = { HappyHour: { venue: Venue } };

const formatTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return minutes === 0
    ? `${displayHour}${period}`
    : `${displayHour}:${String(minutes).padStart(2, '0')}${period}`;
};

// JS getDay(): 0=Sun → DB: 0=Mon…6=Sun
const jsDayToDb = (jsDay: number) => (jsDay === 0 ? 6 : jsDay - 1);
const todayDb = jsDayToDb(new Date().getDay());

// All 7 days in DB order (0=Mon…6=Sun), starting from today
const ALL_DAYS = DAY_NAMES.map((name, i) => ({ db: i, label: name.slice(0, 3).toUpperCase() }));

export const HappyHourScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<HappyHourRouteParams, 'HappyHour'>>();
  const { theme } = useTheme();
  const d = theme.derived;
  const venue = route.params?.venue;
  const { user } = useAuth();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [schedules, setSchedules] = useState<HappyHourSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(todayDb);
  const [corrState, setCorrState] = useState<Record<string, 'idle' | 'loading' | 'done' | 'already'>>({});
  // null = still checking; false = not nearby or no permission; true = within range
  const [isNearby, setIsNearby] = useState<boolean | null>(null);

  useEffect(() => {
    if (!venue) { navigation.goBack(); return; }
    (async () => {
      try {
        const [venueDeals, venueSchedules] = await Promise.all([
          dealsAPI.getByVenue(venue.id),
          venuesAPI.getSchedules(venue.id),
        ]);
        setDeals(venueDeals);
        setSchedules(venueSchedules);
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    })();
    checkProximity();
  }, []);

  async function checkProximity() {
    if (!venue) return;
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') { setIsNearby(false); return; }
      // getLastKnownPositionAsync is instant; fall back to a fresh fix only if needed
      const pos =
        (await Location.getLastKnownPositionAsync()) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      if (!pos) { setIsNearby(false); return; }
      const dist = haversineMeters(pos.coords.latitude, pos.coords.longitude, venue.latitude, venue.longitude);
      setIsNearby(dist <= CORROBORATE_RADIUS_M);
    } catch {
      setIsNearby(false);
    }
  }

  if (!venue) return null;

  // Deals active on the selected day, via schedule's deal_ids
  const dealsForDay = (): Deal[] => {
    const daySchedules = schedules.filter((s) => s.day_of_week === selectedDay && s.active);
    if (daySchedules.length === 0) return [];
    const ids = new Set(daySchedules.flatMap((s) => s.deal_ids ?? []));
    // If no deal_ids specified, show all deals (schedule exists but no specific mapping)
    if (ids.size === 0) return deals;
    return deals.filter((deal) => ids.has(deal.id));
  };

  const hasScheduleToday = schedules.some((s) => s.day_of_week === selectedDay && s.active);
  const daySchedules = schedules.filter((s) => s.day_of_week === selectedDay && s.active);
  const selectedDayDeals = loading ? [] : dealsForDay();

  const handleCorroborate = async (dealId: string) => {
    if (!user) return;
    setCorrState((s) => ({ ...s, [dealId]: 'loading' }));
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location required', "Enable location access to confirm you're at this bar.");
        setCorrState((s) => ({ ...s, [dealId]: 'idle' }));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const dist = haversineMeters(pos.coords.latitude, pos.coords.longitude, venue.latitude, venue.longitude);
      if (dist > CORROBORATE_RADIUS_M) {
        Alert.alert("You're not at the bar", 'You need to be at the bar to confirm a deal is still accurate.');
        setCorrState((s) => ({ ...s, [dealId]: 'idle' }));
        return;
      }
      await submissionsAPI.corroborate(dealId);
      setCorrState((s) => ({ ...s, [dealId]: 'done' }));
    } catch (err: any) {
      const st = err?.response?.status;
      setCorrState((s) => ({ ...s, [dealId]: st === 409 ? 'already' : 'idle' }));
    }
  };

  const getDealIconName = (category: string): 'martini' | 'food' =>
    category === 'food' ? 'food' : 'martini';

  return (
    <View style={[styles.container, { backgroundColor: d.background }]}>
      {/* Floating back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <AppIcon name="back" size={22} role="default" />
      </TouchableOpacity>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Hero — centered logo + name */}
        <View style={styles.hero}>
          <VenueLogo logoUrl={venue.logo_url} name={venue.nickname ?? venue.name} size={88} />
          <Text style={[styles.heroName, { color: d.text }]}>{venue.nickname ?? venue.name}</Text>
          {venue.neighborhood && (
            <View style={styles.neighborhoodRow}>
              <AppIcon name="location" size={12} role="muted" />
              <Text style={[styles.heroNeighborhood, { color: d.textMuted }]}>{venue.neighborhood}</Text>
            </View>
          )}
          {venue.active && <LiveBadge label="Happy hour active" size="sm" />}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: d.cardBackground, borderColor: d.border }]}
            onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`)}
            activeOpacity={0.8}
          >
            <AppIcon name="directions" size={16} role="brand" />
            <Text style={[styles.actionButtonText, { color: d.text }]}>Directions</Text>
          </TouchableOpacity>
          {venue.phone && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: d.cardBackground, borderColor: d.border }]}
              onPress={() => Linking.openURL(`tel:${venue.phone}`)}
              activeOpacity={0.8}
            >
              <AppIcon name="phone" size={16} role="brand" />
              <Text style={[styles.actionButtonText, { color: d.text }]}>Call</Text>
            </TouchableOpacity>
          )}
          {venue.website && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: d.cardBackground, borderColor: d.border }]}
              onPress={() => Linking.openURL(venue.website!)}
              activeOpacity={0.8}
            >
              <AppIcon name="globe" size={16} role="brand" />
              <Text style={[styles.actionButtonText, { color: d.text }]}>Website</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: d.cardBackground, borderColor: d.border }]}
            onPress={() => setReportModalVisible(true)}
            activeOpacity={0.8}
          >
            <AppIcon name="flag" size={16} role="muted" />
            <Text style={[styles.actionButtonText, { color: d.text }]}>Report</Text>
          </TouchableOpacity>
        </View>

        <FlagReportModal visible={reportModalVisible} onClose={() => setReportModalVisible(false)} venue={venue} />

        {/* Day selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelectorContent}
          style={styles.daySelector}
        >
          {ALL_DAYS.map(({ db, label }) => {
            const isSelected = db === selectedDay;
            const isToday = db === todayDb;
            return (
              <TouchableOpacity
                key={db}
                style={[
                  styles.dayChip,
                  { borderColor: d.border, backgroundColor: d.cardBackground },
                  isSelected && { backgroundColor: d.primary, borderColor: d.primary },
                ]}
                onPress={() => setSelectedDay(db)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayChipLabel, { color: isSelected ? '#fff' : d.textMuted }]}>
                  {isToday ? 'TODAY' : label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Deals for selected day */}
        <View style={styles.body}>
          {loadError ? (
            <View style={[styles.emptyCard, { backgroundColor: d.cardBackground, borderColor: d.error }]}>
              <Text style={[styles.emptyText, { color: d.error }]}>Couldn't load deals</Text>
            </View>
          ) : loading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="small" color={d.primary} />
            </View>
          ) : !hasScheduleToday ? (
            <View style={[styles.emptyCard, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
              <AppIcon name="clock" size={28} role="muted" />
              <Text style={[styles.emptyText, { color: d.text }]}>
                No happy hour on {DAY_NAMES[selectedDay]}
              </Text>
            </View>
          ) : selectedDayDeals.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
              <AppIcon name="clock" size={28} role="muted" />
              <Text style={[styles.emptyText, { color: d.text }]}>No deals listed yet</Text>
            </View>
          ) : (
            <>
              {daySchedules.length > 0 && (
                <Text style={[styles.scheduleHint, { color: d.textMuted }]}>
                  {daySchedules.map((s) => `${formatTime(s.start_time)} – ${formatTime(s.end_time)}`).join(' · ')}
                </Text>
              )}
              {selectedDayDeals.map((deal) => {
                const cs = corrState[deal.id] ?? 'idle';
                const confirmed = cs === 'done' || cs === 'already';
                return (
                  <View
                    key={deal.id}
                    style={[styles.dealCard, { backgroundColor: d.cardBackground, borderColor: d.border }]}
                  >
                    <View style={[styles.dealThumb, { backgroundColor: d.filterInactive }]}>
                      <AppIcon name={getDealIconName(deal.category)} size={20} role="brand" />
                    </View>
                    <View style={styles.dealContent}>
                      <Text style={[styles.dealName, { color: d.text }]} numberOfLines={1}>{deal.title}</Text>
                      {deal.description && (
                        <Text style={[styles.dealDesc, { color: d.textMuted }]} numberOfLines={2}>{deal.description}</Text>
                      )}
                      <View style={styles.dealPricing}>
                        {deal.deal_price != null && deal.original_price != null && deal.original_price > deal.deal_price ? (
                          <>
                            <Text style={[styles.dealPrice, { color: d.primary }]}>${deal.deal_price.toFixed(0)}</Text>
                            <Text style={[styles.dealOriginal, { color: d.textMuted }]}>${deal.original_price.toFixed(0)}</Text>
                          </>
                        ) : deal.deal_price != null ? (
                          <Text style={[styles.dealPrice, { color: d.primary }]}>${deal.deal_price.toFixed(0)}</Text>
                        ) : deal.discount_percentage ? (
                          <Text style={[styles.dealPrice, { color: d.primary }]}>{deal.discount_percentage}% OFF</Text>
                        ) : null}
                      </View>
                      {user && isNearby === true && (
                        <TouchableOpacity
                          style={[
                            styles.corrButton,
                            confirmed
                              ? { backgroundColor: 'rgba(45,212,160,0.10)', borderColor: d.live }
                              : { backgroundColor: d.filterInactive, borderColor: 'transparent' },
                          ]}
                          onPress={() => handleCorroborate(deal.id)}
                          disabled={cs !== 'idle'}
                          activeOpacity={0.7}
                        >
                          <AppIcon name="upvote" size={12} role={confirmed ? 'positive' : 'muted'} weight="fill" />
                          <Text style={[styles.corrButtonText, { color: confirmed ? d.live : d.textMuted }]}>
                            {cs === 'done' ? '+2 pts · Still accurate'
                              : cs === 'already' ? 'Confirmed today'
                              : cs === 'loading' ? 'Confirming…'
                              : 'Still accurate? +2 pts'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {/* Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: d.text }]}>INFO</Text>
            <View style={[styles.infoCard, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
              <View style={styles.infoRow}>
                <AppIcon name="location" size={16} role="brand" />
                <Text style={[styles.infoText, { color: d.text }]}>{venue.address}</Text>
              </View>
              {venue.phone && (
                <>
                  <View style={[styles.infoDivider, { backgroundColor: d.divider }]} />
                  <View style={styles.infoRow}>
                    <AppIcon name="phone" size={16} role="brand" />
                    <Text style={[styles.infoText, { color: d.text }]}>{venue.phone}</Text>
                  </View>
                </>
              )}
              {venue.website && (
                <>
                  <View style={[styles.infoDivider, { backgroundColor: d.divider }]} />
                  <View style={styles.infoRow}>
                    <AppIcon name="globe" size={16} role="brand" />
                    <Text style={[styles.infoText, { color: d.primary }]}>{venue.website.replace(/^https?:\/\//, '')}</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          <View style={{ height: 140 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 0 },

  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 32,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  hero: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
    paddingBottom: 24,
    paddingHorizontal: 24,
    gap: 10,
  },
  heroName: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  neighborhoodRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroNeighborhood: { fontSize: 13, fontWeight: '500' },

  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  actionButtonText: { fontSize: 12, fontWeight: '600' },

  daySelector: { paddingBottom: 4 },
  daySelectorContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 16 },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 56,
    alignItems: 'center',
  },
  dayChipLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  body: { paddingHorizontal: 16, paddingTop: 4 },

  scheduleHint: { fontSize: 13, fontWeight: '500', marginBottom: 12 },

  loadingCenter: { alignItems: 'center', paddingVertical: 40 },

  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 28, alignItems: 'center', gap: 8, marginBottom: 24 },
  emptyText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },

  dealCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  dealThumb: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  dealContent: { flex: 1, minWidth: 0 },
  dealName: { fontSize: 14, fontWeight: '600', letterSpacing: -0.2 },
  dealDesc: { fontSize: 12, fontWeight: '500', marginTop: 4, lineHeight: 16 },
  dealPricing: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 6 },
  dealPrice: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  dealOriginal: { fontSize: 12, fontWeight: '500', textDecorationLine: 'line-through' },
  corrButton: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', marginTop: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1,
  },
  corrButtonText: { fontSize: 11, fontWeight: '600' },

  section: { marginTop: 24, marginBottom: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12 },

  infoCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  infoDivider: { height: 0.5, marginVertical: 10 },
  infoText: { fontSize: 13, fontWeight: '500', flex: 1 },
});

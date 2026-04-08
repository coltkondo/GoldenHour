import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme';
import { dealsAPI, venuesAPI } from '../api/endpoints';
import { Venue, Deal, HappyHourSchedule, DAY_NAMES } from '../types/api';
import { FlagReportModal } from '../components/FlagReportModal';
import { AppIcon } from '../components/icons';
import { LiveBadge } from '../components/ui/LiveBadge';

const { width } = Dimensions.get('window');

type HappyHourRouteParams = {
  HappyHour: { venue: Venue };
};

const formatTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return minutes === 0
    ? `${displayHour}${period}`
    : `${displayHour}:${String(minutes).padStart(2, '0')}${period}`;
};

export const HappyHourScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<HappyHourRouteParams, 'HappyHour'>>();
  const { theme } = useTheme();
  const d = theme.derived;
  const venue = route.params?.venue;

  const [deals, setDeals] = useState<Deal[]>([]);
  const [schedules, setSchedules] = useState<HappyHourSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const today = new Date().getDay();
  const todayDb = today === 0 ? 6 : today - 1;

  const loadData = async () => {
    if (!venue) return;
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
  };

  useEffect(() => {
    if (venue) {
      loadData();
    } else {
      navigation.goBack();
    }
  }, []);

  if (!venue) return null;

  const handleDirections = () => {
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`,
    );
  };

  const handleCall = () => {
    if (venue.phone) Linking.openURL(`tel:${venue.phone}`);
  };

  const handleWebsite = () => {
    if (venue.website) Linking.openURL(venue.website);
  };

  const getDealIconName = (category: string): 'martini' | 'food' => {
    return category === 'food' ? 'food' : 'martini';
  };

  return (
    <View style={[styles.container, { backgroundColor: d.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <View style={[styles.hero, { backgroundColor: d.background }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <AppIcon name="back" size={22} role="default" />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            <View style={styles.heroMeta}>
              {venue.venue_type && (
                <View style={[styles.typePill, { backgroundColor: d.filterInactive }]}>
                  <Text style={[styles.typePillText, { color: d.textMuted }]}>
                    {venue.venue_type}
                  </Text>
                </View>
              )}
              {venue.verified && (
                <View
                  style={[
                    styles.verifiedPill,
                    { backgroundColor: 'rgba(45,212,160,0.12)', borderColor: d.live },
                  ]}
                >
                  <AppIcon name="check" size={12} role="positive" />
                  <Text style={[styles.verifiedText, { color: d.live }]}>Verified</Text>
                </View>
              )}
            </View>

            <Text style={[styles.heroName, { color: d.text }]}>{venue.name}</Text>

            {venue.neighborhood && (
              <View style={styles.neighborhoodRow}>
                <AppIcon name="location" size={12} role="muted" />
                <Text style={[styles.heroNeighborhood, { color: d.textMuted }]}>
                  {venue.neighborhood}
                </Text>
              </View>
            )}

            {venue.active && <LiveBadge label="Happy hour active" size="sm" />}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: d.cardBackground, borderColor: d.border },
            ]}
            onPress={handleDirections}
            activeOpacity={0.8}
          >
            <AppIcon name="directions" size={16} role="brand" />
            <Text style={[styles.actionButtonText, { color: d.text }]}>Directions</Text>
          </TouchableOpacity>

          {venue.phone && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: d.cardBackground, borderColor: d.border },
              ]}
              onPress={handleCall}
              activeOpacity={0.8}
            >
              <AppIcon name="phone" size={16} role="brand" />
              <Text style={[styles.actionButtonText, { color: d.text }]}>Call</Text>
            </TouchableOpacity>
          )}

          {venue.website && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: d.cardBackground, borderColor: d.border },
              ]}
              onPress={handleWebsite}
              activeOpacity={0.8}
            >
              <AppIcon name="globe" size={16} role="brand" />
              <Text style={[styles.actionButtonText, { color: d.text }]}>Website</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: d.cardBackground, borderColor: d.border },
            ]}
            onPress={() => setReportModalVisible(true)}
            activeOpacity={0.8}
          >
            <AppIcon name="flag" size={16} role="muted" />
            <Text style={[styles.actionButtonText, { color: d.text }]}>Report</Text>
          </TouchableOpacity>
        </View>

        <FlagReportModal
          visible={reportModalVisible}
          onClose={() => setReportModalVisible(false)}
          venue={venue}
        />

        {loadError && (
          <View
            style={[styles.errorCard, { backgroundColor: d.cardBackground, borderColor: d.error }]}
          >
            <View style={styles.errorContent}>
              <Text style={[styles.errorTitle, { color: d.error }]}>Couldn't load deals</Text>
              <Text style={[styles.errorSub, { color: d.textMuted }]}>
                Check your connection and try again
              </Text>
            </View>
          </View>
        )}

        {/* Body */}
        <View style={styles.body}>
          {/* Active Deals */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: d.text }]}>ACTIVE DEALS</Text>
              {deals.length > 0 && (
                <View
                  style={[
                    styles.dealCountBadge,
                    { backgroundColor: 'rgba(45,212,160,0.12)', borderColor: d.live },
                  ]}
                >
                  <Text style={[styles.dealCountText, { color: d.live }]}>{deals.length}</Text>
                </View>
              )}
            </View>

            {loading ? (
              <View style={styles.loadingCenter}>
                <ActivityIndicator size="small" color={d.primary} />
              </View>
            ) : deals.length > 0 ? (
              deals.map((deal) => (
                <View
                  key={deal.id}
                  style={[
                    styles.dealCard,
                    { backgroundColor: d.cardBackground, borderColor: d.border },
                  ]}
                >
                  <View style={[styles.dealThumb, { backgroundColor: d.filterInactive }]}>
                    <AppIcon name={getDealIconName(deal.category)} size={20} role="brand" />
                  </View>
                  <View style={styles.dealContent}>
                    <Text style={[styles.dealName, { color: d.text }]} numberOfLines={1}>
                      {deal.title}
                    </Text>
                    {deal.description && (
                      <Text style={[styles.dealDesc, { color: d.textMuted }]} numberOfLines={2}>
                        {deal.description}
                      </Text>
                    )}
                    <View style={styles.dealPricing}>
                      {deal.deal_price != null &&
                      deal.original_price != null &&
                      deal.original_price > deal.deal_price ? (
                        <>
                          <Text style={[styles.dealPrice, { color: d.primary }]}>
                            ${deal.deal_price.toFixed(0)}
                          </Text>
                          <Text style={[styles.dealOriginal, { color: d.textMuted }]}>
                            ${deal.original_price.toFixed(0)}
                          </Text>
                        </>
                      ) : deal.deal_price != null ? (
                        <Text style={[styles.dealPrice, { color: d.primary }]}>
                          ${deal.deal_price.toFixed(0)}
                        </Text>
                      ) : deal.discount_percentage ? (
                        <Text style={[styles.dealPrice, { color: d.primary }]}>
                          {deal.discount_percentage}% OFF
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: d.cardBackground, borderColor: d.border },
                ]}
              >
                <AppIcon name="clock" size={28} role="muted" />
                <Text style={[styles.emptyText, { color: d.text }]}>No active deals right now</Text>
                <Text style={[styles.emptySubtext, { color: d.textMuted }]}>
                  Check back during happy hour times
                </Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: d.text }]}>INFO</Text>
            <View
              style={[
                styles.infoCard,
                { backgroundColor: d.cardBackground, borderColor: d.border },
              ]}
            >
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
                    <Text style={[styles.infoText, { color: d.primary }]}>
                      {venue.website.replace(/^https?:\/\//, '')}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Weekly Schedule */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: d.text, marginBottom: 14 }]}>SCHEDULE</Text>
            {schedules.length > 0 ? (
              <View
                style={[
                  styles.scheduleCard,
                  { backgroundColor: d.cardBackground, borderColor: d.border },
                ]}
              >
                {DAY_NAMES.map((dayName, dayIndex) => {
                  const daySchedules = schedules.filter((s) => s.day_of_week === dayIndex);
                  const isToday = dayIndex === todayDb;
                  return (
                    <View
                      key={dayIndex}
                      style={[
                        styles.scheduleRow,
                        isToday && styles.scheduleRowToday,
                        dayIndex < 6 && { borderBottomWidth: 0.5, borderBottomColor: d.divider },
                      ]}
                    >
                      <View style={styles.scheduleDayCol}>
                        <Text
                          style={[styles.scheduleDayText, { color: isToday ? d.live : d.text }]}
                        >
                          {dayName.slice(0, 3)}
                        </Text>
                        {isToday && (
                          <View
                            style={[
                              styles.todayBadge,
                              { backgroundColor: 'rgba(45,212,160,0.12)', borderColor: d.live },
                            ]}
                          >
                            <Text style={[styles.todayBadgeText, { color: d.live }]}>TODAY</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.scheduleTimesCol}>
                        {daySchedules.length > 0 ? (
                          daySchedules.map((s) => (
                            <Text
                              key={s.id}
                              style={[
                                styles.scheduleTimeText,
                                { color: isToday ? d.text : d.textMuted },
                              ]}
                            >
                              {formatTime(s.start_time)} – {formatTime(s.end_time)}
                            </Text>
                          ))
                        ) : (
                          <Text style={[styles.scheduleClosedText, { color: d.textHint }]}>
                            No happy hour
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: d.cardBackground, borderColor: d.border },
                ]}
              >
                <Text style={[styles.emptyText, { color: d.text }]}>Schedule coming soon</Text>
              </View>
            )}
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

  hero: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 16 },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroContent: { gap: 8 },
  heroMeta: { flexDirection: 'row', gap: 8 },
  typePill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  typePillText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1,
  },
  verifiedText: { fontSize: 11, fontWeight: '600' },
  heroName: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, lineHeight: 32 },
  neighborhoodRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroNeighborhood: { fontSize: 13, fontWeight: '500' },

  actionsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 6,
  },
  actionButtonText: { fontSize: 12, fontWeight: '600' },

  errorCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  errorContent: { flex: 1 },
  errorTitle: { fontSize: 14, fontWeight: '700' },
  errorSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  body: { paddingHorizontal: 16, paddingTop: 8, minHeight: 400 },

  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 1.2 },
  dealCountBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  dealCountText: { fontSize: 11, fontWeight: '800' },

  loadingCenter: { alignItems: 'center', paddingVertical: 24 },

  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 28, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  emptySubtext: { fontSize: 13, fontWeight: '500', textAlign: 'center' },

  dealCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  dealThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dealContent: { flex: 1, minWidth: 0 },
  dealName: { fontSize: 14, fontWeight: '600', letterSpacing: -0.2 },
  dealDesc: { fontSize: 12, fontWeight: '500', marginTop: 4, lineHeight: 16 },
  dealPricing: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 6 },
  dealPrice: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  dealOriginal: { fontSize: 12, fontWeight: '500', textDecorationLine: 'line-through' },

  infoCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  infoDivider: { height: 0.5, marginVertical: 10 },
  infoText: { fontSize: 13, fontWeight: '500', flex: 1 },

  scheduleCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  scheduleRowToday: { backgroundColor: 'rgba(45,212,160,0.06)' },
  scheduleDayCol: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scheduleDayText: { fontSize: 13, fontWeight: '600' },
  todayBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  todayBadgeText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
  scheduleTimesCol: { alignItems: 'flex-end' },
  scheduleTimeText: { fontSize: 13, fontWeight: '500' },
  scheduleClosedText: { fontSize: 12, fontWeight: '500', fontStyle: 'italic' },
});

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Dimensions,
  RefreshControl,
  Pressable,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, ThemeMode } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../hooks/useLocation';
import { venuesAPI, dealsAPI } from '../api/endpoints';
import { Venue, Deal } from '../types/api';
import { AppIcon, IconMap } from '../components/icons';
import { LiveBadge } from '../components/ui/LiveBadge';
import { StatusDot } from '../components/ui/StatusDot';
import {
  FILTER_PILLS,
  FilterCategory,
  SortMode,
  VenueWithDistance,
  applyDealFilters,
  applyVenueFilters,
} from '../utils/homeFilters';

const { width } = Dimensions.get('window');

const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
  { mode: 'nearest', label: 'Nearest' },
  { mode: 'best_deal', label: 'Best Deal' },
];

interface FloatingIcon {
  id: number;
  x: `${number}%`;
  y: `${number}%`;
  size: number;
  name: string;
  duration: number;
  delay: number;
}

const FEATURED_BG_ICONS: FloatingIcon[] = [
  { id: 1, x: '10%', y: '15%', size: 48, name: 'martini', duration: 8000, delay: 0 },
  { id: 2, x: '70%', y: '10%', size: 40, name: 'wine', duration: 10000, delay: 1500 },
  { id: 3, x: '50%', y: '55%', size: 56, name: 'deals', duration: 9000, delay: 3000 },
  { id: 4, x: '85%', y: '60%', size: 36, name: 'food', duration: 11000, delay: 500 },
  { id: 5, x: '25%', y: '75%', size: 44, name: 'martini', duration: 7500, delay: 2000 },
  { id: 6, x: '60%', y: '30%', size: 32, name: 'wine', duration: 12000, delay: 4000 },
  { id: 7, x: '5%', y: '50%', size: 28, name: 'deals', duration: 9500, delay: 1000 },
  { id: 8, x: '40%', y: '85%', size: 38, name: 'food', duration: 8500, delay: 2500 },
];

const FeaturedCardBackground: React.FC<{ primaryColor: string; mode: ThemeMode }> = ({
  primaryColor,
  mode,
}) => {
  const animatedValues = useRef(
    FEATURED_BG_ICONS.map(() => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
    })),
  ).current;

  const iconOpacity = mode === 'dark' ? 0.12 : 0.35;

  useEffect(() => {
    const animations = FEATURED_BG_ICONS.map((icon, i) => {
      const { translateY, translateX } = animatedValues[i];
      const range = 15 + (i % 3) * 5;
      const rangeX = 8 + (i % 4) * 3;

      const floatY = Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -range,
            duration: icon.duration / 2,
            delay: icon.delay,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: range,
            duration: icon.duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: icon.duration / 2,
            useNativeDriver: true,
          }),
        ]),
      );

      const floatX = Animated.loop(
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: rangeX,
            duration: icon.duration / 3,
            delay: icon.delay + 500,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: -rangeX,
            duration: icon.duration / 3,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: icon.duration / 3,
            useNativeDriver: true,
          }),
        ]),
      );

      floatY.start();
      floatX.start();

      return () => {
        floatY.stop();
        floatX.stop();
      };
    });

    return () => animations.forEach((cleanup) => cleanup());
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {FEATURED_BG_ICONS.map((icon, i) => (
        <Animated.View
          key={icon.id}
          style={[
            styles.floatingIcon,
            {
              left: icon.x,
              top: icon.y,
              opacity: iconOpacity,
              transform: [
                { translateY: animatedValues[i].translateY },
                { translateX: animatedValues[i].translateX },
              ],
            },
          ]}
        >
          <AppIcon name={icon.name as any} size={icon.size} role="brand" color={primaryColor} />
        </Animated.View>
      ))}
    </View>
  );
};

/* ── Helpers ───────────────────────────────────────────────── */

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatDistance = (miles: number): string => {
  if (miles < 0.1) return 'Nearby';
  if (miles < 1) return `${(miles * 5280).toFixed(0)} ft`;
  return `${miles.toFixed(1)} mi`;
};

const getDealIconName = (category: string): 'martini' | 'wine' | 'deals' | 'food' => {
  const lower = category.toLowerCase();
  if (lower.includes('wine') || lower.includes('glass') || lower.includes('bottle')) return 'wine';
  if (lower.includes('beer') || lower.includes('draft') || lower.includes('pint')) return 'deals';
  if (lower.includes('food') || lower.includes('bite') || lower.includes('appetizer'))
    return 'food';
  return 'martini';
};

interface ToastData {
  label: string;
  message: string;
  points: number;
}

/* ── Screen ────────────────────────────────────────────────── */

export const HomeScreen = () => {
  const { theme, mode } = useTheme();
  const d = theme.derived;
  const { user } = useAuth();
  const { location, loading: locationLoading } = useLocation();
  const navigation = useNavigation<any>();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('All');
  const [savedVenues, setSavedVenues] = useState<Set<string>>(new Set());
  const [showSortPanel, setShowSortPanel] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('nearest');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastData, setToastData] = useState<ToastData | null>(null);

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

  const navigateToVenue = (venue: Venue) => {
    navigation.navigate('HappyHour', { venue });
  };

  const navigateToExplorer = () => {
    navigation.navigate('ExplorerTab');
  };

  const navigateToMap = () => {
    navigation.navigate('MapTab');
  };

  const toggleSave = (venueId: string) => {
    setSavedVenues((prev) => {
      const next = new Set(prev);
      if (next.has(venueId)) next.delete(venueId);
      else next.add(venueId);
      return next;
    });
  };

  const venueMap = useMemo(() => new Map(venues.map((v) => [v.id, v])), [venues]);

  const filteredDeals = useMemo(
    () => applyDealFilters(deals, activeFilter, searchQuery, venueMap),
    [deals, activeFilter, searchQuery, venueMap],
  );

  const nearbyVenues = useMemo((): VenueWithDistance[] => {
    if (!location) return [];
    const withDistance = venues.map((venue) => ({
      ...venue,
      distance: calculateDistance(
        location.latitude,
        location.longitude,
        venue.latitude,
        venue.longitude,
      ),
    }));
    return applyVenueFilters(withDistance, searchQuery, sortMode, deals).slice(0, 6);
  }, [venues, location, searchQuery, sortMode, deals]);

  const featuredDeal = filteredDeals[0];
  const featuredVenue = featuredDeal ? venues.find((v) => v.id === featuredDeal.venue_id) : null;

  const compactDeals = useMemo(() => filteredDeals.slice(1, 4), [filteredDeals]);

  const upcomingDeals = useMemo(() => {
    return deals.filter((d) => d.active).slice(0, 4);
  }, [deals]);

  const locationLabel = location ? 'State College' : 'Enable location';

  if (locationLoading || loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: d.background }]}>
        <View style={[styles.loadingSpinner, { backgroundColor: d.filterInactive }]}>
          <ActivityIndicator size="large" color={d.primary} />
        </View>
        <Text style={[styles.loadingText, { color: d.text }]}>Finding happy hours near you</Text>
        <Text style={[styles.loadingSubtext, { color: d.textMuted }]}>
          This might take a moment
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: d.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={d.primary}
            progressViewOffset={80}
          />
        }
      >
        {/* ── Top Bar ─────────────────────────────────────── */}
        <View style={styles.topBar}>
          <Text style={[styles.wordmark, { color: d.primary }]}>GLDNHR</Text>
          <View style={styles.topBarRight}>
            <TouchableOpacity
              style={[
                styles.pointsPill,
                { borderColor: d.border, backgroundColor: d.cardBackground },
              ]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ProfileTab')}
            >
              <AppIcon name="points" size={12} role="brand" />
              <Text style={[styles.pointsText, { color: d.primary }]}>
                {user?.points_balance ?? 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={styles.bellButton}>
              <AppIcon name="bell" size={20} role="muted" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Location Header ─────────────────────────────── */}
        <TouchableOpacity style={styles.locationHeader} activeOpacity={0.7}>
          <StatusDot status="live" size={6} pulse={false} />
          <Text style={[styles.locationText, { color: d.textMuted }]}>{locationLabel}</Text>
          <AppIcon name="dropdown" size={14} role="muted" />
        </TouchableOpacity>

        {/* ── Toast Banner ────────────────────────────────── */}
        {toastVisible && toastData && (
          <View style={[styles.toastBanner, { backgroundColor: d.toastBackground }]}>
            <View style={styles.toastLeft}>
              <Text style={[styles.toastLabel, { color: d.live }]}>{toastData.label}</Text>
              <Text style={[styles.toastMessage, { color: d.text }]}>{toastData.message}</Text>
            </View>
            <View style={styles.toastRight}>
              <View style={[styles.toastPointsBadge, { backgroundColor: d.primary }]}>
                <Text style={[styles.toastPointsText, { color: d.buttonPrimaryText }]}>
                  +{toastData.points}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setToastVisible(false)} activeOpacity={0.7}>
                <AppIcon name="x" size={14} role="muted" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Search Row ──────────────────────────────────── */}
        <View style={styles.searchRow}>
          <View
            style={[styles.searchBox, { backgroundColor: d.cardBackground, borderColor: d.border }]}
          >
            <AppIcon name="search" size={18} role="muted" />
            <TextInput
              style={[styles.searchInput, { color: d.text }]}
              placeholder="Search deals, venues..."
              placeholderTextColor={d.textHint}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={[styles.searchClear, { backgroundColor: d.filterInactive }]}
              >
                <Text style={[styles.searchClearText, { color: d.text }]}>×</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: showSortPanel ? d.primary : d.cardBackground,
                borderColor: showSortPanel ? d.primary : d.border,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => setShowSortPanel((prev) => !prev)}
          >
            <AppIcon
              name="filter"
              size={18}
              role={showSortPanel ? 'button' : 'muted'}
              color={showSortPanel ? d.buttonPrimaryText : undefined}
            />
          </TouchableOpacity>
        </View>

        {/* ── Sort Panel ──────────────────────────────────── */}
        {showSortPanel && (
          <View
            style={[styles.sortPanel, { backgroundColor: d.cardBackground, borderColor: d.border }]}
          >
            <Text style={[styles.sortPanelLabel, { color: d.textMuted }]}>SORT BY</Text>
            <View style={styles.sortOptions}>
              {SORT_OPTIONS.map(({ mode, label }) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.sortOption,
                    {
                      backgroundColor:
                        sortMode === mode ? 'rgba(245,166,35,0.12)' : 'transparent',
                      borderColor: sortMode === mode ? d.primary : d.border,
                    },
                  ]}
                  onPress={() => setSortMode(mode)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      { color: sortMode === mode ? d.primary : d.textMuted },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Filter Pills ────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterPillsWrapper}
        >
          {FILTER_PILLS.map((pill) => (
            <TouchableOpacity
              key={pill}
              style={[
                styles.filterPill,
                {
                  backgroundColor:
                    activeFilter === pill ? 'rgba(245,166,35,0.12)' : d.filterInactive,
                  borderColor: activeFilter === pill ? d.primary : 'transparent',
                  borderWidth: 1,
                },
              ]}
              onPress={() => setActiveFilter(pill)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: activeFilter === pill ? d.primary : d.textMuted },
                ]}
              >
                {pill}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Hot Right Now ───────────────────────────────── */}
        {featuredDeal && featuredVenue ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: d.text }]}>HOT RIGHT NOW</Text>
              <LiveBadge />
            </View>

            {/* Featured Deal Card */}
            <TouchableOpacity
              style={[
                styles.featuredCard,
                { backgroundColor: d.cardBackground, borderColor: d.border },
              ]}
              onPress={() => navigateToVenue(featuredVenue)}
              activeOpacity={0.92}
            >
              <View style={[styles.featuredImageArea, { backgroundColor: d.primary }]}>
                <FeaturedCardBackground primaryColor={d.buttonPrimaryText} mode={mode} />
                <View
                  style={[
                    styles.featuredGradientOverlay,
                    { backgroundColor: d.background, opacity: 0.7 },
                  ]}
                />
                <View style={styles.featuredContent}>
                  <View style={styles.featuredTopRow}>
                    <TouchableOpacity
                      style={styles.featuredSaveButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleSave(featuredVenue.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <AppIcon
                        name="bookmark"
                        size={18}
                        role="default"
                        weight={savedVenues.has(featuredVenue.id) ? 'fill' : 'regular'}
                        color={d.text}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.featuredBottom}>
                    <Text style={[styles.featuredType, { color: d.live }]}>
                      {featuredDeal.category.toUpperCase()}
                    </Text>
                    <Text style={[styles.featuredPrice, { color: d.primary }]}>
                      {featuredDeal.deal_price
                        ? `$${featuredDeal.deal_price}`
                        : `${featuredDeal.discount_percentage}% OFF`}
                    </Text>
                    <Text style={[styles.featuredTitle, { color: d.text }]} numberOfLines={2}>
                      {featuredDeal.title}
                    </Text>
                    <View style={styles.featuredMetaRow}>
                      <AppIcon name="location" size={12} role="muted" />
                      <Text
                        style={[styles.featuredVenue, { color: d.textMuted }]}
                        numberOfLines={1}
                      >
                        {featuredVenue.name}
                      </Text>
                      {location && (
                        <Text style={[styles.featuredDistance, { color: d.textHint }]}>
                          {formatDistance(
                            calculateDistance(
                              location.latitude,
                              location.longitude,
                              featuredVenue.latitude,
                              featuredVenue.longitude,
                            ),
                          )}
                        </Text>
                      )}
                    </View>
                    {featuredDeal.items && featuredDeal.items.length > 0 && (
                      <View style={styles.featuredTags}>
                        {featuredDeal.items.slice(0, 3).map((item, i) => (
                          <View
                            key={i}
                            style={[styles.featuredTag, { backgroundColor: d.filterInactive }]}
                          >
                            <Text style={[styles.featuredTagText, { color: d.textMuted }]}>
                              {item}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                    <View style={styles.featuredFooter}>
                      <View style={styles.featuredUpvotes}>
                        <AppIcon name="upvote" size={14} role="muted" />
                        <Text style={[styles.featuredUpvoteText, { color: d.textMuted }]}>Hot</Text>
                      </View>
                      <View style={styles.featuredCTA}>
                        <Text style={[styles.featuredCTAText, { color: d.primary }]}>
                          View deal
                        </Text>
                        <AppIcon name="arrowRight" size={14} role="brand" />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Compact Deal Rows */}
            {compactDeals.length > 0 && (
              <View
                style={[
                  styles.compactList,
                  { backgroundColor: d.cardBackground, borderColor: d.border },
                ]}
              >
                {compactDeals.map((deal, index) => {
                  const dealIconName = getDealIconName(deal.category);
                  const venue = venues.find((v) => v.id === deal.venue_id);
                  const isLast = index === compactDeals.length - 1;
                  return (
                    <React.Fragment key={deal.id}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.compactRow,
                          pressed && { backgroundColor: d.filterInactive },
                        ]}
                        onPress={() => venue && navigateToVenue(venue)}
                      >
                        <View style={[styles.compactThumb, { backgroundColor: d.filterInactive }]}>
                          <AppIcon name={dealIconName} size={20} role="brand" />
                        </View>
                        <View style={styles.compactInfo}>
                          <Text style={[styles.compactName, { color: d.text }]} numberOfLines={1}>
                            {deal.title}
                          </Text>
                          <View style={styles.compactMeta}>
                            {venue && (
                              <Text
                                style={[styles.compactVenue, { color: d.textMuted }]}
                                numberOfLines={1}
                              >
                                {venue.name}
                              </Text>
                            )}
                            <View
                              style={[
                                styles.compactTimeBadge,
                                { backgroundColor: d.filterInactive },
                              ]}
                            >
                              <AppIcon name="clock" size={12} role="muted" />
                              <Text style={[styles.compactTimeText, { color: d.textMuted }]}>
                                HH
                              </Text>
                            </View>
                          </View>
                        </View>
                        <Text style={[styles.compactPrice, { color: d.primary }]}>
                          {deal.deal_price ? `$${deal.deal_price}` : `${deal.discount_percentage}%`}
                        </Text>
                      </Pressable>
                      {!isLast && (
                        <View style={[styles.compactSeparator, { backgroundColor: d.divider }]} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <View
            style={[styles.emptyCard, { backgroundColor: d.cardBackground, borderColor: d.border }]}
          >
            <AppIcon name="clock" size={28} role="muted" />
            <Text style={[styles.emptyTitle, { color: d.text }]}>No active deals right now</Text>
            <Text style={[styles.emptySub, { color: d.textMuted }]}>
              Check back during happy hour
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: d.primary }]}
              onPress={navigateToExplorer}
            >
              <Text style={[styles.emptyButtonText, { color: d.buttonPrimaryText }]}>
                Browse venues
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Nearby Now ──────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: d.text }]}>NEARBY NOW</Text>
            <TouchableOpacity onPress={navigateToMap} activeOpacity={0.7}>
              <Text style={[styles.sectionAction, { color: d.primary }]}>See map</Text>
            </TouchableOpacity>
          </View>

          {nearbyVenues.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.nearbyCardsContainer}
              style={styles.nearbyCardsScroll}
              decelerationRate="fast"
              snapToInterval={width * 0.42 + 12}
            >
              {nearbyVenues.map((venue) => {
                const venueDeal = deals.find((d) => d.venue_id === venue.id);
                const isSaved = savedVenues.has(venue.id);
                const venueType = venue.venue_type?.toLowerCase() || '';
                const logoName = venueType.includes('wine')
                  ? 'wine'
                  : venueType.includes('cocktail') || venueType.includes('lounge')
                    ? 'martini'
                    : venueType.includes('food') || venueType.includes('restaurant')
                      ? 'food'
                      : 'deals';
                return (
                  <TouchableOpacity
                    key={venue.id}
                    style={styles.nearbyCard}
                    onPress={() => navigateToVenue(venue)}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.nearbyCardInner,
                        { backgroundColor: d.cardBackground, borderColor: d.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.nearbyCardAccent,
                          { backgroundColor: d.primary, opacity: 0.15 },
                        ]}
                      />
                      <View style={styles.nearbyLogoCenter}>
                        <AppIcon
                          name={logoName}
                          size={48}
                          role="brand"
                          color={d.primary}
                          weight="fill"
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.nearbySaveButton}
                        onPress={() => toggleSave(venue.id)}
                        activeOpacity={0.7}
                      >
                        <AppIcon
                          name="heart"
                          size={18}
                          role="muted"
                          weight={isSaved ? 'fill' : 'regular'}
                          color={isSaved ? d.primary : d.textMuted}
                        />
                      </TouchableOpacity>
                      {venueDeal && (venueDeal.deal_price || venueDeal.discount_percentage) && (
                        <View style={[styles.nearbyPriceBadge, { backgroundColor: d.primary }]}>
                          <Text style={[styles.nearbyPriceText, { color: d.buttonPrimaryText }]}>
                            {venueDeal.deal_price
                              ? `$${venueDeal.deal_price}`
                              : `${venueDeal.discount_percentage}%`}
                          </Text>
                        </View>
                      )}
                      <View style={styles.nearbyCardContent}>
                        <Text style={[styles.nearbyCardName, { color: d.text }]} numberOfLines={1}>
                          {venue.name}
                        </Text>
                        <Text style={[styles.nearbyCardMeta, { color: d.textMuted }]}>
                          {formatDistance(venue.distance)}
                        </Text>
                        {venue.active && <LiveBadge label="LIVE" size="sm" />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: d.cardBackground, borderColor: d.border },
              ]}
            >
              <AppIcon name="location" size={28} role="muted" />
              <Text style={[styles.emptyTitle, { color: d.text }]}>No venues nearby</Text>
              <Text style={[styles.emptySub, { color: d.textMuted }]}>
                Enable location to find happy hours
              </Text>
            </View>
          )}
        </View>

        {/* ── Upcoming ────────────────────────────────────── */}
        {upcomingDeals.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: d.text, marginBottom: 14 }]}>UPCOMING</Text>
            <View
              style={[
                styles.upcomingList,
                { backgroundColor: d.cardBackground, borderColor: d.border },
              ]}
            >
              {upcomingDeals.map((deal, index) => {
                const venue = venues.find((v) => v.id === deal.venue_id);
                const isLast = index === upcomingDeals.length - 1;
                const hour = new Date().getHours();
                const startHour = Math.max(hour + 1, 17);
                const endHour = startHour + 3;
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const dayLabel = dayNames[new Date().getDay()];
                const timeLabel = `${startHour > 12 ? startHour - 12 : startHour}–${endHour > 12 ? endHour - 12 : endHour}${startHour >= 12 ? 'p' : 'a'}`;
                const dealIconName = getDealIconName(deal.category);
                return (
                  <React.Fragment key={deal.id}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.upcomingRow,
                        pressed && { backgroundColor: d.filterInactive },
                      ]}
                      onPress={() => venue && navigateToVenue(venue)}
                    >
                      <View
                        style={[styles.upcomingIconThumb, { backgroundColor: d.filterInactive }]}
                      >
                        <AppIcon name={dealIconName} size={20} role="brand" />
                      </View>
                      <View style={styles.upcomingLeft}>
                        <Text style={[styles.upcomingName, { color: d.text }]} numberOfLines={1}>
                          {deal.title}
                        </Text>
                        {venue && (
                          <View style={styles.upcomingVenueRow}>
                            <AppIcon name="location" size={10} role="muted" />
                            <Text
                              style={[styles.upcomingVenue, { color: d.textMuted }]}
                              numberOfLines={1}
                            >
                              {venue.name}
                            </Text>
                          </View>
                        )}
                        <View
                          style={[
                            styles.upcomingTimeBox,
                            { backgroundColor: 'rgba(45,212,160,0.12)', borderColor: d.live },
                          ]}
                        >
                          <Text style={[styles.upcomingTimeBoxText, { color: d.live }]}>
                            {dayLabel} {timeLabel}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.upcomingRight}>
                        {deal.original_price &&
                        deal.deal_price &&
                        deal.original_price > deal.deal_price ? (
                          <>
                            <Text style={[styles.upcomingDealPrice, { color: d.primary }]}>
                              ${deal.deal_price}
                            </Text>
                            <Text style={[styles.upcomingOriginalPrice, { color: d.textMuted }]}>
                              ${deal.original_price}
                            </Text>
                          </>
                        ) : deal.deal_price ? (
                          <Text style={[styles.upcomingDealPrice, { color: d.primary }]}>
                            ${deal.deal_price}
                          </Text>
                        ) : deal.discount_percentage ? (
                          <Text style={[styles.upcomingDealPrice, { color: d.primary }]}>
                            {deal.discount_percentage}%
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                    {!isLast && (
                      <View style={[styles.upcomingSeparator, { backgroundColor: d.divider }]} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

/* ── Styles ────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 56, paddingHorizontal: 16 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingSpinner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, marginBottom: 4 },
  loadingSubtext: { fontSize: 13, fontWeight: '500' },

  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  wordmark: { fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  bellButton: { padding: 4 },

  /* Location Header */
  locationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  locationText: { fontSize: 13, fontWeight: '500', flex: 1 },

  /* Toast Banner */
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  toastLeft: { flex: 1 },
  toastLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  toastMessage: { fontSize: 13, fontWeight: '500' },
  toastRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toastPointsBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  toastPointsText: { fontSize: 13, fontWeight: '800' },

  /* Search */
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500', padding: 0 },
  searchClear: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchClearText: { fontSize: 14, fontWeight: '600', marginTop: -2 },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  /* Sort Panel */
  sortPanel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sortPanelLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  sortOptions: { flexDirection: 'row', gap: 8, flex: 1 },
  sortOption: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  sortOptionText: { fontSize: 12, fontWeight: '600' },

  /* Filter Pills */
  filterScroll: { marginBottom: 24, marginLeft: -16, marginRight: -16 },
  filterPillsWrapper: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 4 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16 },
  filterPillText: { fontSize: 12, fontWeight: '600' },

  /* Section */
  section: { marginBottom: 28, marginTop: 8 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 1.2 },
  sectionAction: { fontSize: 12, fontWeight: '600' },

  /* Featured Card */
  featuredCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 12, borderWidth: 1 },
  featuredImageArea: { height: 260, position: 'relative' },
  featuredGradientOverlay: { ...StyleSheet.absoluteFillObject },
  featuredContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
    zIndex: 1,
  },
  floatingIcon: { position: 'absolute' },
  featuredTopRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  featuredSaveButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBottom: { gap: 6 },
  featuredType: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  featuredPrice: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  featuredTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, lineHeight: 24 },
  featuredMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featuredVenue: { fontSize: 13, fontWeight: '500', flex: 1 },
  featuredDistance: { fontSize: 12, fontWeight: '500' },
  featuredTags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  featuredTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  featuredTagText: { fontSize: 10, fontWeight: '500' },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  featuredUpvotes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featuredUpvoteText: { fontSize: 11, fontWeight: '600' },
  featuredCTA: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featuredCTAText: { fontSize: 13, fontWeight: '700' },

  /* Compact List */
  compactList: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  compactThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compactInfo: { flex: 1, marginRight: 8, minWidth: 0 },
  compactName: { fontSize: 14, fontWeight: '600', letterSpacing: -0.2 },
  compactMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  compactVenue: { fontSize: 12, fontWeight: '500', flex: 1 },
  compactTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  compactTimeText: { fontSize: 9, fontWeight: '600' },
  compactPrice: { fontSize: 14, fontWeight: '700' },
  compactSeparator: { height: 0.5, marginLeft: 66, marginRight: 14 },

  /* Empty */
  emptyCard: { borderRadius: 20, padding: 28, alignItems: 'center', borderWidth: 1, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptySub: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  emptyButton: { marginTop: 8, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  emptyButtonText: { fontSize: 13, fontWeight: '700' },

  /* Nearby */
  nearbyCardsScroll: { marginBottom: 0, marginLeft: -4, marginRight: -4 },
  nearbyCardsContainer: { gap: 12, paddingHorizontal: 4 },
  nearbyCard: { width: width * 0.42, borderRadius: 16, overflow: 'hidden' },
  nearbyCardInner: {
    height: 180,
    position: 'relative',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  nearbyCardAccent: { ...StyleSheet.absoluteFillObject },
  nearbyLogoCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 60,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.2,
  },
  nearbySaveButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  nearbyPriceBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 2,
  },
  nearbyPriceText: { fontSize: 11, fontWeight: '800' },
  nearbyCardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, zIndex: 1 },
  nearbyCardName: { fontSize: 15, fontWeight: '700', marginBottom: 2, letterSpacing: -0.3 },
  nearbyCardMeta: { fontSize: 11, fontWeight: '500', marginBottom: 6 },

  /* Upcoming */
  upcomingList: { paddingTop: 8, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  upcomingIconThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  upcomingLeft: { flex: 1, marginRight: 12, minWidth: 0 },
  upcomingName: { fontSize: 14, fontWeight: '600', letterSpacing: -0.2 },
  upcomingVenueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  upcomingVenue: { fontSize: 12, fontWeight: '500', flex: 1 },
  upcomingTimeBox: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
  },
  upcomingTimeBoxText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  upcomingRight: { alignItems: 'flex-end', gap: 2 },
  upcomingOriginalPrice: { fontSize: 12, fontWeight: '500', textDecorationLine: 'line-through' },
  upcomingDealPrice: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  upcomingSeparator: { height: 0.5, marginLeft: 14, marginRight: 14 },
  bottomSpacer: { height: 140 },
});

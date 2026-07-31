import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme';
import { Venue } from '../types/api';
import { VenueCard } from './Cards/VenueCard';
import { AppIcon } from './icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MINIMIZED_HEIGHT = 120;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.5;
const DRAG_THRESHOLD = 50;
const VISIBLE_SCROLL_HEIGHT = EXPANDED_HEIGHT + 40;

interface VenueBottomSheetProps {
  venues: Venue[];
  allVenues: Venue[];
  userLocation: { latitude: number; longitude: number };
  selectedVenueId: string | null;
  onVenuePress: (venue: Venue) => void;
  onViewDetails?: (venue: Venue) => void;
  liveVenueIds?: Set<string>;
}

export const VenueBottomSheet: React.FC<VenueBottomSheetProps> = ({
  venues = [],
  allVenues = [],
  userLocation,
  selectedVenueId,
  onVenuePress,
  onViewDetails,
  liveVenueIds,
}) => {
  const { theme } = useTheme();
  const d = theme.derived;
  const [isExpanded, setIsExpanded] = useState(false);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT - MINIMIZED_HEIGHT)).current;
  const [isScrollEnabled, setIsScrollEnabled] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const venueRefs = useRef<{ [key: string]: { y: number; height: number } }>({});
  const scrollViewHeightRef = useRef(0);
  const isExpandedRef = useRef(isExpanded);

  useEffect(() => {
    isExpandedRef.current = isExpanded;
  }, [isExpanded]);

  useEffect(() => {
    if (selectedVenueId && isExpanded && scrollViewRef.current) {
      const pos = venueRefs.current[selectedVenueId];
      if (pos && scrollViewHeightRef.current > 0) {
        const targetY = Math.max(0, pos.y - (scrollViewHeightRef.current - pos.height) / 2);
        scrollViewRef.current.scrollTo({ y: targetY, animated: true });
      }
    }
  }, [selectedVenueId, isExpanded, venues]);

  useEffect(() => {
    if (selectedVenueId && !isExpanded) {
      animateToPosition(true);
    }
  }, [selectedVenueId]); // eslint-disable-line react-hooks/exhaustive-deps

  const animateToPosition = useCallback(
    (expand: boolean) => {
      setIsExpanded(expand);
      const targetY = SCREEN_HEIGHT - (expand ? EXPANDED_HEIGHT : MINIMIZED_HEIGHT);
      Animated.spring(translateY, {
        toValue: targetY,
        useNativeDriver: true,
        damping: 24,
        stiffness: 180,
      }).start(() => {
        setIsScrollEnabled(expand);
        if (!expand && scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: false });
        }
      });
    },
    [translateY],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > Math.abs(gs.dx),
        onPanResponderGrant: () => {
          setIsScrollEnabled(false);
        },
        onPanResponderMove: (_, gs) => {
          const expanded = isExpandedRef.current;
          const baseY = SCREEN_HEIGHT - (expanded ? EXPANDED_HEIGHT : MINIMIZED_HEIGHT);
          const newY = baseY + gs.dy;
          const clampedY = Math.max(
            SCREEN_HEIGHT - EXPANDED_HEIGHT,
            Math.min(SCREEN_HEIGHT - MINIMIZED_HEIGHT, newY),
          );
          translateY.setValue(clampedY);
        },
        onPanResponderRelease: (_, gs) => {
          const isTap = Math.abs(gs.dx) < 5 && Math.abs(gs.dy) < 5;
          if (isTap) {
            animateToPosition(!isExpandedRef.current);
            return;
          }
          const expanded = isExpandedRef.current;
          let shouldExpand: boolean;
          if (Math.abs(gs.vy) > 0.5) {
            shouldExpand = gs.vy < 0;
          } else {
            shouldExpand = expanded ? gs.dy > -DRAG_THRESHOLD : gs.dy < DRAG_THRESHOLD;
          }
          animateToPosition(shouldExpand);
        },
      }),
    [translateY, animateToPosition],
  );

  const handleVenueCardPress = useCallback(
    (venue: Venue) => {
      onVenuePress(venue);
    },
    [onVenuePress],
  );

  const handleCardLayout = useCallback(
    (venueId: string, y: number, height: number) => {
      venueRefs.current[venueId] = { y, height };
    },
    [],
  );

  return (
    <Animated.View
      style={[
        styles.bottomSheet,
        {
          backgroundColor: d.cardBackground,
          borderTopColor: d.border,
          shadowColor: '#000',
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        {...panResponder.panHandlers}
        style={[styles.dragHandleContainer, { borderBottomColor: d.border }]}
      >
        <View style={[styles.handlePill, { backgroundColor: d.filterInactive }]}>
          <AppIcon name={isExpanded ? 'dropdown' : 'caretUp'} size={14} role="muted" />
        </View>
        <Text style={[styles.sheetTitle, { color: d.text }]}>
          {venues.length} Happy Hour{venues.length !== 1 ? 's' : ''} Nearby
        </Text>
        {venues.length !== allVenues.length && (
          <Text style={[styles.sheetSubtitle, { color: d.textMuted }]}>
            {allVenues.length} total in area
          </Text>
        )}
      </View>

      {venues.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconContainer, { backgroundColor: d.filterInactive }]}>
            <AppIcon name="search" size={32} role="muted" />
          </View>
          <Text style={[styles.emptyText, { color: d.text }]}>No venues in this area</Text>
          <Text style={[styles.emptySubtext, { color: d.textMuted }]}>
            Try zooming out or panning the map
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={isScrollEnabled}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="never"
          onLayout={(e) => {
            scrollViewHeightRef.current = e.nativeEvent.layout.height;
          }}
        >
          {venues.map((venue) => (
            <View
              key={venue.id}
              onLayout={(event) => {
                const { y, height } = event.nativeEvent.layout;
                handleCardLayout(venue.id, y, height);
              }}
            >
              <VenueCard
                venue={venue}
                userLocation={userLocation}
                onPress={handleVenueCardPress}
                onViewDetails={onViewDetails}
                isSelected={selectedVenueId === venue.id}
                isLiveNow={liveVenueIds?.has(venue.id) ?? false}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 0.5,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 16,
  },
  dragHandleContainer: {
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 0.5,
  },
  handlePill: {
    width: 36,
    height: 24,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  sheetSubtitle: { fontSize: 12, fontWeight: '500', marginTop: 4 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: VISIBLE_SCROLL_HEIGHT, paddingTop: 8 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptySubtext: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
});

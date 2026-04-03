import React, { useRef, useState, useEffect } from 'react';
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
const VISIBLE_SCROLL_HEIGHT = EXPANDED_HEIGHT + 20;

interface VenueBottomSheetProps {
  venues: Venue[];
  allVenues: Venue[];
  userLocation: { latitude: number; longitude: number };
  selectedVenueId: string | null;
  onVenuePress: (venue: Venue) => void;
}

export const VenueBottomSheet: React.FC<VenueBottomSheetProps> = ({
  venues = [],
  allVenues = [],
  userLocation,
  selectedVenueId,
  onVenuePress,
}) => {
  const { theme } = useTheme();
  const d = theme.derived;
  const [isExpanded, setIsExpanded] = useState(false);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT - MINIMIZED_HEIGHT)).current;
  const [isScrollEnabled, setIsScrollEnabled] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const venueRefs = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    if (selectedVenueId && isExpanded && scrollViewRef.current) {
      const selectedIndex = venues.findIndex((v) => v.id === selectedVenueId);
      if (selectedIndex !== -1 && venueRefs.current[selectedVenueId] !== undefined) {
        scrollViewRef.current.scrollTo({ y: venueRefs.current[selectedVenueId], animated: true });
      }
    }
  }, [selectedVenueId, isExpanded, venues]);

  useEffect(() => {
    if (selectedVenueId && !isExpanded) {
      animateToPosition(true);
    }
  }, [selectedVenueId]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderGrant: () => setIsScrollEnabled(false),
      onPanResponderMove: (_, gs) => {
        const baseY = SCREEN_HEIGHT - (isExpanded ? EXPANDED_HEIGHT : MINIMIZED_HEIGHT);
        const newY = baseY + gs.dy;
        const clampedY = Math.max(
          SCREEN_HEIGHT - EXPANDED_HEIGHT,
          Math.min(SCREEN_HEIGHT - MINIMIZED_HEIGHT, newY),
        );
        translateY.setValue(clampedY);
      },
      onPanResponderRelease: (_, gs) => {
        let shouldExpand: boolean;
        if (Math.abs(gs.vy) > 0.5) {
          shouldExpand = gs.vy < 0;
        } else {
          shouldExpand = isExpanded ? gs.dy > -DRAG_THRESHOLD : gs.dy < DRAG_THRESHOLD;
        }
        animateToPosition(shouldExpand);
      },
    }),
  ).current;

  const animateToPosition = (expand: boolean) => {
    const targetY = SCREEN_HEIGHT - (expand ? EXPANDED_HEIGHT : MINIMIZED_HEIGHT);
    Animated.spring(translateY, {
      toValue: targetY,
      useNativeDriver: true,
      damping: 20,
      stiffness: 150,
    }).start(() => {
      setIsExpanded(expand);
      setIsScrollEnabled(expand);
      if (!expand && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
    });
  };

  const handleVenueCardPress = (venue: Venue) => {
    onVenuePress(venue);
  };

  const handleCardLayout = (venueId: string, yPosition: number) => {
    venueRefs.current[venueId] = yPosition;
  };

  return (
    <Animated.View
      style={[
        styles.bottomSheet,
        { backgroundColor: d.cardBackground, transform: [{ translateY }] },
      ]}
    >
      <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
        <View style={[styles.dragHandle, { backgroundColor: d.textMuted }]} />
        <Text style={[styles.sheetTitle, { color: d.text }]}>
          {venues.length} Happy Hour{venues.length !== 1 ? 's' : ''} Nearby
        </Text>
        {venues.length !== allVenues.length && (
          <Text style={[styles.sheetSubtitle, { color: d.textMuted }]}>
            {allVenues.length} total in area
          </Text>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={isScrollEnabled}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
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
          venues.map((venue) => (
            <View
              key={venue.id}
              onLayout={(event) => {
                const { y } = event.nativeEvent.layout;
                handleCardLayout(venue.id, y);
              }}
            >
              <VenueCard
                venue={venue}
                userLocation={userLocation}
                onPress={handleVenueCardPress}
                isSelected={selectedVenueId === venue.id}
              />
            </View>
          ))
        )}
      </ScrollView>
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
    shadowColor: '#000',
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
    borderBottomColor: '#2A2A2A',
  },
  dragHandle: { width: 40, height: 4, borderRadius: 2, marginBottom: 12 },
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

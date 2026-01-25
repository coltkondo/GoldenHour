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
import { Venue } from '../types/api';
import { VenueCard } from './Cards/VenueCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MINIMIZED_HEIGHT = 120;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.5;
const DRAG_THRESHOLD = 50;
const VISIBLE_SCROLL_HEIGHT =
   EXPANDED_HEIGHT + 20;

const CARD_HEIGHT = 180; // Approximate height of each card

interface VenueBottomSheetProps {
  venues: Venue[];
  allVenues: Venue[];
  userLocation: {
    latitude: number;
    longitude: number;
  };
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
  const [isExpanded, setIsExpanded] = useState(false);
  const translateY = useRef(
    new Animated.Value(SCREEN_HEIGHT - MINIMIZED_HEIGHT)
  ).current;
  const [isScrollEnabled, setIsScrollEnabled] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const venueRefs = useRef<{ [key: string]: number }>({});

  // Auto-scroll to selected venue
  useEffect(() => {
    if (selectedVenueId && isExpanded && scrollViewRef.current) {
      const selectedIndex = venues.findIndex(v => v.id === selectedVenueId);
      
      if (selectedIndex !== -1 && venueRefs.current[selectedVenueId] !== undefined) {
        // Scroll to the position of the selected card
        scrollViewRef.current.scrollTo({
          y: venueRefs.current[selectedVenueId],
          animated: true,
        });
      }
    }
  }, [selectedVenueId, isExpanded, venues]);

  // Auto-expand when a venue is selected
  useEffect(() => {
    if (selectedVenueId && !isExpanded) {
      animateToPosition(true);
    }
  }, [selectedVenueId]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only handle vertical drags
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => {
        // Disable scrolling when starting to drag the sheet
        setIsScrollEnabled(false);
      },
      onPanResponderMove: (_, gestureState) => {
        const baseY = SCREEN_HEIGHT - (isExpanded ? EXPANDED_HEIGHT : MINIMIZED_HEIGHT);
        const newY = baseY + gestureState.dy;
        
        // Clamp between expanded and minimized positions
        const clampedY = Math.max(
          SCREEN_HEIGHT - EXPANDED_HEIGHT,
          Math.min(SCREEN_HEIGHT - MINIMIZED_HEIGHT, newY)
        );
        
        translateY.setValue(clampedY);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dy, vy } = gestureState;
        
        // Determine final position based on drag distance and velocity
        let shouldExpand: boolean;
        
        if (Math.abs(vy) > 0.5) {
          // Fast swipe - use velocity
          shouldExpand = vy < 0;
        } else {
          // Slow drag - use threshold
          shouldExpand = isExpanded
            ? dy > -DRAG_THRESHOLD
            : dy < DRAG_THRESHOLD;
        }

        animateToPosition(shouldExpand);
      },
    })
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
      
      // Reset scroll position when collapsing
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
        {
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Drag Handle Area - Always draggable */}
      <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
        <View style={styles.dragHandle} />
        <Text style={styles.sheetTitle}>
          {venues.length} Happy Hour{venues.length !== 1 ? 's' : ''} Nearby
        </Text>
        {venues.length !== allVenues.length && (
          <Text style={styles.sheetSubtitle}>
            ({allVenues.length} total in area)
          </Text>
        )}
      </View>

      {/* Scrollable Venue List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={isScrollEnabled}
        showsVerticalScrollIndicator={true}
        bounces={false}
      >
        {venues.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>No venues in this area</Text>
            <Text style={styles.emptySubtext}>Try zooming out on the map</Text>
          </View>
        ) : (
          venues.map((venue, index) => (
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
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  dragHandleContainer: {
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: VISIBLE_SCROLL_HEIGHT,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});
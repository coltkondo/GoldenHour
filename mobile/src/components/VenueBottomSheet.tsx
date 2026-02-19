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
const VISIBLE_SCROLL_HEIGHT = EXPANDED_HEIGHT + 20;

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
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => {
        setIsScrollEnabled(false);
      },
      onPanResponderMove: (_, gestureState) => {
        const baseY = SCREEN_HEIGHT - (isExpanded ? EXPANDED_HEIGHT : MINIMIZED_HEIGHT);
        const newY = baseY + gestureState.dy;
        
        const clampedY = Math.max(
          SCREEN_HEIGHT - EXPANDED_HEIGHT,
          Math.min(SCREEN_HEIGHT - MINIMIZED_HEIGHT, newY)
        );
        
        translateY.setValue(clampedY);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dy, vy } = gestureState;
        
        let shouldExpand: boolean;
        
        if (Math.abs(vy) > 0.5) {
          shouldExpand = vy < 0;
        } else {
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
      {/* Drag Handle Area */}
      <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
        <View style={styles.dragHandle} />
        <Text style={styles.sheetTitle}>
          {venues.length} Happy Hour{venues.length !== 1 ? 's' : ''}
        </Text>
        {venues.length !== allVenues.length && (
          <Text style={styles.sheetSubtitle}>
            {allVenues.length} total in area
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
            <Text style={styles.emptyText}>No venues in view</Text>
            <Text style={styles.emptySubtext}>Zoom out or move the map</Text>
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
    backgroundColor: '#0F0F14', // Dark background
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 2,
    borderTopColor: 'rgba(255, 215, 0, 0.2)', // Gold border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  dragHandleContainer: {
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#5A5D66', // Low-contrast gray
    borderRadius: 2,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F5F7FA', // Off-white
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0A3AD', // Muted gray
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
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F5F7FA',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0A3AD',
  },
});
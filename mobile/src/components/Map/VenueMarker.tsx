import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Venue } from '../../types/api';

interface VenueMarkerProps {
  venue: Venue;
  isSelected: boolean;
  onPress: (venue: Venue) => void;
}

export const VenueMarker: React.FC<VenueMarkerProps> = ({ venue, isSelected, onPress }) => {
  // RULEBOOK: Simplified pin design - one shape, one color family
  // Use size for popularity instead of icons/text
  const markerSize = isSelected ? 48 : 32;
  const dotSize = isSelected ? 12 : 8;

  return (
    <Marker
      coordinate={{
        latitude: venue.latitude,
        longitude: venue.longitude,
      }}
      onPress={() => onPress(venue)}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={[styles.markerContainer, isSelected && styles.markerContainerSelected]}>
        {/* Main pin bubble - always gold when selected */}
        <View
          style={[
            styles.markerBubble,
            {
              width: markerSize,
              height: markerSize,
            },
            isSelected && styles.markerBubbleSelected,
          ]}
        >
          {/* Inner dot for visual interest */}
          <View
            style={[
              styles.markerDot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
              },
            ]}
          />
        </View>

        {/* Venue name label (only when selected) */}
        {isSelected && (
          <View style={styles.nameLabel}>
            <Text style={styles.nameLabelText} numberOfLines={1}>
              {venue.name}
            </Text>
          </View>
        )}

        {/* Arrow pointer */}
        <View
          style={[
            styles.markerArrow,
            isSelected && styles.markerArrowSelected,
          ]}
        />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  markerContainerSelected: {
    zIndex: 999,
  },
  // RULEBOOK: One shape (circle), one color family (gold)
  markerBubble: {
    backgroundColor: '#171A21', // Dark surface
    borderRadius: 100, // Always circular
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#5A5D66', // Low-contrast gray for inactive
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerBubbleSelected: {
    backgroundColor: '#FFD700', // Gold for selected
    borderColor: '#FFA500', // Light gold border
    borderWidth: 3,
    shadowColor: '#FFD700', // Gold glow
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  // Inner dot for visual interest
  markerDot: {
    backgroundColor: '#FFD700', // Gold dot on dark pins
  },
  // Venue name label (appears above pin when selected)
  nameLabel: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 8,
    backgroundColor: '#0F0F14',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    maxWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  nameLabelText: {
    color: '#F5F7FA',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  // Arrow pointer
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#5A5D66', // Matches inactive border
    marginTop: -1,
  },
  markerArrowSelected: {
    borderTopColor: '#FFA500', // Light gold (matches border)
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
  },
});
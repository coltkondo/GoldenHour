import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Venue } from '../../types/api';

interface VenueMarkerProps {
  venue: Venue;
  isSelected: boolean;
  onPress: (venue: Venue) => void;
}

const VENUE_TYPE_ICONS: Record<string, string> = {
  bar: '🍺',
  restaurant: '🍽️',
  club: '🎵',
  rooftop: '🌆',
  brewery: '🍺',
  wine: '🍷',
  lounge: '🍸',
  pub: '🍺',
  sports: '🏈',
  mexican: '🌮',
  italian: '🍕',
  asian: '🍣',
  american: '🍔',
};

function getVenueIcon(type: string | null): string {
  if (!type) return '🍻';
  const lower = type.toLowerCase();
  for (const [key, icon] of Object.entries(VENUE_TYPE_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '🍻';
}

export const VenueMarker: React.FC<VenueMarkerProps> = ({ venue, isSelected, onPress }) => {
  const icon = getVenueIcon(venue.venue_type);

  return (
    <Marker
      coordinate={{
        latitude: venue.latitude,
        longitude: venue.longitude,
      }}
      onPress={() => onPress(venue)}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={[styles.markerContainer, isSelected && styles.markerSelected]}>
        <View style={[styles.markerBubble, isSelected && styles.bubbleSelected]}>
          <Text style={styles.markerIcon}>{icon}</Text>
          {isSelected && (
            <Text style={styles.markerName} numberOfLines={1}>
              {venue.name}
            </Text>
          )}
        </View>
        <View style={[styles.markerArrow, isSelected && styles.arrowSelected]} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  markerSelected: {
    zIndex: 999,
  },
  markerBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  bubbleSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  markerIcon: {
    fontSize: 18,
  },
  markerName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
    maxWidth: 100,
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FF6B35',
    marginTop: -1,
  },
  arrowSelected: {
    borderTopColor: '#FFD700',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
  },
});

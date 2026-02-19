import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Venue } from '../../types/api';

interface VenueCardProps {
  venue: Venue;
  userLocation: {
    latitude: number;
    longitude: number;
  };
  onPress: (venue: Venue) => void;
  isSelected?: boolean;
}

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 3959; // Earth's radius in miles
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

export const VenueCard: React.FC<VenueCardProps> = ({ 
  venue, 
  userLocation, 
  onPress,
  isSelected = false,
}) => {
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    venue.latitude,
    venue.longitude
  );

  const handlePress = () => {
    onPress(venue);
  };

  const handleDirectionsPress = (e: any) => {
    e.stopPropagation();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`;
    Linking.openURL(url);
  };

  return (
    <TouchableOpacity 
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]} 
      activeOpacity={0.8}
      onPress={handlePress}
    >
      {/* RULEBOOK: Max 3 elements per card */}
      
      {/* 1. VENUE NAME (Primary Info) */}
      <View style={styles.nameRow}>
        <Text style={styles.venueName} numberOfLines={1}>
          {venue.name}
        </Text>
        {venue.verified && (
          <Ionicons name="checkmark-circle" size={18} color="#4CAF50" style={styles.verifiedIcon} />
        )}
      </View>

      {/* 2. LOCATION (Secondary Info) */}
      <Text style={styles.location} numberOfLines={1}>
        {venue.neighborhood || venue.address} · {distance.toFixed(1)} mi
      </Text>

      {/* 3. POPULARITY SIGNAL (Active/Distance) */}
      <View style={styles.bottomRow}>
        {venue.active ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE NOW</Text>
          </View>
        ) : (
          <View style={styles.distanceBadge}>
            <Ionicons name="time-outline" size={14} color="#5A5D66" />
            <Text style={styles.distanceText}>
              {venue.venue_type || 'Venue'}
            </Text>
          </View>
        )}

        {/* Quick directions button - appears on selected card */}
        {isSelected && (
          <TouchableOpacity
            style={styles.directionsButton}
            onPress={handleDirectionsPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.directionsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="navigate" size={16} color="#0F0F14" />
              <Text style={styles.directionsText}>Go</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // RULEBOOK: Dark mode, gold accent, max 3 elements
  card: {
    backgroundColor: '#171A21', // Dark surface
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)', // Subtle border
  },
  cardSelected: {
    borderColor: 'rgba(255, 215, 0, 0.3)', // Gold border when selected
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },

  // 1. Venue Name (Primary)
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  venueName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F5F7FA', // Off-white
    letterSpacing: -0.3,
    flex: 1,
  },
  verifiedIcon: {
    marginLeft: 6,
  },

  // 2. Location (Secondary)
  location: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0A3AD', // Muted gray
    marginBottom: 12,
  },

  // 3. Bottom Row (Popularity Signal)
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  // Live badge (gold)
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 0.8,
  },

  // Distance badge (inactive state)
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A5D66', // Low-contrast gray
    textTransform: 'capitalize',
  },

  // Directions button (only on selected cards)
  directionsButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  directionsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  directionsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F0F14',
    letterSpacing: -0.2,
  },
});
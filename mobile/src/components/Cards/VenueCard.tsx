import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
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

  const handlePhonePress = (e: any) => {
    e.stopPropagation();
    if (venue.phone) {
      Linking.openURL(`tel:${venue.phone}`);
    }
  };

  const handleWebsitePress = (e: any) => {
    e.stopPropagation();
    if (venue.website) {
      Linking.openURL(venue.website);
    }
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
      {isSelected && <View style={styles.selectedIndicator} />}
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.venueName} numberOfLines={1}>
              {venue.name}
            </Text>
            {venue.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
              </View>
            )}
          </View>
          
          <View style={styles.metaRow}>
            {venue.venue_type && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{venue.venue_type}</Text>
              </View>
            )}
            {venue.neighborhood && (
              <Text style={styles.neighborhood}>📍 {venue.neighborhood}</Text>
            )}
          </View>
        </View>

        <View style={styles.distanceContainer}>
          <Text style={styles.distanceValue}>{distance.toFixed(1)}</Text>
          <Text style={styles.distanceUnit}>mi</Text>
        </View>
      </View>

      {/* Address Section */}
      {venue.address && (
        <View style={styles.addressSection}>
          <Text style={styles.addressIcon}>📍</Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {venue.address}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleDirectionsPress}
        >
          <Text style={styles.actionIcon}>🧭</Text>
          <Text style={styles.actionText}>Directions</Text>
        </TouchableOpacity>

        {venue.phone && (
          <>
            <View style={styles.actionDivider} />
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handlePhonePress}
            >
              <Text style={styles.actionIcon}>📞</Text>
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
          </>
        )}

        {venue.website && (
          <>
            <View style={styles.actionDivider} />
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleWebsitePress}
            >
              <Text style={styles.actionIcon}>🌐</Text>
              <Text style={styles.actionText}>Website</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Status Indicator */}
      {venue.active && (
        <View style={styles.statusBar}>
          <View style={styles.activeIndicator} />
          <Text style={styles.statusText}>Currently serving happy hour</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#FF6B35',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  selectedIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#FF6B35',
    zIndex: 1,
  },
  
  // ... rest of the styles remain the same as before
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  venueName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  verifiedIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  typeBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'capitalize',
  },
  neighborhood: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  distanceContainer: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 60,
  },
  distanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
    lineHeight: 20,
  },
  distanceUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    marginTop: 2,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  addressIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  actionBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  actionDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
});
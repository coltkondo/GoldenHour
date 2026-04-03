import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../../theme';
import { Venue } from '../../types/api';
import { AppIcon } from '../icons';
import { StatusDot } from '../ui/StatusDot';

interface VenueCardProps {
  venue: Venue;
  userLocation: {
    latitude: number;
    longitude: number;
  };
  onPress: (venue: Venue) => void;
  isSelected?: boolean;
}

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

export const VenueCard: React.FC<VenueCardProps> = ({
  venue,
  userLocation,
  onPress,
  isSelected = false,
}) => {
  const { theme } = useTheme();
  const d = theme.derived;
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    venue.latitude,
    venue.longitude,
  );

  const handlePress = () => {
    onPress(venue);
  };
  const handlePhonePress = (e: any) => {
    e.stopPropagation();
    if (venue.phone) Linking.openURL(`tel:${venue.phone}`);
  };
  const handleWebsitePress = (e: any) => {
    e.stopPropagation();
    if (venue.website) Linking.openURL(venue.website);
  };
  const handleDirectionsPress = (e: any) => {
    e.stopPropagation();
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`,
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isSelected ? d.selectedSurface : d.cardBackground,
          borderColor: isSelected ? d.selectedBorder : d.border,
        },
      ]}
      activeOpacity={0.8}
      onPress={handlePress}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.venueName, { color: isSelected ? d.primary : d.text }]}
              numberOfLines={1}
            >
              {venue.name}
            </Text>
            {venue.verified && (
              <View
                style={[
                  styles.verifiedBadge,
                  { backgroundColor: 'rgba(45,212,160,0.12)', borderColor: d.live },
                ]}
              >
                <AppIcon name="check" size={12} role="positive" />
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            {venue.venue_type && (
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: isSelected ? d.selectedBorder : d.filterInactive },
                ]}
              >
                <Text style={[styles.typeText, { color: isSelected ? d.primary : d.textMuted }]}>
                  {venue.venue_type}
                </Text>
              </View>
            )}
            {venue.neighborhood && (
              <View style={styles.neighborhoodRow}>
                <AppIcon name="location" size={12} role="muted" />
                <Text style={[styles.neighborhood, { color: d.textMuted }]}>
                  {venue.neighborhood}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View
          style={[
            styles.distanceContainer,
            { backgroundColor: isSelected ? d.selectedBorder : d.filterInactive },
          ]}
        >
          <Text style={[styles.distanceValue, { color: d.primary }]}>{distance.toFixed(1)}</Text>
          <Text style={[styles.distanceUnit, { color: d.textMuted }]}>mi</Text>
        </View>
      </View>

      {venue.address && (
        <View style={styles.addressSection}>
          <Text style={[styles.addressText, { color: d.textMuted }]} numberOfLines={1}>
            {venue.address}
          </Text>
        </View>
      )}

      <View
        style={[styles.actionBar, { borderTopColor: isSelected ? d.selectedBorder : d.border }]}
      >
        <TouchableOpacity style={styles.actionButton} onPress={handleDirectionsPress}>
          <AppIcon name="directions" size={14} role="brand" />
          <Text style={[styles.actionText, { color: d.primary }]}>Directions</Text>
        </TouchableOpacity>

        {venue.phone && (
          <>
            <View
              style={[
                styles.actionDivider,
                { backgroundColor: isSelected ? d.selectedBorder : d.border },
              ]}
            />
            <TouchableOpacity style={styles.actionButton} onPress={handlePhonePress}>
              <AppIcon name="phone" size={14} role="brand" />
              <Text style={[styles.actionText, { color: d.primary }]}>Call</Text>
            </TouchableOpacity>
          </>
        )}

        {venue.website && (
          <>
            <View
              style={[
                styles.actionDivider,
                { backgroundColor: isSelected ? d.selectedBorder : d.border },
              ]}
            />
            <TouchableOpacity style={styles.actionButton} onPress={handleWebsitePress}>
              <AppIcon name="globe" size={14} role="brand" />
              <Text style={[styles.actionText, { color: d.primary }]}>Website</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {venue.active && (
        <View
          style={[
            styles.statusBar,
            { backgroundColor: isSelected ? 'rgba(45,212,160,0.06)' : d.cardBackgroundAlt },
          ]}
        >
          <StatusDot status="live" size={8} pulse={false} />
          <Text style={[styles.statusText, { color: d.live }]}>Currently serving happy hour</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  titleContainer: { flex: 1, marginRight: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  venueName: { fontSize: 19, fontWeight: '700', letterSpacing: -0.3, flex: 1 },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    borderWidth: 1,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  neighborhoodRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  neighborhood: { fontSize: 13, fontWeight: '500' },
  distanceContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 60,
  },
  distanceValue: { fontSize: 18, fontWeight: '700', lineHeight: 20 },
  distanceUnit: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  addressText: { flex: 1, fontSize: 14, lineHeight: 18 },
  actionBar: { flexDirection: 'row', borderTopWidth: 1 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  actionText: { fontSize: 13, fontWeight: '600' },
  actionDivider: { width: 1 },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statusText: { fontSize: 13, fontWeight: '600' },
});

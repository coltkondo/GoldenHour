import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useLocation } from '../hooks/useLocation';
import { venuesAPI } from '../api/endpoints';
import { Venue } from '../types/api';
import { VenueBottomSheet } from '../components/VenueBottomSheet';
import { VenueMarker } from '../components/Map/VenueMarker';
import { GradientBackground } from '../components/common/GradientBackground';

export const MapScreen = () => {
  const mapRef = useRef<MapView>(null);
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { location, loading: locationLoading, error: locationError } = useLocation();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [visibleVenues, setVisibleVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);

  useEffect(() => {
    if (!locationLoading && !locationError) {
      loadNearbyVenues();
    }
  }, [locationLoading, locationError, location]);

  useEffect(() => {
    if (mapRegion && venues.length > 0) {
      filterVisibleVenues(mapRegion);
    }
  }, [mapRegion, venues]);

  const loadNearbyVenues = async () => {
    try {
      setLoading(true);
      const nearbyVenues = await venuesAPI.getNearby(
        location.latitude,
        location.longitude,
        10000
      );
      setVenues(nearbyVenues);
      setVisibleVenues(nearbyVenues);
    } catch (err) {
      console.error('Error loading venues:', err);
      setError('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  const filterVisibleVenues = (region: Region) => {
    const visible = venues.filter(venue => {
      const latInBounds =
        venue.latitude >= region.latitude - region.latitudeDelta / 2 &&
        venue.latitude <= region.latitude + region.latitudeDelta / 2;
      const lonInBounds =
        venue.longitude >= region.longitude - region.longitudeDelta / 2 &&
        venue.longitude <= region.longitude + region.longitudeDelta / 2;
      return latInBounds && lonInBounds;
    });
    setVisibleVenues(visible);
  };

  const handleRegionChangeComplete = (region: Region) => {
    setMapRegion(region);
  };

  const handleVenueCardPress = (venue: Venue) => {
    setSelectedVenueId(venue.id);
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: venue.latitude,
          longitude: venue.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    }
  };

  const handleMarkerPress = (venue: Venue) => {
    setSelectedVenueId(venue.id);
  };

  const handleVenueDetail = (venue: Venue) => {
    navigation.navigate('HappyHour', { venue });
  };

  const recenterMap = () => {
    if (mapRef.current && location) {
      mapRef.current.animateToRegion(
        {
          ...location,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        500
      );
    }
  };

  if (locationLoading || loading) {
    return (
      <GradientBackground>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.text} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading happy hours...
          </Text>
        </View>
      </GradientBackground>
    );
  }

  if (locationError || error) {
    return (
      <GradientBackground>
        <View style={styles.centerContainer}>
          <Text style={styles.errorEmoji}>😵</Text>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            {locationError || error}
          </Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={location}
        showsUserLocation
        showsMyLocationButton={false}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {venues.map((venue) => (
          <VenueMarker
            key={venue.id}
            venue={venue}
            isSelected={selectedVenueId === venue.id}
            onPress={handleMarkerPress}
          />
        ))}
      </MapView>

      {/* Top overlay - venue count pill */}
      <View style={styles.topOverlay}>
        <View style={[styles.venueCount, { backgroundColor: theme.colors.tabBar }]}>
          <Text style={styles.fireEmoji}>🔥</Text>
          <Text style={[styles.venueCountText, { color: theme.colors.text }]}>
            {visibleVenues.length} Happy Hours
          </Text>
        </View>
      </View>

      {/* Recenter button */}
      <TouchableOpacity
        style={[styles.recenterButton, { backgroundColor: theme.colors.tabBar }]}
        onPress={recenterMap}
        activeOpacity={0.8}
      >
        <Ionicons name="locate" size={22} color={theme.colors.primary} />
      </TouchableOpacity>

      {/* Bottom Sheet */}
      {location && (
        <VenueBottomSheet
          venues={visibleVenues}
          allVenues={venues}
          userLocation={location}
          selectedVenueId={selectedVenueId}
          onVenuePress={handleVenueCardPress}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  topOverlay: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
  },
  venueCount: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  fireEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  venueCountText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  recenterButton: {
    position: 'absolute',
    top: 110,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
});

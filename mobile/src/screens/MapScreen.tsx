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

// Dark map style for Google Maps
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1A1A1A' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0F0F14' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#A0A3AD' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#5A5D66' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2C2C2C' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3A3A3A' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#5A5D66' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

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
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>
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
          <Text style={styles.errorText}>
            {locationError || error}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadNearbyVenues}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
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
        customMapStyle={DARK_MAP_STYLE}
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

      {/* Top overlay - simplified venue count */}
      <View style={styles.topOverlay}>
        <View style={styles.venueCount}>
          <Text style={styles.venueCountNumber}>{visibleVenues.length}</Text>
          <Text style={styles.venueCountLabel}>LIVE</Text>
        </View>
      </View>

      {/* Recenter button - gold accent */}
      <TouchableOpacity
        style={styles.recenterButton}
        onPress={recenterMap}
        activeOpacity={0.8}
      >
        <Ionicons name="locate" size={24} color="#0F0F14" />
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
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#A0A3AD',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    color: '#F5F7FA',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F0F14',
  },
  topOverlay: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
  },
  venueCount: {
    backgroundColor: '#0F0F14',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  venueCountNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: -0.5,
  },
  venueCountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A0A3AD',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  recenterButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
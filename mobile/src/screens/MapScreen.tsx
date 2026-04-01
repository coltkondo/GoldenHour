import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Platform } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { useTheme, ThemeMode } from '../theme';
import { useLocation } from '../hooks/useLocation';
import { venuesAPI } from '../api/endpoints';
import { Venue } from '../types/api';
import { VenueBottomSheet } from '../components/VenueBottomSheet';
import { VenueMarker } from '../components/Map/VenueMarker';
import { AppIcon } from '../components/icons';

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d0d0d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#555555' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#555555' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#161616' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#555555' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#222222' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2e2e2e' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a1a' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#555555' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#555555' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f0f0f' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#444444' }] },
];

const lightMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f5f3ef' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#faf9f6' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#e5e2dc' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#9b978e' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#f0ede6' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#9b978e' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e8e5df' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#7a7770' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#f7f5f0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f0ede6' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e5e2dc' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9b978e' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#f0ede6' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#9b978e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#d4e8f0' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#7a9aae' }] },
];

export const MapScreen = () => {
  const mapRef = useRef<MapView>(null);
  const { theme, mode } = useTheme();
  const d = theme.derived;
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
      const nearbyVenues = await venuesAPI.getNearby(location.latitude, location.longitude, 10000);
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
      const latInBounds = venue.latitude >= region.latitude - region.latitudeDelta / 2 && venue.latitude <= region.latitude + region.latitudeDelta / 2;
      const lonInBounds = venue.longitude >= region.longitude - region.longitudeDelta / 2 && venue.longitude <= region.longitude + region.longitudeDelta / 2;
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
      mapRef.current.animateToRegion({
        latitude: venue.latitude,
        longitude: venue.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  const handleMarkerPress = (venue: Venue) => {
    setSelectedVenueId(venue.id);
  };

  const recenterMap = () => {
    if (mapRef.current && location) {
      mapRef.current.animateToRegion({ ...location, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 500);
    }
  };

  if (locationLoading || loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: d.background }]}>
        <View style={[styles.loadingSpinner, { backgroundColor: d.filterInactive }]}>
          <ActivityIndicator size="large" color={d.primary} />
        </View>
        <Text style={[styles.loadingText, { color: d.text }]}>Finding happy hours nearby</Text>
      </View>
    );
  }

  if (locationError || error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: d.background }]}>
        <Text style={[styles.errorText, { color: d.text }]}>{locationError || error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: d.background }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={location}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsTraffic={false}
        showsBuildings={false}
        showsIndoors={false}
        onRegionChangeComplete={handleRegionChangeComplete}
        customMapStyle={mode === 'dark' ? darkMapStyle : undefined}
        mapType="standard"
      >
        {venues.map((venue) => (
          <VenueMarker key={venue.id} venue={venue} isSelected={selectedVenueId === venue.id} onPress={handleMarkerPress} themeColors={d} />
        ))}
      </MapView>

      <View style={styles.topOverlay}>
        <View style={[styles.venueCountChip, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
          <AppIcon name="location" size={12} role="brand" />
          <Text style={[styles.venueCountText, { color: d.text }]}>
            {visibleVenues.length} happy hours nearby
          </Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.recenterButton, { backgroundColor: d.cardBackground, borderColor: d.border }]} onPress={recenterMap} activeOpacity={0.8}>
        <AppIcon name="crosshair" size={18} role="brand" />
      </TouchableOpacity>

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
  container: { flex: 1 },
  map: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingSpinner: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  loadingText: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  errorText: { fontSize: 16, textAlign: 'center', fontWeight: '600' },
  topOverlay: { position: 'absolute', top: Platform.OS === 'ios' ? 64 : 56, alignSelf: 'center', zIndex: 10 },
  venueCountChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16, borderWidth: 1 },
  venueCountText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.1 },
  recenterButton: { position: 'absolute', top: Platform.OS === 'ios' ? 114 : 106, right: 16, width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, zIndex: 10 },
});

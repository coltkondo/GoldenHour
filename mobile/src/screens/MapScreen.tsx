import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useLocation } from '../hooks/useLocation';
import { venuesAPI } from '../api/endpoints';
import { Venue } from '../types/api';
import { VenueBottomSheet } from '../components/VenueBottomSheet';

export const MapScreen = () => {
  const mapRef = useRef<MapView>(null);
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
    // Filter venues based on current map region
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
      setVisibleVenues(nearbyVenues); // Initially all venues are visible
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
    
    // Animate map to focus on the selected venue
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: venue.latitude,
          longitude: venue.longitude,
          latitudeDelta: 0.01, // Zoom in closer
          longitudeDelta: 0.01,
        },
        500 // Animation duration in ms
      );
    }
  };

  const handleMarkerPress = (venue: Venue) => {
    setSelectedVenueId(venue.id);
    // The bottom sheet will scroll to this venue
  };

  if (locationLoading || loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading happy hours...</Text>
      </View>
    );
  }

  if (locationError || error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{locationError || error}</Text>
      </View>
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
        showsMyLocationButton
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {venues.map((venue) => (
          <Marker
            key={venue.id}
            coordinate={{
              latitude: venue.latitude,
              longitude: venue.longitude,
            }}
            title={venue.name}
            description={venue.neighborhood || ''}
            pinColor={selectedVenueId === venue.id ? '#FF6B35' : '#FF6B35'}
            onPress={() => handleMarkerPress(venue)}
          />
        ))}
      </MapView>
      
      <View style={styles.venueCount}>
        <Text style={styles.venueCountText}>
          {visibleVenues.length} of {venues.length} happy hours visible
        </Text>
      </View>

      {/* Bottom Sheet with Venue List */}
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  venueCount: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  venueCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
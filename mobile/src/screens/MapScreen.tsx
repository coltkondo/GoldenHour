import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocation } from '../hooks/useLocation';
import { venuesAPI } from '../api/endpoints';
import { Venue } from '../types/api';

export const MapScreen = () => {
  const { location, loading: locationLoading, error: locationError } = useLocation();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationLoading && !locationError) {
      loadNearbyVenues();
    }
  }, [locationLoading, locationError, location]);

  const loadNearbyVenues = async () => {
    try {
      setLoading(true);
      const nearbyVenues = await venuesAPI.getNearby(
        location.latitude,
        location.longitude,
        10000
      );
      setVenues(nearbyVenues);
    } catch (err) {
      console.error('Error loading venues:', err);
      setError('Failed to load venues');
    } finally {
      setLoading(false);
    }
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
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={location}
        showsUserLocation
        showsMyLocationButton
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
            pinColor="#FF6B35"
          />
        ))}
      </MapView>
      
      <View style={styles.venueCount}>
        <Text style={styles.venueCountText}>
          {venues.length} happy hours nearby
        </Text>
      </View>
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
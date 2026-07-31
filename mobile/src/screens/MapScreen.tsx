import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useLocation } from '../hooks/useLocation';
import { useLiveVenueStatus } from '../hooks/useLiveVenueStatus';
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

const VIEWPORT_PADDING = 0.5;
const REGION_DEBOUNCE_MS = 200;
const PIN_IMAGE_HEIGHT = 25;
const LABEL_GAP = 3;
const LABEL_DEFAULT_WIDTH = 120;
const LABEL_DEFAULT_HEIGHT = 26;

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
  const hasAnimatedToUser = useRef(false);
  const isMounted = useRef(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [labelPoint, setLabelPoint] = useState<{ x: number; y: number } | null>(null);
  const [labelSize, setLabelSize] = useState<{ width: number; height: number } | null>(null);
  const selectedVenueRef = useRef<Venue | null>(null);
  const labelRequestId = useRef(0);
  const lastLabelUpdate = useRef(0);
  const lastLabelVenueId = useRef<string | null>(null);

  const liveVenueIds = useLiveVenueStatus(visibleVenues);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!locationLoading && !locationError) {
      loadAllVenues();
    }
  }, [locationLoading, locationError]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mapRegion && venues.length > 0) {
      filterVisibleVenues(mapRegion);
    }
  }, [mapRegion, venues]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!location || locationLoading || !mapRef.current) return;
    if (hasAnimatedToUser.current) return;
    const isDefault =
      Math.abs(location.latitude - 40.7934) < 0.001 &&
      Math.abs(location.longitude - -77.86) < 0.001;
    if (isDefault) return;
    hasAnimatedToUser.current = true;
    mapRef.current.animateToRegion(
      { ...location, latitudeDelta: 0.03, longitudeDelta: 0.03 },
      800,
    );
  }, [location, locationLoading]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const loadAllVenues = async () => {
    try {
      setLoading(true);
      const allVenues = await venuesAPI.getAll({ limit: 500 });
      if (!isMounted.current) return;
      const withCoords = allVenues.filter((v) => v.latitude != null && v.longitude != null);
      setVenues(withCoords);
      setVisibleVenues(withCoords);
    } catch (err) {
      if (!isMounted.current) return;
      setError('Failed to load venues');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const filterVisibleVenues = (region: Region) => {
    const latHalf = (region.latitudeDelta / 2) * (1 + VIEWPORT_PADDING);
    const lonHalf = (region.longitudeDelta / 2) * (1 + VIEWPORT_PADDING);
    const visible = venues.filter((venue) => {
      const latInBounds =
        venue.latitude >= region.latitude - latHalf &&
        venue.latitude <= region.latitude + latHalf;
      const lonInBounds =
        venue.longitude >= region.longitude - lonHalf &&
        venue.longitude <= region.longitude + lonHalf;
      return latInBounds && lonInBounds;
    });
    setVisibleVenues(visible);
  };

  const handleRegionChangeComplete = useCallback((region: Region) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setMapRegion(region), REGION_DEBOUNCE_MS);
  }, []);

  const handleViewDetails = (venue: Venue) => {
    navigation.navigate('HappyHour', { venue });
  };

  const focusOnVenue = (venue: Venue, zoomTo: number | null) => {
    if (!mapRef.current) return;
    const latitudeDelta = zoomTo ?? mapRegion?.latitudeDelta ?? 0.01;
    const longitudeDelta = zoomTo ?? mapRegion?.longitudeDelta ?? 0.01;
    const sheetHeightRatio = 0.5;
    const latitude = venue.latitude - latitudeDelta * sheetHeightRatio * 0.5;
    mapRef.current.animateToRegion(
      { latitude, longitude: venue.longitude, latitudeDelta, longitudeDelta },
      500,
    );
  };

  const handleVenueCardPress = (venue: Venue) => {
    setSelectedVenueId(venue.id);
    focusOnVenue(venue, 0.01);
  };

  const handleMarkerPress = useCallback(
    (venue: Venue) => {
      setSelectedVenueId(venue.id);
      focusOnVenue(venue, null);
    },
    [mapRegion],
  );

  const selectedVenue = selectedVenueId
    ? venues.find((v) => v.id === selectedVenueId) ?? null
    : null;

  selectedVenueRef.current = selectedVenue;

  const updateLabelPoint = useCallback(() => {
    const venue = selectedVenueRef.current;
    if (!venue || !mapRef.current) {
      setLabelPoint(null);
      return;
    }
    const now = Date.now();
    const venueChanged = venue.id !== lastLabelVenueId.current;
    if (!venueChanged && now - lastLabelUpdate.current < 33) return;
    lastLabelVenueId.current = venue.id;
    lastLabelUpdate.current = now;
    const requestId = ++labelRequestId.current;
    mapRef.current
      .pointForCoordinate({
        latitude: venue.latitude,
        longitude: venue.longitude,
      })
      .then((point) => {
        if (requestId !== labelRequestId.current) return;
        const { width, height } = Dimensions.get('window');
        const inView =
          point.x >= -40 && point.x <= width + 40 && point.y >= -40 && point.y <= height + 40;
        setLabelPoint(inView ? { x: point.x, y: point.y } : null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    updateLabelPoint();
  }, [selectedVenue, selectedVenueId, mapRegion, updateLabelPoint]);

  const recenterMap = () => {
    if (mapRef.current && location) {
      mapRef.current.animateToRegion(
        { ...location, latitudeDelta: 0.05, longitudeDelta: 0.05 },
        500,
      );
    }
  };

  const zoomIn = () => {
    if (mapRef.current && mapRegion) {
      mapRef.current.animateToRegion(
        { ...mapRegion, latitudeDelta: mapRegion.latitudeDelta / 2, longitudeDelta: mapRegion.longitudeDelta / 2 },
        300,
      );
    }
  };

  const zoomOut = () => {
    if (mapRef.current && mapRegion) {
      mapRef.current.animateToRegion(
        {
          ...mapRegion,
          latitudeDelta: Math.min(mapRegion.latitudeDelta * 2, 180),
          longitudeDelta: Math.min(mapRegion.longitudeDelta * 2, 360),
        },
        300,
      );
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
        onRegionChange={updateLabelPoint}
        onMapReady={() => {
          if (location && !mapRegion) {
            setMapRegion(location);
          }
        }}
        customMapStyle={mode === 'dark' ? darkMapStyle : undefined}
        mapType="standard"
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

      {selectedVenue && labelPoint && (
        <View
          pointerEvents="none"
          onLayout={(e) =>
            setLabelSize({
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            })
          }
          style={[
            styles.markerLabel,
            {
              top: labelPoint.y - PIN_IMAGE_HEIGHT - LABEL_GAP - (labelSize?.height ?? LABEL_DEFAULT_HEIGHT),
              left: labelPoint.x - (labelSize?.width ?? LABEL_DEFAULT_WIDTH) / 2,
              backgroundColor: d.cardBackground,
              borderColor: d.border,
            },
          ]}
        >
          <Text numberOfLines={1} style={[styles.markerLabelText, { color: d.text }]}>
            {selectedVenue.name}
          </Text>
        </View>
      )}

      <View style={styles.topOverlay}>
        <View style={[styles.venueCountChip, { backgroundColor: d.cardBackground, borderColor: d.border }]}>
          <AppIcon name="location" size={12} role="brand" />
          <Text style={[styles.venueCountText, { color: d.text }]}>
            {visibleVenues.length} {visibleVenues.length === 1 ? 'venue' : 'venues'} in view
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.recenterButton, { backgroundColor: d.cardBackground, borderColor: d.border }]}
        onPress={recenterMap}
        activeOpacity={0.8}
      >
        <AppIcon name="crosshair" size={18} role="brand" />
      </TouchableOpacity>

      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={[styles.zoomButton, styles.zoomButtonTop, { backgroundColor: d.cardBackground, borderColor: d.border }]}
          onPress={zoomIn}
          activeOpacity={0.8}
        >
          <AppIcon name="plus" size={18} role="default" />
        </TouchableOpacity>
        <View style={[styles.zoomDivider, { backgroundColor: d.border }]} />
        <TouchableOpacity
          style={[styles.zoomButton, styles.zoomButtonBottom, { backgroundColor: d.cardBackground, borderColor: d.border }]}
          onPress={zoomOut}
          activeOpacity={0.8}
        >
          <AppIcon name="minus" size={18} role="default" />
        </TouchableOpacity>
      </View>

      {location && (
        <VenueBottomSheet
          venues={visibleVenues}
          allVenues={venues}
          userLocation={location}
          selectedVenueId={selectedVenueId}
          onVenuePress={handleVenueCardPress}
          onViewDetails={handleViewDetails}
          liveVenueIds={liveVenueIds}
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
  zoomControls: { position: 'absolute', top: Platform.OS === 'ios' ? 166 : 158, right: 16, width: 40, borderRadius: 12, borderWidth: 1, overflow: 'hidden', zIndex: 10, borderColor: 'transparent' },
  zoomButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  zoomButtonTop: { borderBottomWidth: 0, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  zoomButtonBottom: { borderTopWidth: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  zoomDivider: { height: 1 },
  markerLabel: {
    position: 'absolute',
    maxWidth: 200,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    zIndex: 20,
  },
  markerLabelText: { fontSize: 13, fontWeight: '700', letterSpacing: -0.2 },
});

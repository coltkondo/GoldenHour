import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { useTheme } from '../../theme';
import { Venue } from '../../types/api';

interface MiniMapProps {
  userLocation: { latitude: number; longitude: number };
  venues: Venue[];
  onPress: () => void;
}

export const MiniMap: React.FC<MiniMapProps> = ({ userLocation, venues, onPress }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.container, { borderColor: theme.colors.border }]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <MapView
        style={styles.map}
        region={{
          ...userLocation,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation
        showsCompass={false}
        showsScale={false}
        showsMyLocationButton={false}
        pointerEvents="none"
        mapType="standard"
      >
        {/* Radius circle */}
        <Circle
          center={userLocation}
          radius={1500}
          fillColor="rgba(255, 107, 53, 0.08)"
          strokeColor="rgba(255, 107, 53, 0.3)"
          strokeWidth={1}
        />
        {/* Venue dots */}
        {venues.slice(0, 20).map((venue) => (
          <Marker
            key={venue.id}
            coordinate={{
              latitude: venue.latitude,
              longitude: venue.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.miniDot} />
          </Marker>
        ))}
      </MapView>

      {/* Overlay with crosshair */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.ringOuter} />
        <View style={styles.crosshairH} />
        <View style={styles.crosshairV} />
      </View>

      {/* Venue count badge */}
      <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.badgeText}>{venues.length}</Text>
      </View>

      {/* MAP label */}
      <View style={[styles.expandLabel, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.expandText}>MAP</Text>
      </View>
    </TouchableOpacity>
  );
};

const MAP_SIZE = 110;

const styles = StyleSheet.create({
  container: {
    width: MAP_SIZE,
    height: MAP_SIZE,
    borderRadius: MAP_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  map: {
    width: MAP_SIZE,
    height: MAP_SIZE,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringOuter: {
    width: MAP_SIZE - 6,
    height: MAP_SIZE - 6,
    borderRadius: (MAP_SIZE - 6) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.4)',
  },
  crosshairH: {
    position: 'absolute',
    width: 16,
    height: 1,
    backgroundColor: 'rgba(255, 107, 53, 0.5)',
  },
  crosshairV: {
    position: 'absolute',
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 107, 53, 0.5)',
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B35',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  expandLabel: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  expandText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});

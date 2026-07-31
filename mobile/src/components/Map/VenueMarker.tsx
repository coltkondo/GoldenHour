import React from 'react';
import { Marker } from 'react-native-maps';
import { Venue } from '../../types/api';
import { pinAssets, getVenueCategory } from './pinAssets';

interface VenueMarkerProps {
  venue: Venue;
  isSelected: boolean;
  onPress: (venue: Venue) => void;
}

export const VenueMarker: React.FC<VenueMarkerProps> = React.memo(
  ({ venue, isSelected, onPress }) => {
    const category = getVenueCategory(venue.venue_type);

    return (
      <Marker
        coordinate={{ latitude: venue.latitude, longitude: venue.longitude }}
        image={pinAssets[category][isSelected ? 'selected' : 'default']}
        onPress={() => onPress(venue)}
        anchor={{ x: 0.5, y: 1 }}
      />
    );
  },
  (prev, next) =>
    prev.venue.id === next.venue.id && prev.isSelected === next.isSelected,
);

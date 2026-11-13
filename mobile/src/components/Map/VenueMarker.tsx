import React from 'react';
import { Marker } from 'react-native-maps';
import { Venue } from '../../types/api';
import { VenueDealStatus } from '../../utils/scheduleUtils';
import { pinAssets, pinGeometry, pinZIndex, SELECTED_PIN_Z_INDEX } from './pinAssets';

interface VenueMarkerProps {
  venue: Venue;
  status: VenueDealStatus;
  isSelected: boolean;
  onPress: (venue: Venue) => void;
}

export const VenueMarker: React.FC<VenueMarkerProps> = React.memo(
  ({ venue, status, isSelected, onPress }) => {
    const state = isSelected ? 'selected' : 'default';
    return (
      <Marker
        coordinate={{ latitude: venue.latitude, longitude: venue.longitude }}
        image={pinAssets[status][state]}
        anchor={pinGeometry[status][state].anchor}
        zIndex={isSelected ? SELECTED_PIN_Z_INDEX : pinZIndex[status]}
        onPress={() => onPress(venue)}
      />
    );
  },
  (prev, next) =>
    prev.venue.id === next.venue.id &&
    prev.status === next.status &&
    prev.isSelected === next.isSelected,
);

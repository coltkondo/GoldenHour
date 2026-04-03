import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Venue } from '../../types/api';

interface VenueMarkerProps {
  venue: Venue;
  isSelected: boolean;
  onPress: (venue: Venue) => void;
  themeColors: import('../../theme').DerivedColors;
}

const BarIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 11h2a3 3 0 010 6h-2"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 8h10v11a2 2 0 01-2 2H9a2 2 0 01-2-2V8z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 8V6a1 1 0 011-1h4a1 1 0 011 1v2"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const FoodIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M6 1v3M10 1v3M14 1v3" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const MusicIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18V5l12-2v13"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={6} cy={18} r={3} stroke={color} strokeWidth={1.5} />
    <Circle cx={18} cy={16} r={3} stroke={color} strokeWidth={1.5} />
  </Svg>
);

const WineIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8 3h8M6 3h12a2 2 0 012 2v4c0 3-2 5-4 7v4a2 2 0 01-2 2h0a2 2 0 01-2-2v-4c-2-2-4-4-4-7V5a2 2 0 012-2z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CocktailIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8 3l8 8-4 9-4-9L8 3z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M5 21h14" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const SportIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.5} />
    <Path d="M12 3v18M3 12h18" stroke={color} strokeWidth={1.2} />
    <Path d="M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" stroke={color} strokeWidth={1} />
  </Svg>
);

const DefaultIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={9} r={2.5} stroke={color} strokeWidth={1.5} />
  </Svg>
);

function getVenueIcon(type: string | null, color: string) {
  if (!type) return <DefaultIcon color={color} />;
  const lower = type.toLowerCase();
  if (lower.includes('bar') || lower.includes('brewery') || lower.includes('pub'))
    return <BarIcon color={color} />;
  if (
    lower.includes('restaurant') ||
    lower.includes('mexican') ||
    lower.includes('italian') ||
    lower.includes('asian') ||
    lower.includes('american')
  )
    return <FoodIcon color={color} />;
  if (lower.includes('club') || lower.includes('music')) return <MusicIcon color={color} />;
  if (lower.includes('wine')) return <WineIcon color={color} />;
  if (lower.includes('lounge') || lower.includes('cocktail')) return <CocktailIcon color={color} />;
  if (lower.includes('sport')) return <SportIcon color={color} />;
  return <DefaultIcon color={color} />;
}

export const VenueMarker: React.FC<VenueMarkerProps> = ({
  venue,
  isSelected,
  onPress,
  themeColors: tc,
}) => {
  const iconColor = isSelected ? tc.buttonPrimaryText : tc.primary;

  return (
    <Marker
      coordinate={{
        latitude: venue.latitude,
        longitude: venue.longitude,
      }}
      onPress={() => onPress(venue)}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={[styles.markerContainer, isSelected && styles.markerSelected]}>
        <View
          style={[
            styles.markerBubble,
            {
              backgroundColor: isSelected ? tc.primary : tc.cardBackground,
              borderColor: isSelected ? tc.primary : tc.border,
            },
          ]}
        >
          {getVenueIcon(venue.venue_type, iconColor)}
          {isSelected && (
            <Text style={[styles.markerName, { color: tc.buttonPrimaryText }]} numberOfLines={1}>
              {venue.name}
            </Text>
          )}
        </View>
        <View
          style={[
            styles.markerArrow,
            { borderTopColor: isSelected ? tc.primary : tc.cardBackground },
          ]}
        />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  markerSelected: {
    zIndex: 999,
  },
  markerBubble: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    gap: 4,
  },
  markerName: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 2,
    maxWidth: 100,
    letterSpacing: -0.2,
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});

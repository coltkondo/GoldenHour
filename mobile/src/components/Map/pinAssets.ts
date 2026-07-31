export const pinAssets = {
  bar: {
    default: require('../assets/pins/pin-bar-default.png'),
    selected: require('../assets/pins/pin-bar-selected.png'),
  },
  food: {
    default: require('../assets/pins/pin-food-default.png'),
    selected: require('../assets/pins/pin-food-selected.png'),
  },
  music: {
    default: require('../assets/pins/pin-music-default.png'),
    selected: require('../assets/pins/pin-music-selected.png'),
  },
  wine: {
    default: require('../assets/pins/pin-wine-default.png'),
    selected: require('../assets/pins/pin-wine-selected.png'),
  },
  cocktail: {
    default: require('../assets/pins/pin-cocktail-default.png'),
    selected: require('../assets/pins/pin-cocktail-selected.png'),
  },
  sport: {
    default: require('../assets/pins/pin-sport-default.png'),
    selected: require('../assets/pins/pin-sport-selected.png'),
  },
  default: {
    default: require('../assets/pins/pin-default-default.png'),
    selected: require('../assets/pins/pin-default-selected.png'),
  },
} as const;

export type PinCategory = keyof typeof pinAssets;

export function getVenueCategory(type: string | null): PinCategory {
  if (!type) return 'default';
  const lower = type.toLowerCase();
  if (lower.includes('bar') || lower.includes('brewery') || lower.includes('pub')) return 'bar';
  if (
    lower.includes('restaurant') ||
    lower.includes('mexican') ||
    lower.includes('italian') ||
    lower.includes('asian') ||
    lower.includes('american')
  )
    return 'food';
  if (lower.includes('club') || lower.includes('music')) return 'music';
  if (lower.includes('wine')) return 'wine';
  if (lower.includes('lounge') || lower.includes('cocktail')) return 'cocktail';
  if (lower.includes('sport')) return 'sport';
  return 'default';
}

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { useTheme } from '../theme';
import { AppIcon } from './icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const MARKETS = [
  {
    slug: 'arlington',
    label: 'Arlington, VA',
    sub: 'Clarendon · Ballston · Crystal City',
    lat: 38.8816,
    lng: -77.091,
  },
  {
    slug: 'state-college',
    label: 'Happy Valley, PA',
    sub: 'Downtown · College Ave · Beaver Ave',
    lat: 40.7934,
    lng: -77.86,
  },
] as const;

export type MarketSlug = typeof MARKETS[number]['slug'];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestMarket(lat: number, lng: number): MarketSlug {
  let best = MARKETS[0];
  let bestDist = Infinity;
  for (const m of MARKETS) {
    const d = haversineKm(lat, lng, m.lat, m.lng);
    if (d < bestDist) { bestDist = d; best = m; }
  }
  return best.slug;
}

interface MarketPickerProps {
  visible: boolean;
  onSelect: (slug: string) => void;
  onDismiss?: () => void;
  currentSlug?: string | null;
}

export const GuestMarketPicker: React.FC<MarketPickerProps> = ({
  visible,
  onSelect,
  onDismiss,
  currentSlug,
}) => {
  const { theme } = useTheme();
  const d = theme.derived;
  const translateY = useRef(new Animated.Value(500)).current;
  const [locLoading, setLocLoading] = useState(false);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : 500,
      tension: 70,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const handleUseLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const slug = nearestMarket(pos.coords.latitude, pos.coords.longitude);
      onSelect(slug);
    } catch {
      // fall through — let them pick manually
    } finally {
      setLocLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <Animated.View
          style={[styles.sheet, { backgroundColor: d.cardBackground, transform: [{ translateY }] }]}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[styles.handle, { backgroundColor: d.border }]} />

            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: d.text }]}>Choose a city</Text>
              {onDismiss && (
                <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <AppIcon name="close" size={18} role="muted" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.sub, { color: d.textMuted }]}>
              Browse happy hours and events in any market.
            </Text>

            <View style={styles.options}>
              {/* Current Location */}
              <TouchableOpacity
                style={[styles.option, { backgroundColor: d.filterInactive, borderColor: d.border }]}
                activeOpacity={0.75}
                onPress={handleUseLocation}
                disabled={locLoading}
              >
                {locLoading
                  ? <ActivityIndicator size="small" color={d.primary} />
                  : <AppIcon name="location" size={18} role="brand" />}
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, { color: d.primary }]}>
                    {locLoading ? 'Detecting location...' : 'Use Current Location'}
                  </Text>
                  <Text style={[styles.optionSub, { color: d.textMuted }]}>
                    Find the nearest market automatically
                  </Text>
                </View>
                {!locLoading && <AppIcon name="chevronRight" size={16} role="muted" />}
              </TouchableOpacity>

              {/* Market list */}
              {MARKETS.map((market) => {
                const active = currentSlug === market.slug;
                return (
                  <TouchableOpacity
                    key={market.slug}
                    style={[
                      styles.option,
                      {
                        backgroundColor: active ? 'rgba(245,166,35,0.10)' : d.filterInactive,
                        borderColor: active ? d.primary : d.border,
                        borderWidth: active ? 1.5 : 1,
                      },
                    ]}
                    activeOpacity={0.75}
                    onPress={() => onSelect(market.slug)}
                  >
                    <AppIcon name="location" size={18} role={active ? 'brand' : 'muted'} />
                    <View style={styles.optionText}>
                      <Text style={[styles.optionLabel, { color: active ? d.primary : d.text }]}>
                        {market.label}
                      </Text>
                      <Text style={[styles.optionSub, { color: d.textMuted }]}>{market.sub}</Text>
                    </View>
                    {active
                      ? <AppIcon name="correct" size={16} role="brand" />
                      : <AppIcon name="chevronRight" size={16} role="muted" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  sub: { fontSize: 13, fontWeight: '500', marginBottom: 20 },
  options: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  optionSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
});

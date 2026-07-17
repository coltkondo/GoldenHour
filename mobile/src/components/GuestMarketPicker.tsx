import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '../theme';
import { AppIcon } from './icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 300;

const MARKETS = [
  { slug: 'arlington', label: 'Arlington, VA', sub: 'Clarendon · Ballston · Crystal City' },
  { slug: 'state-college', label: 'Happy Valley, PA', sub: 'Downtown · College Ave · Beaver Ave' },
] as const;

interface GuestMarketPickerProps {
  visible: boolean;
  onSelect: (slug: string) => void;
}

export const GuestMarketPicker: React.FC<GuestMarketPickerProps> = ({ visible, onSelect }) => {
  const { theme } = useTheme();
  const d = theme.derived;
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : SHEET_HEIGHT,
      tension: 70,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: d.cardBackground, transform: [{ translateY }] },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: d.border }]} />

          <Text style={[styles.title, { color: d.text }]}>Which city are you in?</Text>
          <Text style={[styles.sub, { color: d.textMuted }]}>
            We'll show you deals in your city.
          </Text>

          <View style={styles.options}>
            {MARKETS.map((market) => (
              <TouchableOpacity
                key={market.slug}
                style={[styles.option, { backgroundColor: d.filterInactive, borderColor: d.border }]}
                activeOpacity={0.75}
                onPress={() => onSelect(market.slug)}
              >
                <AppIcon name="location" size={18} role="brand" />
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, { color: d.text }]}>{market.label}</Text>
                  <Text style={[styles.optionSub, { color: d.textMuted }]}>{market.sub}</Text>
                </View>
                <AppIcon name="chevronRight" size={16} role="muted" />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
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
    minHeight: SHEET_HEIGHT,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3, marginBottom: 4 },
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

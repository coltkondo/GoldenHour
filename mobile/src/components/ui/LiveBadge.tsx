import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../theme';

interface LiveBadgeProps {
  label?: string;
  size?: 'sm' | 'md';
}

export const LiveBadge: React.FC<LiveBadgeProps> = ({ label = 'LIVE', size = 'sm' }) => {
  const { theme } = useTheme();
  const d = theme.derived;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.4, duration: 600, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const dotSize = size === 'sm' ? 5 : 7;
  const paddingV = size === 'sm' ? 5 : 7;
  const paddingH = size === 'sm' ? 10 : 14;
  const fontSize = size === 'sm' ? 10 : 12;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: 'rgba(45,212,160,0.12)',
          borderColor: d.live,
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
        },
      ]}
    >
      <View style={styles.dotWrapper}>
        <Animated.View style={[styles.dot, { backgroundColor: d.live, transform: [{ scale }] }]} />
      </View>
      <Text style={[styles.label, { color: d.live, fontSize, letterSpacing: 0.8 }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, gap: 6, borderWidth: 1 },
  dotWrapper: { width: 12, height: 12, justifyContent: 'center', alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  label: { fontWeight: '700', textTransform: 'uppercase' },
});

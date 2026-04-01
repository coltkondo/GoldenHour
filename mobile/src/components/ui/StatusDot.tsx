import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../theme';

interface StatusDotProps {
  status: 'live' | 'expiring' | 'inactive';
  size?: number;
  pulse?: boolean;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, size = 8, pulse = true }) => {
  const { theme } = useTheme();
  const d = theme.derived;
  const scale = useRef(new Animated.Value(1)).current;

  const statusColors: Record<string, string> = {
    live: d.live,
    expiring: d.error,
    inactive: d.textHint,
  };

  useEffect(() => {
    if (!pulse || status !== 'live') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.4, duration: 600, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse, status]);

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: statusColors[status],
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  dot: {},
});

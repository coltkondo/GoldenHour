import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Animated } from 'react-native';
import { useTheme } from '../../theme';
import { AppIcon } from '../../components/icons';

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No happy hours match your filters.',
}) => {
  const { theme } = useTheme();
  const d = theme.derived;
  const pulse = new Animated.Value(0.6);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: pulse }}>
        <AppIcon name="calendarBlank" size={56} role="muted" />
      </Animated.View>
      <Text style={[styles.message, { color: d.textSecondary }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

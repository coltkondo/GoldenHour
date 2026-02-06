import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  colors?: string[];
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  style,
  colors,
}) => {
  const { theme } = useTheme();
  const gradientColors = colors || theme.colors.backgroundGradient;

  return (
    <LinearGradient
      colors={gradientColors as [string, string, ...string[]]}
      style={[styles.container, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

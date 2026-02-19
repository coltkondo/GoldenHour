import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LoadingScreenProps {
  onFinish: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinish }) => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // RULEBOOK: Simplified animation sequence
    Animated.sequence([
      // Logo appears
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Glow pulse
      Animated.timing(glowOpacity, {
        toValue: 0.4,
        duration: 300,
        useNativeDriver: true,
      }),
      // Tagline fades in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Brief pause
      Animated.delay(600),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* RULEBOOK: Dark background, no complex gradients */}
      
      {/* Subtle gold glow */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Text style={styles.logoText}>GOLDEN</Text>
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          style={styles.logoAccent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.logoTextAccent}>HOUR</Text>
        </LinearGradient>
      </Animated.View>

      {/* Tagline */}
      <Animated.View
        style={[
          styles.taglineContainer,
          { opacity: taglineOpacity },
        ]}
      >
        <Text style={styles.tagline}>DC's Best Happy Hours</Text>
        <View style={styles.divider} />
        <Text style={styles.taglineSub}>RIGHT NOW · RIGHT HERE</Text>
      </Animated.View>

      {/* Simple pulse indicator */}
      <PulseDot />
    </View>
  );
};

const PulseDot: React.FC = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={styles.pulseContainer}>
      <Animated.View style={[styles.pulseDot, { opacity }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F14', // RULEBOOK: Dark background always
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Subtle gold glow
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 60,
    elevation: 10,
  },
  
  // Logo - Clean typography, gold accent
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#F5F7FA', // Off-white
    letterSpacing: 6,
    lineHeight: 52,
  },
  logoAccent: {
    paddingHorizontal: 4,
    borderRadius: 4,
    marginTop: -2,
  },
  logoTextAccent: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0F0F14', // Dark text on gold
    letterSpacing: 8,
    lineHeight: 52,
  },
  
  // Tagline
  taglineContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F5F7FA',
    letterSpacing: 1.5,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: '#FFD700',
    marginVertical: 12,
    borderRadius: 1,
  },
  taglineSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A0A3AD',
    letterSpacing: 2,
  },
  
  // Simple pulse indicator
  pulseContainer: {
    position: 'absolute',
    bottom: 80,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700',
  },
});
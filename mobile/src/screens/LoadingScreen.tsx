import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  onFinish: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinish }) => {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(20)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const shimmerTranslate = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    // Orchestrated animation sequence
    Animated.sequence([
      // Phase 1: Logo fades in and scales up with a bounce
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Glow effect pulses
      Animated.timing(glowOpacity, {
        toValue: 0.6,
        duration: 400,
        useNativeDriver: true,
      }),
      // Phase 3: Tagline slides up
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(taglineTranslateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
      // Phase 4: Shimmer across logo
      Animated.timing(shimmerTranslate, {
        toValue: width,
        duration: 600,
        useNativeDriver: true,
      }),
      // Brief pause before transitioning
      Animated.delay(400),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <LinearGradient
      colors={['#4A148C', '#7B1FA2', '#BF360C', '#E65100', '#FF6B35', '#FF8A50']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      {/* Ambient glow behind logo */}
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
        <Text style={styles.logoIcon}>🌅</Text>
        <Text style={styles.logoText}>GOLDEN</Text>
        <Text style={styles.logoTextAccent}>HOUR</Text>

        {/* Shimmer overlay */}
        <Animated.View
          style={[
            styles.shimmer,
            { transform: [{ translateX: shimmerTranslate }] },
          ]}
        />
      </Animated.View>

      {/* Tagline */}
      <Animated.View
        style={[
          styles.taglineContainer,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslateY }],
          },
        ]}
      >
        <Text style={styles.tagline}>Happy Hours in Happy Valley</Text>
        <View style={styles.taglineDivider} />
        <Text style={styles.taglineSub}>Right Now. Right Here.</Text>
      </Animated.View>

      {/* Bottom pulse dots */}
      <View style={styles.bottomDots}>
        <PulseDot delay={0} />
        <PulseDot delay={200} />
        <PulseDot delay={400} />
      </View>
    </LinearGradient>
  );
};

const PulseDot: React.FC<{ delay: number }> = ({ delay }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return <Animated.View style={[styles.dot, { opacity }]} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 80,
    elevation: 20,
  },
  logoContainer: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 8,
    lineHeight: 56,
  },
  logoTextAccent: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 12,
    lineHeight: 56,
    marginTop: -4,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ skewX: '-20deg' }],
  },
  taglineContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  taglineDivider: {
    width: 40,
    height: 2,
    backgroundColor: '#FFD700',
    marginVertical: 12,
    borderRadius: 1,
  },
  taglineSub: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  bottomDots: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});

import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Text } from '../components/ui/AppText';
import Svg, { Defs, RadialGradient, Stop, Rect as SvgRect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { sunsetGradient } from '../theme/colors';
import { AppIcon } from '../components/icons';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  onGetStarted?: () => void;
  onLogin?: () => void;
  onGuest?: () => void;
  splash?: boolean;
  onComplete?: () => void;
}

const FEATURES = [
  { icon: 'deals' as const, label: 'DEALS' },
  { icon: 'events' as const, label: 'EVENTS' },
  { icon: 'community' as const, label: 'COMMUNITY' },
] as const;

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onGetStarted, onLogin, onGuest, splash, onComplete }) => {
  const { theme } = useTheme();
  const d = theme.derived;

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoSwing = useRef(new Animated.Value(1)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(20)).current;
  const featuresOpacity = useRef(new Animated.Value(0)).current;
  const featuresTranslateY = useRef(new Animated.Value(30)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaTranslateY = useRef(new Animated.Value(20)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(glowOpacity, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        // Pendulum swing: spring overshoots past its 0 target and settles with
        // decaying oscillation — low friction relative to tension is what
        // produces the back-and-forth swing rather than a single ease-in.
        Animated.spring(logoSwing, {
          toValue: 0,
          tension: 22,
          friction: 4,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(taglineTranslateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(featuresOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(featuresTranslateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(ctaOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(ctaTranslateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (splash && finished && onComplete) onComplete();
    });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: d.background }]}>
      {/* Radial Glow */}
      <Animated.View style={[styles.glowContainer, { opacity: glowOpacity }]}>
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="35%" rx="50%" ry="40%">
              <Stop offset="0%" stopColor="#FFC23D" stopOpacity="0.16" />
              <Stop offset="50%" stopColor="#FF8A3D" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#1A1020" stopOpacity="0" />
            </RadialGradient>
            {/* Second, lower glow: the pink end of the sunset. */}
            <RadialGradient id="dusk" cx="50%" cy="95%" rx="80%" ry="45%">
              <Stop offset="0%" stopColor="#FF4F81" stopOpacity="0.14" />
              <Stop offset="100%" stopColor="#1A1020" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <SvgRect x="0" y="0" width={width} height={height} fill="url(#dusk)" />
          <SvgRect x="0" y="0" width={width} height={height} fill="url(#glow)" />
        </Svg>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoSection,
            {
              opacity: logoOpacity,
              transform: [
                {
                  rotate: logoSwing.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '-26deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Image
            source={require('../../assets/gldnhr-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={[
            styles.taglineSection,
            { opacity: taglineOpacity, transform: [{ translateY: taglineTranslateY }] },
          ]}
        >
          <Text style={[styles.taglineLine1, { color: d.text }]}>Find the best deals.</Text>
          <Text style={[styles.taglineLine2, { color: d.text }]}>
            Discover your <Text style={[styles.taglineGold, { color: d.primary }]}>city</Text>.
          </Text>
        </Animated.View>

        {/* Subtext */}
        <Animated.View style={[styles.subtextSection, { opacity: taglineOpacity }]}>
          <Text style={[styles.subtext, { color: d.textMuted }]}>
            Your guide to happy hours, live deals, and hidden gems — built by the community
            that goes out with you.
          </Text>
        </Animated.View>

        {/* Feature Icons */}
        <Animated.View
          style={[
            styles.featuresSection,
            { opacity: featuresOpacity, transform: [{ translateY: featuresTranslateY }] },
          ]}
        >
          <View style={styles.featuresRow}>
            {FEATURES.map(({ icon, label }) => (
              <View key={label} style={styles.featureItem}>
                <View style={[styles.featureIconBox, { backgroundColor: d.filterInactive }]}>
                  <AppIcon name={icon} size={28} role="brand" />
                </View>
                <Text style={[styles.featureLabel, { color: d.textMuted }]}>{label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* CTA Buttons */}
        {!splash && (
          <Animated.View
            style={[
              styles.ctaSection,
              { opacity: ctaOpacity, transform: [{ translateY: ctaTranslateY }] },
            ]}
          >
            <TouchableOpacity activeOpacity={0.85} onPress={onGetStarted}>
              <LinearGradient
                colors={sunsetGradient}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.primaryButton}
              >
                <Text style={[styles.primaryButtonText, { color: '#1A1020' }]}>GET STARTED</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: d.border }]}
              activeOpacity={0.7}
              onPress={onLogin}
            >
              <Text style={[styles.secondaryButtonText, { color: d.text }]}>I HAVE AN ACCOUNT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestButton}
              activeOpacity={0.6}
              onPress={onGuest}
            >
              <Text style={[styles.guestButtonText, { color: d.textMuted }]}>
                Continue as guest
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Fine Print */}
        <View style={styles.finePrint}>
          <Text style={[styles.finePrintText, { color: d.textHint }]}>
            v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.12,
    paddingBottom: 40,
  },

  /* Glow */
  glowContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  /* Logo */
  logoSection: { alignItems: 'center', marginBottom: 48 },
  logoImage: { width: 170, height: 255 },

  /* Tagline */
  taglineSection: { alignItems: 'center', marginBottom: 20 },
  taglineLine1: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, textAlign: 'center' },
  taglineLine2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, textAlign: 'center' },
  taglineGold: { fontWeight: '700' },

  /* Subtext */
  subtextSection: { alignItems: 'center', marginBottom: 48, paddingHorizontal: 8 },
  subtext: { fontSize: 14, fontWeight: '400', lineHeight: 22, textAlign: 'center' },

  /* Features */
  featuresSection: { marginBottom: 48 },
  featuresRow: { flexDirection: 'row', justifyContent: 'space-around' },
  featureItem: { alignItems: 'center' },
  featureIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1.5 },

  /* CTAs */
  ctaSection: { gap: 12, marginBottom: 40 },
  primaryButton: { height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
  secondaryButton: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  secondaryButtonText: { fontSize: 14, fontWeight: '700', letterSpacing: 1.5 },
  guestButton: { alignItems: 'center', paddingVertical: 8 },
  guestButtonText: { fontSize: 13, fontWeight: '500' },

  /* Fine Print */
  finePrint: { alignItems: 'center' },
  finePrintText: { fontSize: 10, fontWeight: '500', letterSpacing: 2 },
});

import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface VenueLogoProps {
  logoUrl: string | null | undefined;
  name: string;
  size?: number;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

// Deterministic muted color from venue name so each bar gets its own shade
const PALETTE = ['#6b7280', '#7c6f8e', '#5c7a7a', '#7a6b5c', '#5c6b7a', '#7a5c6b'];
function bgColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export const VenueLogo: React.FC<VenueLogoProps> = ({ logoUrl, name, size = 48 }) => {
  const [failed, setFailed] = useState(false);

  const radius = size * 0.22;
  const fontSize = size * 0.33;

  if (logoUrl && !failed) {
    return (
      <Image
        source={{ uri: logoUrl.trim() }}
        style={[styles.image, { width: size, height: size, borderRadius: radius }]}
        resizeMode="contain"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius, backgroundColor: bgColor(name) },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials(name)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: 'transparent',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { AppIcon } from '../../components/icons';
import { periodForStartHour } from '../utils/goldenHourColors';
import { CalendarEvent } from '../types';

interface ClusterBlockProps {
  label: string;
  startMinutes: number;
  endMinutes: number;
  events: CalendarEvent[];
  onPress: () => void;
}

function rangeText(m: number): string {
  const h24 = Math.floor(m / 60) % 24;
  const min = m % 60;
  const h = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  const ap = h24 < 12 ? 'a' : 'p';
  return min === 0 ? `${h}${ap}` : `${h}:${min.toString().padStart(2, '0')}${ap}`;
}

export const ClusterBlock: React.FC<ClusterBlockProps> = ({
  label,
  startMinutes,
  endMinutes,
  events,
  onPress,
}) => {
  const { theme } = useTheme();
  const d = theme.derived;
  const period = periodForStartHour(startMinutes / 60);
  const topRated = [...events].sort(
    (a, b) => (b.venue.rating ?? 0) - (a.venue.rating ?? 0),
  )[0];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.block,
        {
          backgroundColor: d.cardBackground,
          borderColor: d.cardBorder,
          borderLeftColor: period.color,
          borderLeftWidth: 4,
        },
      ]}
    >
      <View style={styles.row}>
        <AppIcon name="list" size={14} color={period.color} />
        <Text style={[styles.label, { color: d.text }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={[styles.meta, { color: d.textMuted }]} numberOfLines={1}>
        {rangeText(startMinutes)}–{rangeText(endMinutes)} · top: {topRated?.title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  block: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    width: '100%',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
  },
  meta: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});

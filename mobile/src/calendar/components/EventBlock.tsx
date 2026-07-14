import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { formatScheduleRange } from '../../utils/scheduleUtils';
import { AppIcon } from '../../components/icons';
import { periodForStartHour } from '../utils/goldenHourColors';
import { CalendarEvent } from '../types';

interface EventBlockProps {
  event: CalendarEvent;
  onPress: () => void;
  compact?: boolean;
  topPick?: boolean;
}

function priceTierText(level: number | null): string {
  if (level == null) return '';
  return '$'.repeat(Math.max(1, Math.min(4, level)));
}

function dealIconName(event: CalendarEvent): 'martini' | 'food' | 'wine' {
  const cats = new Set(event.deals.map((d) => (d.category ?? '').toLowerCase()));
  if (cats.has('food')) return 'food';
  if (cats.has('drink')) return 'martini';
  return 'wine';
}

export const EventBlock: React.FC<EventBlockProps> = ({ event, onPress, compact, topPick }) => {
  const { theme } = useTheme();
  const d = theme.derived;
  const period = periodForStartHour(event.startMinutes / 60);
  const time = formatScheduleRange(event.schedule.start_time, event.schedule.end_time);
  const price = priceTierText(event.priceLevel);

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.pill,
          {
            backgroundColor: d.cardBackground,
            borderLeftColor: period.color,
            borderLeftWidth: 3,
          },
        ]}
        activeOpacity={0.85}
      >
        <Text style={[styles.pillTitle, { color: d.text }]} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={[styles.pillTime, { color: d.textMuted }]} numberOfLines={1}>
          {time}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.block,
        {
          backgroundColor: topPick ? d.selectedSurface : d.cardBackground,
          borderColor: d.cardBorder,
          borderLeftColor: period.color,
          borderLeftWidth: 4,
        },
      ]}
      activeOpacity={0.85}
    >
      <View style={styles.blockHeader}>
        <Text
          style={[styles.blockTitle, { color: topPick ? period.color : d.text }]}
          numberOfLines={1}
        >
          {event.title}
        </Text>
        {topPick ? (
          <AppIcon name="crown" size={15} color={period.color} />
        ) : (
          <AppIcon name={dealIconName(event)} size={16} color={period.color} />
        )}
      </View>
      <View style={styles.blockMeta}>
        <Text style={[styles.blockTime, { color: d.textSecondary }]}>{time}</Text>
        {price ? <Text style={[styles.blockPrice, { color: d.textMuted }]}>{price}</Text> : null}
        {event.venue.neighborhood ? (
          <Text style={[styles.blockHood, { color: d.textMuted }]} numberOfLines={1}>
            {event.venue.neighborhood}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  block: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    width: '100%',
    overflow: 'hidden',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  blockTitle: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  blockMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  blockTime: { fontSize: 11, fontWeight: '600' },
  blockPrice: { fontSize: 11, fontWeight: '700' },
  blockHood: { fontSize: 11, flexShrink: 1 },
  pill: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 3,
    width: '100%',
  },
  pillTitle: { fontSize: 11, fontWeight: '700' },
  pillTime: { fontSize: 10 },
});

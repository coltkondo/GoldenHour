import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { EventCalItem } from '../types';

const EVENT_COLOR = '#a78bfa';

interface EventTimelineBlockProps {
  item: EventCalItem;
  onPress: () => void;
  compact?: boolean;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Sibling to EventBlock.tsx (the HH timeline block). Not reused directly —
// EventBlock reads schedule.start_time/deals/priceLevel, none of which an
// EventCalItem has. Same visual language (left accent bar, block/pill modes)
// for consistency across the two calendars.
export const EventTimelineBlock: React.FC<EventTimelineBlockProps> = ({ item, onPress, compact }) => {
  const { theme } = useTheme();
  const d = theme.derived;
  const { event, venue } = item;
  const time = fmtTime(event.start_datetime) + (event.end_datetime ? ` – ${fmtTime(event.end_datetime)}` : '');
  const isRecurring = event.is_recurring || !!event.series_id;

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.pill, { backgroundColor: d.cardBackground, borderLeftColor: EVENT_COLOR, borderLeftWidth: 3 }]}
        activeOpacity={0.85}
      >
        <Text style={[styles.pillTitle, { color: d.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.pillTime, { color: d.textMuted }]} numberOfLines={1}>{time}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.block, { backgroundColor: d.cardBackground, borderColor: d.cardBorder, borderLeftColor: EVENT_COLOR, borderLeftWidth: 4 }]}
      activeOpacity={0.85}
    >
      <View style={styles.blockHeader}>
        <Text style={[styles.blockTitle, { color: d.text }]} numberOfLines={1}>{item.title}</Text>
        {isRecurring && (
          <View style={[styles.badge, { borderColor: EVENT_COLOR }]}>
            <Text style={[styles.badgeText, { color: EVENT_COLOR }]}>↻</Text>
          </View>
        )}
      </View>
      <View style={styles.blockMeta}>
        <Text style={[styles.blockTime, { color: d.textSecondary }]}>{time}</Text>
        <Text style={[styles.blockVenue, { color: d.textMuted }]} numberOfLines={1}>
          {venue.nickname ?? venue.name}
        </Text>
      </View>
      {event.event_type ? (
        <Text style={[styles.blockType, { color: EVENT_COLOR }]} numberOfLines={1}>
          {event.event_type.toUpperCase()}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  block: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 8, width: '100%', overflow: 'hidden' },
  blockHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  blockTitle: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
  badge: { borderWidth: 1, borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 10, fontWeight: '700' },
  blockMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' },
  blockTime: { fontSize: 11, fontWeight: '600' },
  blockVenue: { fontSize: 11, flexShrink: 1 },
  blockType: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4, marginTop: 2 },
  pill: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 6, marginBottom: 3, width: '100%' },
  pillTitle: { fontSize: 11, fontWeight: '700' },
  pillTime: { fontSize: 10 },
});

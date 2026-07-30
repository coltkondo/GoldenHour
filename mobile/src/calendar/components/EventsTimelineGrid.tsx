import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { useEventsCalendar } from '../EventsCalendarContext';
import { EventTimelineBlock } from './EventTimelineBlock';
import { EventCalItem } from '../types';
import {
  timelineHours,
  hourLabel,
  layoutDay,
  TIMELINE_HEIGHT,
  HOUR_HEIGHT,
  PX_PER_MIN,
  TIMELINE_START_MIN,
} from '../utils/dateGrid';

const HOUR_OFFSET = TIMELINE_START_MIN / 60;

interface EventsTimelineGridProps {
  dates: Date[];
  onEventPress: (item: EventCalItem) => void;
}

// Sibling to TimelineGrid.tsx. Uses the plain layoutDay() column-packer
// instead of layoutDayClustered() — event density per venue/day is much
// lower than HH deals, so the ranked "top pick + N more" clustering isn't
// needed yet. Can graduate to it later if a city gets dense enough.
export const EventsTimelineGrid: React.FC<EventsTimelineGridProps> = ({ dates, onEventPress }) => {
  const { theme } = useTheme();
  const d = theme.derived;
  const { eventsForDay } = useEventsCalendar();
  const hours = timelineHours();

  return (
    <View style={[styles.row, { height: TIMELINE_HEIGHT }]}>
      <View style={[styles.gutter, { height: TIMELINE_HEIGHT }]}>
        {hours.map((h) => (
          <View key={h} style={[styles.hourLabelWrap, { top: (h - HOUR_OFFSET) * HOUR_HEIGHT }]}>
            <Text style={[styles.hourLabel, { color: d.textMuted }]}>{hourLabel(h)}</Text>
          </View>
        ))}
      </View>

      {dates.map((date, idx) => {
        const laid = layoutDay(eventsForDay(date));
        return (
          <View key={idx} style={[styles.column, { height: TIMELINE_HEIGHT }]}>
            {hours.map((h) => (
              <View
                key={h}
                style={[styles.line, { top: (h - HOUR_OFFSET) * HOUR_HEIGHT, backgroundColor: d.border }]}
              />
            ))}
            {laid.map((item) => {
              const top = (item.startMinutes - TIMELINE_START_MIN) * PX_PER_MIN;
              const height = Math.max((item.endMinutes - item.startMinutes) * PX_PER_MIN, 22);
              const col = item.column ?? 0;
              const cols = item.columns ?? 1;
              const widthPct = 100 / cols;
              const wrap: ViewStyle = { top, height, left: `${col * widthPct}%`, width: `${widthPct}%` };
              return (
                <View key={item.id} style={[styles.eventWrap, wrap]}>
                  <EventTimelineBlock item={item} onPress={() => onEventPress(item)} />
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

const GUTTER = 38;

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  gutter: { width: GUTTER, position: 'relative' },
  hourLabelWrap: { position: 'absolute', right: 4, transform: [{ translateY: -7 }] },
  hourLabel: { fontSize: 10, fontWeight: '600' },
  column: { flex: 1, position: 'relative', borderLeftWidth: StyleSheet.hairlineWidth },
  line: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  eventWrap: { position: 'absolute', paddingHorizontal: 1 },
});

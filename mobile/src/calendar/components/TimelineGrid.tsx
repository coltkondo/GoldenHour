import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { useCalendar } from '../CalendarContext';
import { EventBlock } from './EventBlock';
import { ClusterBlock } from './ClusterBlock';
import { CalendarEvent } from '../types';
import {
  timelineHours,
  hourLabel,
  layoutDayClustered,
  TIMELINE_HEIGHT,
  HOUR_HEIGHT,
  PX_PER_MIN,
  TIMELINE_START_MIN,
} from '../utils/dateGrid';

const HOUR_OFFSET = TIMELINE_START_MIN / 60;

interface TimelineGridProps {
  dates: Date[];
  onEventPress: (event: CalendarEvent) => void;
  onClusterPress?: (events: CalendarEvent[]) => void;
}

export const TimelineGrid: React.FC<TimelineGridProps> = ({
  dates,
  onEventPress,
  onClusterPress,
}) => {
  const { theme } = useTheme();
  const d = theme.derived;
  const { eventsForDay } = useCalendar();
  const hours = timelineHours();
  const now = new Date();

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
        const items = layoutDayClustered(eventsForDay(date), now);
        return (
          <View key={idx} style={[styles.column, { height: TIMELINE_HEIGHT }]}>
            {hours.map((h) => (
              <View
                key={h}
                style={[styles.line, { top: (h - HOUR_OFFSET) * HOUR_HEIGHT, backgroundColor: d.border }]}
              />
            ))}
            {items.map((it, i) => {
              const top = (it.startMinutes - TIMELINE_START_MIN) * PX_PER_MIN;
              const height = Math.max((it.endMinutes - it.startMinutes) * PX_PER_MIN, 22);
              const col = it.column ?? 0;
              const cols = it.columns ?? 1;
              const widthPct = 100 / cols;
              const wrap: ViewStyle = {
                top,
                height,
                left: `${col * widthPct}%`,
                width: `${widthPct}%`,
              };
              if (it.kind === 'cluster') {
                return (
                  <View key={`c${i}`} style={[styles.eventWrap, wrap]}>
                    <ClusterBlock
                      label={it.label}
                      startMinutes={it.startMinutes}
                      endMinutes={it.endMinutes}
                      events={it.events}
                      onPress={() => onClusterPress?.(it.events)}
                    />
                  </View>
                );
              }
              return (
                <View key={it.event.id} style={[styles.eventWrap, wrap]}>
                  <EventBlock
                    event={it.event}
                    topPick={it.topPick}
                    onPress={() => onEventPress(it.event)}
                  />
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
  gutter: {
    width: GUTTER,
    position: 'relative',
  },
  hourLabelWrap: {
    position: 'absolute',
    right: 4,
    transform: [{ translateY: -7 }],
  },
  hourLabel: { fontSize: 10, fontWeight: '600' },
  column: {
    flex: 1,
    position: 'relative',
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  eventWrap: {
    position: 'absolute',
    paddingHorizontal: 1,
  },
});

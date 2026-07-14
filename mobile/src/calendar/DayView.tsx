import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useCalendar } from './CalendarContext';
import { TimelineGrid } from './components/TimelineGrid';
import { EmptyState } from './components/EmptyState';
import { CalendarEvent } from './types';
import { jsDayToDow } from './utils/dateGrid';

interface DayViewProps {
  onClusterPress?: (events: CalendarEvent[]) => void;
}

export const DayView: React.FC<DayViewProps> = ({ onClusterPress }) => {
  const { theme } = useTheme();
  const d = theme.derived;
  const { selectedDate, eventsForDay } = useCalendar();
  const navigation = useNavigation<any>();
  const events = eventsForDay(selectedDate);

  const onEventPress = (ev: CalendarEvent) =>
    navigation.navigate('HappyHour', { venue: ev.venue });

  if (events.length === 0) {
    return (
      <View style={styles.flex}>
        <EmptyState />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TimelineGrid
          dates={[selectedDate]}
          onEventPress={onEventPress}
          onClusterPress={onClusterPress}
        />
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

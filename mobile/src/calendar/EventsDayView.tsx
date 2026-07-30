import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEventsCalendar } from './EventsCalendarContext';
import { EventsTimelineGrid } from './components/EventsTimelineGrid';
import { EmptyState } from './components/EmptyState';
import { EventCalItem } from './types';
import { scrollOffsetForEvents } from './utils/dateGrid';

export const EventsDayView: React.FC = () => {
  const { selectedDate, eventsForDay } = useEventsCalendar();
  const navigation = useNavigation<any>();
  const events = eventsForDay(selectedDate);

  const onEventPress = (item: EventCalItem) =>
    navigation.navigate('HappyHour', { venue: item.venue });

  if (events.length === 0) {
    return (
      <View style={styles.flex}>
        <EmptyState message="No events today." />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView showsVerticalScrollIndicator={false} contentOffset={{ x: 0, y: scrollOffsetForEvents(events) }}>
        <EventsTimelineGrid dates={[selectedDate]} onEventPress={onEventPress} />
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

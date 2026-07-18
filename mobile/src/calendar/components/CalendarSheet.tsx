import React from 'react';
import { Modal, View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../../theme';

interface CalendarSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeightPct?: number;
}

// Lightweight bottom sheet using core RN Modal (slide animation) + Animated
// backdrop. Avoids @gorhom/bottom-sheet / react-native-reanimated, which is not
// reliably available in this Expo Go runtime.
export const CalendarSheet: React.FC<CalendarSheetProps> = ({
  visible,
  onClose,
  children,
  maxHeightPct = 90,
}) => {
  const { theme } = useTheme();
  const d = theme.derived;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={[
                styles.sheet,
                { backgroundColor: d.surface, maxHeight: `${maxHeightPct}%` },
              ]}
            >
              <View style={[styles.handle, { backgroundColor: d.textMuted }]} />
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
    opacity: 0.4,
  },
});

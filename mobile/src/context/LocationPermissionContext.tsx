// App-wide location permission gate. Call `ensureLocationPermission()` instead
// of `Location.requestForegroundPermissionsAsync()`: if iOS is about to show its
// permission dialog, the LocationExplainer appears first (Apple's recommended
// "pre-alert"), and Continue then shows the real dialog.
//
// Concurrent callers (e.g. Map and Calendar mounting together) share a single
// request, so the explainer never stacks.
//
// Don't call this from inside another <Modal>: iOS can't present this modal on
// top of one that's already open. See GuestMarketPicker for the inline pattern.

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { useTheme } from '../theme';
import { LocationExplainer } from '../components/LocationExplainer';
import { ensurePermission } from '../utils/locationPermission';

type PermissionResponse = Location.LocationPermissionResponse;

interface LocationPermissionContextValue {
  ensureLocationPermission: () => Promise<PermissionResponse>;
}

const LocationPermissionContext = createContext<LocationPermissionContextValue | undefined>(
  undefined,
);

export const LocationPermissionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const resolveRef = useRef<(() => void) | null>(null);
  const inFlightRef = useRef<Promise<PermissionResponse> | null>(null);

  const showExplainer = useCallback(
    () =>
      new Promise<void>((resolve) => {
        resolveRef.current = resolve;
        setVisible(true);
      }),
    [],
  );

  const handleContinue = useCallback(() => {
    setVisible(false);
    const resolve = resolveRef.current;
    resolveRef.current = null;
    // Let the modal finish dismissing before iOS presents its dialog.
    setTimeout(() => resolve?.(), 350);
  }, []);

  const ensureLocationPermission = useCallback(() => {
    if (!inFlightRef.current) {
      inFlightRef.current = ensurePermission({
        getStatus: () => Location.getForegroundPermissionsAsync(),
        request: () => Location.requestForegroundPermissionsAsync(),
        showExplainer,
      }).finally(() => {
        inFlightRef.current = null;
      });
    }
    return inFlightRef.current;
  }, [showExplainer]);

  return (
    <LocationPermissionContext.Provider value={{ ensureLocationPermission }}>
      {children}
      <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
        {/* No backdrop-tap dismiss and no close button: the only way forward is
            Continue → system dialog, as Apple's guidance requires. */}
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: theme.derived.cardBackground }]}>
            <LocationExplainer onContinue={handleContinue} />
          </View>
        </View>
      </Modal>
    </LocationPermissionContext.Provider>
  );
};

export function useLocationPermission(): LocationPermissionContextValue {
  const ctx = useContext(LocationPermissionContext);
  if (!ctx) {
    throw new Error('useLocationPermission must be used within a LocationPermissionProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingBottom: 36,
  },
});

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LoadingScreen } from './src/screens/LoadingScreen';

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <>
        <LoadingScreen onFinish={() => setIsLoading(false)} />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <>
      <RootNavigator />
      <StatusBar style={theme.colors.statusBarStyle} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

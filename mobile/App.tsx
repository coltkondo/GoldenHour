import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';

type Destination = 'Main' | 'Login' | 'Signup';

function AppContent() {
  const [destination, setDestination] = useState<Destination | null>(null);
  const { theme } = useTheme();

  if (destination === null) {
    return (
      <>
        <LoadingScreen
          onGetStarted={() => setDestination('Signup')}
          onLogin={() => setDestination('Login')}
          onGuest={() => setDestination('Main')}
        />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <>
      <RootNavigator initialRoute={destination} />
      <StatusBar style="dark" />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

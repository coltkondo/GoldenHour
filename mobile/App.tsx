import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './src/theme';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';

type Destination = 'Main' | 'Login' | 'Signup';

function AppContent() {
  const { user, loading } = useAuth();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [splashComplete, setSplashComplete] = useState(false);

  const loggedIn = !loading && user !== null;

  // Logged-in users land on a button-free splash that auto-advances to Home.
  useEffect(() => {
    if (loggedIn && splashComplete && destination === null) {
      setDestination('Main');
    }
  }, [loggedIn, splashComplete, destination]);

  if (destination === null) {
    // Once the session is restored and the user isn't logged in, show the welcome screen.
    if (!loading && !user) {
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

    // Boot phase / logged-in splash — no buttons.
    return (
      <>
        <LoadingScreen splash onComplete={() => setSplashComplete(true)} />
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
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Shrikhand_400Regular } from '@expo-google-fonts/shrikhand';
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  DMSans_800ExtraBold,
  DMSans_900Black,
} from '@expo-google-fonts/dm-sans';
import { ThemeProvider, useTheme } from './src/theme';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LocationPermissionProvider } from './src/context/LocationPermissionContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';

type Destination = 'Main' | 'Login' | 'Signup';

function AppContent() {
  const { user, loading } = useAuth();
  const { mode } = useTheme();
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
      {/* Light icons on the dark theme, dark icons on the light theme. */}
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  // Font files are bundled, so this resolves almost instantly. If loading
  // fails we still boot; text just falls back to the system font.
  const [fontsLoaded, fontError] = useFonts({
    Shrikhand_400Regular,
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
    DMSans_900Black,
  });

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: '#1A1020' }} />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LocationPermissionProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </LocationPermissionProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

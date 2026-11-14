import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme';
import { TabNavigator } from './TabNavigator';
import { HappyHourScreen } from '../screens/HappyHourScreen';

import { MySubmissionsScreen } from '../screens/MySubmissionsScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { AdminReviewScreen } from '../screens/AdminReviewScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator();

type InitialRoute = 'Main' | 'Login' | 'Signup' | 'ForgotPassword';

function AppNavigator({ initialRoute }: { initialRoute: InitialRoute }) {
  const { loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.derived.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={theme.derived.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
      <Stack.Screen name="Main" component={TabNavigator} options={{ gestureEnabled: false }} />
      {/* Auth modals — reachable from SubmitScreen/ProfileScreen auth gates */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
      />
      <Stack.Screen
        name="HappyHour"
        component={HappyHourScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="MySubmissions"
        component={MySubmissionsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="AdminReview"
        component={AdminReviewScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

export const RootNavigator = ({ initialRoute = 'Main' }: { initialRoute?: InitialRoute }) => {
  return (
    <NavigationContainer>
      <AppNavigator initialRoute={initialRoute} />
    </NavigationContainer>
  );
};

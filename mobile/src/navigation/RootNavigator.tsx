import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { TabNavigator } from './TabNavigator';
import { HappyHourScreen } from '../screens/HappyHourScreen';
import { QuickSubmitScreen } from '../screens/QuickSubmitScreen';
import { MySubmissionsScreen } from '../screens/MySubmissionsScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { AdminReviewScreen } from '../screens/AdminReviewScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!token) {
    return <AuthNavigator />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen
        name="HappyHour"
        component={HappyHourScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="QuickSubmit"
        component={QuickSubmitScreen}
        options={{ animation: 'slide_from_bottom' }}
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

export const RootNavigator = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

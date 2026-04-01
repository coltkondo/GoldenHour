import React from 'react';
import { View, StyleSheet, Pressable, Platform, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme';
import { AppIcon } from '../components/icons';
import { HomeScreen } from '../screens/HomeScreen';
import { MapScreen } from '../screens/MapScreen';
import { ExplorerScreen } from '../screens/ExplorerScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const ThemedTabBar = ({ state, descriptors, navigation }: any) => {
  const { theme } = useTheme();
  const d = theme.derived;

  return (
    <View style={[styles.tabBar, { backgroundColor: d.background, borderTopColor: d.border }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tabItem}>
            <AppIcon
              name={route.name === 'HomeTab' ? 'home' : route.name === 'MapTab' ? 'location' : route.name === 'ExplorerTab' ? 'search' : 'profile'}
              size={22}
              role={isFocused ? 'brand' : 'muted'}
            />
            <Text style={[styles.tabLabel, { color: isFocused ? d.primary : d.textMuted }]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <ThemedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="MapTab" component={MapScreen} options={{ tabBarLabel: 'Map' }} />
      <Tab.Screen name="ExplorerTab" component={ExplorerScreen} options={{ tabBarLabel: 'Explore' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 0,
    paddingTop: 8,
    borderTopWidth: 0.5,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});

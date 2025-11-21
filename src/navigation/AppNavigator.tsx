import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';

import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PurchaseScreen from '../screens/PurchaseScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AIScreen from '../screens/AIScreen';
import { Colors } from '../constants/colors';
import { useThemeColors, useTheme } from '../hooks/useThemeColors';
import {
  UnitsScreen,
  MotivationScreen,
  DailyRoutineScreen,
  WeightActivityScreen,
  GoalCalculationScreen,
  RemindersScreen,
  PermissionsScreen,
} from '../screens/onboarding';

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  LogWater: { containerId?: string; amount?: number };
  Settings: undefined;
  Notifications: undefined;
  Purchase: undefined;
  Onboarding: undefined;
  ContainerEditor: { containerId?: string };
  UnitsScreen: undefined;
  MotivationScreen: undefined;
  DailyRoutineScreen: undefined;
  WeightActivityScreen: undefined;
  GoalCalculationScreen: undefined;
  RemindersScreen: undefined;
  PermissionsScreen: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Stats: undefined;
  AI: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Removed inline placeholder for Stats

function MainTabNavigator() {
  const theme = useThemeColors();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'water' : 'water-outline';
              break;
            case 'History':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Stats':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case 'AI':
              iconName = focused ? 'bulb' : 'bulb-outline';
              break;
            case 'Profile':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
        },
        headerStyle: {
          backgroundColor: theme.card,
        },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{ title: 'History' }}
      />
      <Tab.Screen 
        name="Stats" 
        component={StatisticsScreen} 
        options={{ title: 'Statistics' }}
      />
      <Tab.Screen
        name="AI"
        component={AIScreen}
        options={{ title: 'AI' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { theme, mode } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: mode === 'dark',
        colors: {
          primary: theme.primary,
          background: theme.background,
          card: theme.card,
          text: theme.text,
          border: theme.border,
          notification: theme.primary,
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: 'normal',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: 'bold',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '900',
          },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.card,
          },
          headerTintColor: theme.text,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator} 
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="UnitsScreen"
          component={UnitsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MotivationScreen"
          component={MotivationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DailyRoutineScreen"
          component={DailyRoutineScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="WeightActivityScreen"
          component={WeightActivityScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GoalCalculationScreen"
          component={GoalCalculationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RemindersScreen"
          component={RemindersScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PermissionsScreen"
          component={PermissionsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Notifications" 
          component={NotificationsScreen} 
          options={{ title: 'Notifications' }}
        />
        <Stack.Screen 
          name="Purchase" 
          component={PurchaseScreen} 
          options={{ title: 'Purchases' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: 'Settings' }}
        />
        {/* TODO: Add modal screens like LogWater, ContainerEditor */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

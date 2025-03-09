import { router, Tabs } from 'expo-router';
import React from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { TouchableOpacity } from 'react-native';
import { COLORS } from '@/constants/theme';
import { getAuth } from '@react-native-firebase/auth';

export default function TabLayout() {
  const handleLogout = async () => {
    try {
      await getAuth().signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: '',
        headerShadowVisible: false,
        headerLeft: () => (
          <TouchableOpacity style={{ marginLeft: 20 }} onPress={() => handleLogout()}>
            <MaterialCommunityIcons name="logout" size={24} color={COLORS.icon} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity style={{ marginRight: 20 }} onPress={() => router.push({ pathname: '/help' })}>
            <MaterialCommunityIcons name="help" size={24} color={COLORS.icon} />
          </TouchableOpacity>
        ),
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        tabBarStyle: {
          backgroundColor: COLORS.tabBar,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.icon,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Sleep',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="power-sleep"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="leaderboard" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

import { router, Tabs } from 'expo-router';
import React from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: '',
        headerShadowVisible: false,
        headerLeft: () => (
          <TouchableOpacity style={{ margin: 20 }} onPress={() => router.push({ pathname: '../login' })}>
            <MaterialCommunityIcons name="logout" size={24} color="black" />
          </TouchableOpacity>
        ),
        // headerStyle: {
        //   backgroundColor: COLORS.background,
        // },
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

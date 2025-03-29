import { useRouter, Tabs } from 'expo-router';
import React from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { TouchableOpacity } from 'react-native';
import { COLORS } from '@/constants/theme';
import { getAuth } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId:
    '402325774920-qtkbui3ekj2geoq7hoc3lq8v3if97evv.apps.googleusercontent.com',
});

export default function TabLayout() {
  const router = useRouter();
  const currentUser = getAuth().currentUser;
  
  const handleLogout = async () => {
    try {
      await getAuth().signOut();
      await GoogleSignin.signOut();
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
          <TouchableOpacity
            style={{ marginLeft: 20 }}
            onPress={() => handleLogout()}
          >
            <MaterialCommunityIcons
              name="logout"
              size={24}
              color={COLORS.icon}
            />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity style={{ marginRight: 20 }} onPress={() => router.push({ pathname: '/help', params: { userId: currentUser?.uid }})}>
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
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="user-friends" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

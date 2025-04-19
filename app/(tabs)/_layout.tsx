import { useRouter, Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Entypo from '@expo/vector-icons/Entypo';
import { TouchableOpacity } from 'react-native';
import { COLORS } from '@/constants/theme';
import { getAuth } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import analytics from '@react-native-firebase/analytics';
import * as Notifications from 'expo-notifications';
import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

GoogleSignin.configure({
  webClientId:
    '402325774920-qtkbui3ekj2geoq7hoc3lq8v3if97evv.apps.googleusercontent.com',
});

export default function TabLayout() {
  const router = useRouter();
  const currentUser = getAuth().currentUser;

  const handleLogout = async () => {
    try {
      await analytics().logEvent('logout', {
        userId: currentUser?.uid,
        email: currentUser?.email,
      });
      await getAuth().signOut();
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const setupSleepReminder = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const db = getFirestore();
    let userBedTime = new Date();
    if (currentUser != null) {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      userBedTime = userDoc.data()?.bedTime?.toDate() || new Date();
    }

    // Daily reminder notifications
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to sleep! 😴',
        body: "Don't forget to start your sleep session to maintain your streak!",
        sound: true,
      },
      // trigger: {
      //   type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      //   seconds: 10,
      // },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: userBedTime.getHours(),
        minute: userBedTime.getMinutes(),
      },
    });
  };

  useEffect(() => {
    registerForPushNotificationsAsync();
    setupSleepReminder();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    } else {
      console.log('Failed to get push token for push notification!');
      return;
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
          <TouchableOpacity
            style={{ marginRight: 20 }}
            onPress={() =>
              router.push({
                pathname: '../settings',
                params: { userId: currentUser?.uid },
              })
            }
          >
            <MaterialCommunityIcons name="cog" size={24} color={COLORS.icon} />
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
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="history" size={24} color={color} />
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
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color }) => (
            <Entypo name="shop" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

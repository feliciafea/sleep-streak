import { FirebaseAuthTypes, getAuth } from '@react-native-firebase/auth';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();

  // Daily reminder notifications 
  useEffect(() => {
    registerForPushNotificationsAsync();
    setupSleepReminder();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    } else {
      console.log('Failed to get push token for push notification!');
      return;
    }
  };

  const setupSleepReminder = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to sleep! 😴",
        body: "Don't forget to start your sleep session to maintain your streak!",
        sound: true,
      },
      // trigger: {
      //   type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      //   seconds: 10,
      // },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 18, // 9 PM
        minute: 15,
      },
    });
  };


  useEffect(() => {
    const subscriber = getAuth().onAuthStateChanged(
      (user: FirebaseAuthTypes.User | null) => {
        if (initializing) setInitializing(false);
        setUser(user);
      },
    );
    return subscriber; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    if (initializing) return;

    if (user) {
      router.replace({
        pathname: '/(tabs)',
      });
    } else {
      router.replace('/login');
    }
  }, [user, initializing]);

  if (initializing)
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="help" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

import { FirebaseAuthTypes, getAuth } from '@react-native-firebase/auth';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, setLoaded] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
  const [fonstLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    const subscriber = getAuth().onAuthStateChanged((user) => {
      if (initializing) setInitializing(false);
      if (user) {
        router.push({
          pathname: '/(tabs)/sleep',
        });
      }
    });
    return subscriber; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    if (fonstLoaded && !initializing) {
      setLoaded(true);
    }
  }, [fonstLoaded, initializing]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

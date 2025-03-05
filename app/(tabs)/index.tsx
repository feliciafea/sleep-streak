import { Text, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useEffect, useState } from 'react';
import SleepTracker from '../../components/SleepTracker';
import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';
import { COLORS } from '@/constants/theme';

export default function HomeScreen() {
  // Set an initializing state whilst Firebase connects
  const [initializing, setInitializing] = useState<boolean>(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [streak, setStreak] = useState<number>(0);

  function onAuthStateChanged(user: FirebaseAuthTypes.User | null) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = getAuth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    const getUserStreak = async (user: FirebaseAuthTypes.User) => {
      const db = getFirestore();
      const userStreak = await getDoc(doc(db, 'users', user.uid));
      console.log(userStreak.data());
      setStreak(userStreak.data()?.streak);
    };

    if (user) {
      getUserStreak(user);
    }
  }, [user]);

  if (initializing) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.container}>
        {user && (
          <>
            <Text style={styles.headerText}>Sleep Streak</Text>
            <Text style={styles.streakText}>{streak}</Text>
            <SleepTracker user={user} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  streakText: {
    fontSize: 50,
    marginVertical: 10,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
});

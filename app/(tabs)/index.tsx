import { Text, StyleSheet, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useEffect, useState } from 'react';
import SleepTracker from '../../components/SleepTracker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore';
import { COLORS } from '@/constants/theme';



export default function HomeScreen() {
  // Set an initializing state whilst Firebase connects
  const [initializing, setInitializing] = useState<boolean>(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [averageSleep, setAverageSleep] = useState<number>(0);
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
    const getUserStreak = (user: FirebaseAuthTypes.User) => {
      const db = getFirestore();
      const userDocRef = doc(db, 'users', user.uid);
      onSnapshot(userDocRef, (docSnap) => {
        if (docSnap?.exists) {
          setStreak(docSnap.data()?.streak);
        }
      });
    };

    const getHistory = async (user: FirebaseAuthTypes.User) => {
      const db = getFirestore();
      onSnapshot(
        query(
          collection(db, 'sleepSessions'),
          where('userID', '==', user.uid),
          orderBy('endTime', 'desc'),
        ),
        (querySnapShot) => {
          const list: number[] = [];
          if (!querySnapShot || querySnapShot.empty) {
            return;
          }
          querySnapShot.forEach((doc) => {
            if (!doc.data().active && doc.data().endTime) {
              let netTime = doc.data().netTime;
              list.push(netTime);
            }
          });
          if (list.length == 0) {
            setAverageSleep(0)
          } else {
            let avg = list.reduce((acc, sleep) => acc + sleep, 0) / list.length
            avg = avg / 60
            setAverageSleep(avg)
          }
        },
      );
    };

    if (user) {
      getUserStreak(user);
      getHistory(user);
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
            <View style={styles.averageCard}>
              <Text style={styles.averageTitle}>
                Average Sleep Time
              </Text>
              <Text style={styles.averageText}>
                {averageSleep.toFixed(1)} hrs
              </Text>
            </View>

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
    padding: 5,
    paddingTop: 0,
    justifyContent: 'flex-start'
  },
  headerText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  streakText: {
    fontSize: 50,
    marginVertical: 10,
    fontWeight: 'bold',
    color: COLORS.accent,
  },

  averageCard: {
    marginBlockStart: 40,
    backgroundColor: COLORS.lightBackground,
    borderRadius: 5,
    padding: 15,
    marginVertical: 15,
    width: '75%',
    elevation: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 4,

  },
  averageTitle: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: 'bold',
    padding: 10
  },
  averageText: {
    fontSize: 18,
    color: COLORS.accent,
  },
});

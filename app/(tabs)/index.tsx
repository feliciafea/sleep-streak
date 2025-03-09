import { Text, StyleSheet, View, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useEffect, useState } from 'react';
import SleepTracker from '../../components/SleepTracker';
import { collection, doc, FirebaseFirestoreTypes, getDoc, getDocs, getFirestore, onSnapshot, orderBy, query, where } from '@react-native-firebase/firestore';
import { COLORS } from '@/constants/theme';
interface Session {
  id: string;
  startTime: number,
  endTime: number,
  sleepTime: number;
  netTime: number;
}
export default function HomeScreen() {
  // Set an initializing state whilst Firebase connects
  const [initializing, setInitializing] = useState<boolean>(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
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
    const getHistory = async (user: FirebaseAuthTypes.User) => {
      const db = getFirestore();
      onSnapshot(query(collection(db, "sleepSessions"), where("userID", "==", user.uid), orderBy('endTime', 'desc')),
        (querySnapShot) => {
          const list: Session[] = [];
          if (!querySnapShot || querySnapShot.empty) {
            return;
          }
          querySnapShot.forEach(doc => {
            if (!doc.data().active && doc.data().endTime) {
              let start = doc.data().startTime.toDate()
              let end = doc.data().endTime.toDate()
              let penalties = doc.data().penalty

              //sleepTime and netTime is in minutes
              let totalSleep = Math.round((end.getTime() - start.getTime()) / (1000 * 60))

              list.push({
                id: doc.id,
                startTime: start,
                endTime: end,
                sleepTime: totalSleep,
                netTime: Math.max(0, totalSleep - 15 * penalties)
              })
            }
          });
          setSessions(list);
        });
    };

    if (user) {
      getUserStreak(user);
      getHistory(user)
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
            <Text style={styles.sessionTitle}>Sleep History</Text>
            <FlatList
              data={sessions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.sessionItem} >
                  <Text style={styles.sessionText}>Start Time: {item.startTime.toLocaleString()}</Text>
                  <Text style={styles.sessionText}>End Time: {item.endTime.toLocaleString()}</Text>
                  <Text style={styles.sessionText}>TotalTime: {Math.floor(item.sleepTime / 60)} hrs {item.sleepTime % 60} mins</Text>
                  <Text style={styles.sessionText}>NetTime: {Math.floor(item.netTime / 60)} hrs {item.netTime % 60} mins</Text>
                </View>
              )}
            />
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
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 10
  },
  sessionItem: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    margin: 10,
    backgroundColor: COLORS.lightBackground,
    padding: 10

  },
  sessionText: {
    fontSize: 16,
    marginBottom: 15,
    color: COLORS.text,
    fontWeight: 'bold',
  }
});

import { Text, StyleSheet, View, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useEffect, useState } from 'react';
import SleepTracker from '../../components/SleepTracker';
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

interface Session {
  id: string;
  startTime: Date;
  endTime: Date;
  sleepTime: number;
  netTime: number;
}
let alternateUI = true

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
    const getUserStreak = (user: FirebaseAuthTypes.User) => {
      const db = getFirestore();
      const userDocRef = doc(db, 'users', user.uid);
      onSnapshot(userDocRef, (docSnap) => {
        if (docSnap?.exists) {
          console.log(docSnap.data());
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
          const list: Session[] = [];
          if (!querySnapShot || querySnapShot.empty) {
            return;
          }
          querySnapShot.forEach((doc) => {
            if (!doc.data().active && doc.data().endTime) {
              let start = doc.data().startTime.toDate();
              let end = doc.data().endTime.toDate();
              let penalties = doc.data().penalty;

              //sleepTime and netTime is in minutes
              let totalSleep = Math.round(
                (end.getTime() - start.getTime()) / (1000 * 60),
              );

              list.push({
                id: doc.id,
                startTime: start,
                endTime: end,
                sleepTime: totalSleep,
                netTime: Math.max(0, totalSleep - 15 * penalties),
              });
            }
          });
          setSessions(list);
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
            <Text style={styles.sessionTitle}>Sleep History</Text>
            <FlatList
              data={sessions}
              contentContainerStyle={styles.listContainer}
              style={styles.list}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                alternateUI ? (
                  <View style={styles.sessionCard} >
                    <Text style={styles.sessionDate}>
                      {item.startTime.toLocaleDateString()}
                    </Text>
                    <Text style={styles.sessionTime}>
                      {item.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {item.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.sessionTotal}>
                      Total: {Math.floor(item.sleepTime / 60)} h{' '}
                      {item.sleepTime % 60} m, {' '}
                      Net: {Math.floor(item.netTime / 60)} h{' '}
                      {item.netTime % 60} m
                    </Text>
                  </View>
                ) : (<View style={styles.sessionItem}>
                  <Text style={styles.sessionText}>
                    Start Time: {item.startTime.toLocaleString()}
                  </Text>
                  <Text style={styles.sessionText}>
                    End Time: {item.endTime.toLocaleString()}
                  </Text>
                  <Text style={styles.sessionText}>
                    TotalTime: {Math.floor(item.sleepTime / 60)} hrs{' '}
                    {item.sleepTime % 60} mins
                  </Text>
                  <Text style={styles.sessionText}>
                    NetTime: {Math.floor(item.netTime / 60)} hrs{' '}
                    {item.netTime % 60} mins
                  </Text>
                </View>)
              )}
            />
          </>
        )}
      </View>
    </SafeAreaView >
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
    marginTop: 10,
    padding: 10,
  },
  sessionCard: {
    backgroundColor: COLORS.lightBackground,
    borderRadius: 12,
    padding: 15,
    paddingBottom: 4,
    marginVertical: 8,
    width: '100%',
    height: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center'
  },
  sessionDate: {
    fontSize: 16,
    marginBottom: 10,
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  sessionTime: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10
  },
  sessionTotal: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  sessionItem: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    margin: 10,
    backgroundColor: COLORS.lightBackground,
    padding: 10,
  },
  sessionText: {
    fontSize: 16,
    marginBottom: 15,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  list: {
    width: '90%', 
  },
  listContainer: {
    paddingHorizontal: 10, 
    width: '100%', 
  },
});

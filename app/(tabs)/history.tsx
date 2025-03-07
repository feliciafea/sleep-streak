import { Text, StyleSheet, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useEffect, useState } from 'react';
import { collection, getFirestore, onSnapshot, query, where } from '@react-native-firebase/firestore';
import { COLORS } from '@/constants/theme';
interface SessionHistory {
    id: string;
    startTime: number,
    endTime: number,
    sleepTime: number;
    netTime: number;
}
export default function SleepHistory() {
    // Set an initializing state whilst Firebase connects
    const [initializing, setInitializing] = useState<boolean>(true);
    const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
    const [session, setSessions] = useState<SessionHistory[]>([]);

    function onAuthStateChanged(user: FirebaseAuthTypes.User | null) {
        setUser(user);
        if (initializing) setInitializing(false);
    }

    useEffect(() => {
        const subscriber = getAuth().onAuthStateChanged(onAuthStateChanged);
        return subscriber; // unsubscribe on unmount
    }, []);

    useEffect(() => {
        if (user) {
            const db = getFirestore();

            const subscriber = onSnapshot(
                query(collection(db, "sessions"), where("userId", "==", user.uid)),
                (querySnapShot) => {
                    const list: SessionHistory[] = [];
                    querySnapShot.forEach(doc => {
                        if (!doc.data().active) {
                            list.push({
                                id: doc.id,
                                startTime: doc.data().startTime,
                                endTime: doc.data().endTime,
                                sleepTime: doc.data().endTime - doc.data().startTime,
                                netTime: doc.data().endTime - doc.data().startTime - 15 * doc.data().penalties
                            })
                        }
                    });
                    setSessions(list);
                });
            return () => subscriber();
        }
    }, []);

    if (initializing) return null;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <View style={styles.container}>
                endTime: doc.data().endTime,
                {user &&
                    <FlatList
                        data={sessions}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.sessionItem}>
                                <Text>Start Time: {new Date(item.startTime).toLocaleString()}</Text>
                                <Text>End Time: {new Date(item.endTime).toLocaleString()}</Text>
                                <Text>TotalTime: {item.totalTime}</Text>
                                <Text>NetTime: {item.netTime}</Text>
                            </View>
                        )}
                    />
                }
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
    sessionItem: {
        padding: 10,
        fontSize: 50,
        marginVertical: 10,
        fontWeight: 'bold',
        color: COLORS.accent,
    },
});

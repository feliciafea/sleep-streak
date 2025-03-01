import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useEffect, useState } from 'react';

export default function HomeScreen() {
  // Set an initializing state whilst Firebase connects
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>();

  function onAuthStateChanged(user: FirebaseAuthTypes.User | null) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = getAuth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing) return null;

  return (
    <SafeAreaView>
      <Text>Sleep</Text>
      {user && <Text>User Email: {user.email}</Text>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});

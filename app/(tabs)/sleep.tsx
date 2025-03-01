import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import { useEffect, useState } from 'react';

export default function HomeScreen() {
  const [email, setEmail] = useState('');

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      setEmail(user.email ? user.email : '');
    }
  }, []);

  return (
    <SafeAreaView>
      <Text>Sleep</Text>
      <Text>User Email: {email}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});

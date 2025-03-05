import { Text, View, StyleSheet, TextInput, Button, TouchableOpacity } from 'react-native';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
} from '@react-native-firebase/auth';
import { useState } from 'react';
import { router } from 'expo-router';
import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from '@react-native-firebase/firestore';
import { COLORS } from '@/constants/theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPass] = useState('');
  const [logInError, setLogInError] = useState('');

  const createFirestoreUser = async (userId: string) => {
    const db = getFirestore();

    // Check to see if user already exists
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists) {
      console.log('Creating user');
      await setDoc(doc(db, 'users', userId), {
        streak: 0,
      });
    }
  };

  const signIn = async () => {
    try {
      const auth = await signInWithEmailAndPassword(getAuth(), email, password);
      console.log('logged in');
      await createFirestoreUser(auth.user.uid);
      router.push({
        pathname: '/(tabs)',
      });
    } catch (e) {
      console.log(e);
      setLogInError((e as any).message);
    }
  };

  const createAccount = async () => {
    try {
      const auth = await createUserWithEmailAndPassword(
        getAuth(),
        email,
        password,
      );
      console.log('logged in');
      await createFirestoreUser(auth.user.uid);
      router.push({
        pathname: '/(tabs)',
      });
    } catch (e) {
      console.log(e);
      setLogInError((e as any).message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <MaterialCommunityIcons 
          name="moon-waning-crescent" 
          size={80} 
          color={COLORS.accent}
          style={styles.icon}
        />
        <Text style={styles.title}>SleepStreak</Text>
      </View>
      <TextInput
        value={email}
        style={styles.textInput}
        placeholder="email"
        onChangeText={(text) => setEmail(text)}
      ></TextInput>
      <TextInput
        value={password}
        secureTextEntry={true}
        style={styles.textInput}
        placeholder="password"
        onChangeText={(text) => setPass(text)}
      ></TextInput>

      <TouchableOpacity style={styles.logInButton} onPress={signIn}>
        <Text style={styles.text}>Log in</Text>
      </TouchableOpacity>
      <View style={styles.signupContainer}>
        <Text style={styles.text}>Don't have an account? </Text>
        <TouchableOpacity onPress={createAccount}>
          <Text style={[styles.text, styles.signupText]}>Sign up</Text>
        </TouchableOpacity>
      </View>
      {logInError ? <Text style={
        [styles.text, { color: COLORS.error }]
      }>{logInError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  textInput: {
    marginVertical: 4,
    height: 50,
    width: 250,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: COLORS.text,
    padding: 10,
    margin: 10,
    backgroundColor: COLORS.lightBackground,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    padding: 5,
    color: COLORS.text,
  },
  logInButton: {
    width: 250,
    height: 50,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  signupText: {
    color: COLORS.accent,
    fontWeight: '600',
    padding: 0,  
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 10,
    color: COLORS.text,
  },
  icon: {
    marginBottom: 20,
  },
  titleContainer: {
    alignItems: 'center',
    padding: 30,
  },
});

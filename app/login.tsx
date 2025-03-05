import { Text, View, StyleSheet, TextInput, Button } from 'react-native';
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
      <Text style={styles.title}>Welcome</Text>
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

      <View style={styles.buttonContainer} />
      <Button title="Log in" onPress={signIn}></Button>
      <View style={styles.buttonContainer} />
      <Text> or </Text>
      <View style={styles.buttonContainer} />
      <Button title="Sign up" onPress={createAccount}></Button>
      <View style={styles.buttonContainer} />
      {logInError ? <Text style={styles.text}>{logInError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  textInput: {
    marginVertical: 4,
    height: 50,
    width: 250,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#ffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff6d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    padding: 15,
    color: 'black',
  },
  buttonContainer: {
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';

import auth from '@react-native-firebase/auth';
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
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId:
    '402325774920-qtkbui3ekj2geoq7hoc3lq8v3if97evv.apps.googleusercontent.com',
});

export default function Login() {
  const [logInError, setLogInError] = useState('');

  const createFirestoreUser = async (userId: string, email: string) => {
    const db = getFirestore();

    // Check to see if user already exists
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists) {
      console.log('Creating user');
      await setDoc(doc(db, 'users', userId), {
        streak: 0,
        email: email,
      });
    }
  };

  const googleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const signInResult = await GoogleSignin.signIn();

      if (signInResult.data) {
        const googleCredential = auth.GoogleAuthProvider.credential(
          signInResult.data.idToken,
        );
        await auth().signInWithCredential(googleCredential);

        const userId = auth().currentUser?.uid;
        const userEmail = auth().currentUser?.email || '';
        return { userId, userEmail };
      } else {
        console.log('No sign in data');
        return null;
      }
    } catch (e) {
      console.log(e);
      setLogInError((e as any).message);
      return null;
    }
  };

  const authenticate = async () => {
    try {
      const userInfo = await googleSignIn();
      if (userInfo && userInfo.userId) {
        await createFirestoreUser(userInfo.userId, userInfo.userEmail);
        router.push({ pathname: '/(tabs)' });
      } else {
        setLogInError('Failed to get user ID');
      }
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
      <TouchableOpacity style={styles.logInButton} onPress={authenticate}>
        <View style={styles.buttonContent}>
          <MaterialCommunityIcons name="google" size={24} color={COLORS.text} />
          <Text style={[styles.text]}>Log in with Google</Text>
        </View>
      </TouchableOpacity>

      {logInError ? (
        <Text style={[styles.text, { color: COLORS.error }]}>{logInError}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

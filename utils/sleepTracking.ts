import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  FirebaseFirestoreTypes,
  getDocs,
  getDoc,
} from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { DeviceMotion } from 'expo-sensors';
import delay from './delay';

// Sleep Tracking Task that runs every 15 minutes and checks for movement
// If movement is detected, it increases the penalty by 1
TaskManager.defineTask('SLEEP_TRACKING_TASK', async () => {
  const ACC_THRESHOLD = 0.2;
  const ROT_THRESHOLD = 0.2;

  let check = 0;

  // First check for movement using DeviceMotion
  DeviceMotion.setUpdateInterval(1000);
  DeviceMotion.addListener((data) => {
    if (!data.acceleration || !data.rotationRate)
      return BackgroundFetch.BackgroundFetchResult.Failed;

    const { x, y, z } = data.acceleration;
    const { alpha, beta, gamma } = data.rotationRate;

    const totalAcceleration = Math.sqrt(x * x + y * y + z * z);
    const totalRotation = Math.sqrt(
      alpha * alpha + beta * beta + gamma * gamma,
    );

    if (totalAcceleration > ACC_THRESHOLD || totalRotation > ROT_THRESHOLD) {
      // If movement is detected, increase the penalty
      check += 1;
    }
  });

  // Wait for 5 seconds
  await delay(5000);

  // Update the penalty in AsyncStorage if check > 0
  if (check > 0) {
    const penalty = await AsyncStorage.getItem('sleepPenalty');
    if (penalty) {
      await AsyncStorage.setItem('sleepPenalty', String(Number(penalty) + 1));
    } else {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  }

  return BackgroundFetch.BackgroundFetchResult.NewData;
});

export const startSleepSession = async (
  userID: string,
): Promise<FirebaseFirestoreTypes.DocumentSnapshot | null> => {
  // Make sure they don't already have a session
  const activeSession = await getActiveSleepSession(userID);
  if (!activeSession?.empty) {
    throw new Error('User already has an active sleep session');
  }

  // Make sure user can use Device Motion and Background Fetch
  const motionPerm = await DeviceMotion.requestPermissionsAsync();
  if (motionPerm.status !== 'granted') {
    throw new Error('Motion permission not granted');
  }

  const db = getFirestore();

  // Create sleepSession document in Firestore
  const sleep = await addDoc(collection(db, 'sleepSessions'), {
    userID: userID,
    penalty: 0,
    startTime: serverTimestamp(),
    active: true,
  });

  // Save the session ID and sleepPenalty in AsyncStorage
  await AsyncStorage.setItem('sleepSessionID', sleep.id);
  await AsyncStorage.setItem('sleepPenalty', String(0));

  // Start background task that runs every 15 minutes
  await BackgroundFetch.registerTaskAsync('SLEEP_TRACKING_TASK', {
    minimumInterval: 15 * 60, // 15 minutes
    stopOnTerminate: false,
    startOnBoot: false,
  });

  return await getDoc(sleep);
};

export const stopSleepSession = async (
  userID: string,
): Promise<FirebaseFirestoreTypes.DocumentSnapshot | null> => {
  // Stop the background task
  await BackgroundFetch.unregisterTaskAsync('SLEEP_TRACKING_TASK');

  // Get the sleep session ID from AsyncStorage
  const sleepSessionID = await AsyncStorage.getItem('sleepSessionID');
  if (!sleepSessionID) {
    throw new Error('No active sleep session found');
  }

  const db = getFirestore();

  // Update the sleep session document in Firestore
  const docRef = doc(db, 'sleepSessions', sleepSessionID);
  await updateDoc(docRef, {
    endTime: serverTimestamp(),
    active: false,
  });

  // Clear the session ID and penalty from AsyncStorage
  await AsyncStorage.removeItem('sleepSessionID');
  await AsyncStorage.removeItem('sleepPenalty');

  // Return the updated document
  return await getDoc(docRef);
};

export const getActiveSleepSession = async (
  userID: string,
): Promise<FirebaseFirestoreTypes.QuerySnapshot | null> => {
  const db = getFirestore();
  return await getDocs(
    query(
      collection(db, 'sleepSessions'),
      where('userID', '==', userID),
      where('active', '==', true),
      orderBy('startTime', 'desc'),
      limit(1),
    ),
  );
};

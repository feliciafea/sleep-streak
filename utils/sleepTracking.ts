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
  console.log('Running sleep tracking task');

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

    console.log('Total Acceleration: ', totalAcceleration);
    console.log('Total Rotation: ', totalRotation);

    if (totalAcceleration > ACC_THRESHOLD || totalRotation > ROT_THRESHOLD) {
      // If movement is detected, increase the penalty
      check += 1;
    }
  });

  console.log('Waiting...');
  // Wait for 5 seconds
  await delay(5000);

  DeviceMotion.removeAllListeners();

  // Update the penalty in AsyncStorage if check > 0
  if (check > 0) {
    const penalty = await AsyncStorage.getItem('sleepPenalty');
    if (penalty) {
      await AsyncStorage.setItem('sleepPenalty', String(Number(penalty) + 1));
    } else {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  }

  console.log('Check: ', check);
  console.log('Penalty: ', await AsyncStorage.getItem('sleepPenalty'));

  console.log('Sleep tracking completed');

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
  try {
    await BackgroundFetch.unregisterTaskAsync('SLEEP_TRACKING_TASK');
  } catch {
    console.log('Error unregistering task');
  }

  const activeSession = await getActiveSleepSession(userID);
  if (!activeSession || activeSession.empty) {
    throw new Error('User does not have an active sleep session');
  }

  const db = getFirestore();
  const penalty = await AsyncStorage.getItem('sleepPenalty');

  // Update the sleep session document in Firestore
  const docRef = doc(db, 'sleepSessions', activeSession.docs[0].id);
  await updateDoc(docRef, {
    endTime: serverTimestamp(),
    active: false,
    penalty: Number(penalty),
  });

  // Clear the penalty from AsyncStorage and return the session data
  await AsyncStorage.removeItem('sleepPenalty');
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

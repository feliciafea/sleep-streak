import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import {
  startSleepSession,
  stopSleepSession,
  getActiveSleepSession,
} from '../utils/sleepTracking';
import { COLORS } from '@/constants/theme';
import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';

interface SleepTrackerProps {
  user: FirebaseAuthTypes.User;
}

const SleepTracker: React.FC<SleepTrackerProps> = ({ user }) => {
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [googleFitAuth, setGoogleFitAuth] = useState<boolean>(false);

  useEffect(() => {
    const getGoogleFitAuth = async (user: FirebaseAuthTypes.User) => {
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      setGoogleFitAuth(userDoc.data()?.googleFitAuth ?? false);
    };

    if (user) {
      getGoogleFitAuth(user);
    }
  }, [user]);

  useEffect(() => {
    // Check if there's an active sleep session when component mounts
    const checkActiveSleepSession = async () => {
      const activeSession = await getActiveSleepSession(user.uid);

      if (activeSession && !activeSession.empty) {
        setIsTracking(true);
        const sessionData = activeSession.docs[0].data();
        setSessionStart(sessionData.startTime.toDate());
      }
    };

    if (user) {
      checkActiveSleepSession();
    }
  }, [user]);

  const handleStartTracking = async () => {
    try {
      const session = await startSleepSession(user.uid);
      if (session) {
        setIsTracking(true);
        setSessionStart(session.data()?.startTime.toDate());
      }
    } catch (error) {
      console.error('Failed to start sleep tracking:', error);
    }
  };

  const handleStopTracking = async () => {
    try {
      await stopSleepSession(user.uid);
      setIsTracking(false);
      setSessionStart(null);
    } catch (error) {
      console.error('Failed to stop sleep tracking:', error);
    }
  };

  return (
    <View style={styles.container}>
      {isTracking ? (
        <View style={styles.trackingContainer}>
          <Text style={styles.trackingText}>
            Sleep tracking active since:{' '}
            {sessionStart ? sessionStart.toLocaleTimeString() : ''}
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={handleStopTracking}
          >
            <Text style={styles.buttonText}>
              {googleFitAuth
                ? 'Stop Google Fit Sleep Tracking'
                : 'Stop Sleep Tracking'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.button, styles.startButton]}
          onPress={handleStartTracking}
        >
          <Text style={styles.buttonText}>
            {googleFitAuth
              ? 'Start Google Fit Sleep Tracking'
              : 'Start Sleep Tracking'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
  },
  startButton: {
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  trackingContainer: {
    alignItems: 'center',
  },
  trackingText: {
    fontSize: 16,
    marginBottom: 15,
    color: COLORS.text,
  },
});

export default SleepTracker;

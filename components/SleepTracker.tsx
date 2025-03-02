import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import {
  startSleepSession,
  stopSleepSession,
  getActiveSleepSession,
} from '../utils/sleepTracking';

interface SleepTrackerProps {
  user: FirebaseAuthTypes.User;
}

const SleepTracker: React.FC<SleepTrackerProps> = ({ user }) => {
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);

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

  // TODO: get date from startTime
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
      <Text style={styles.title}>Sleep Tracking</Text>

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
            <Text style={styles.buttonText}>Stop Sleep Tracking</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.button, styles.startButton]}
          onPress={handleStartTracking}
        >
          <Text style={styles.buttonText}>Start Sleep Tracking</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#CCC',
    borderRadius: 10,
    marginVertical: 10,
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
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  trackingContainer: {
    alignItems: 'center',
  },
  trackingText: {
    fontSize: 16,
    marginBottom: 15,
  },
});

export default SleepTracker;

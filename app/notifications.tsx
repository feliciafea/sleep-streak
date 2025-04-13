import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  authorizeGoogleFit,
} from '../utils/sleepTracking';
import { getFirestore, doc, updateDoc, serverTimestamp, getDoc } from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';


export default function SettingsScreen() {
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  const db = getFirestore();
  const [bedTime, setBedTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const fetchBedTime = async () => {
      if (userId) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists && userDoc.data()?.bedTime) {
          setBedTime(userDoc.data()?.bedTime.toDate());
        } else {
          // Default 11:00 PM
          const defaultTime = new Date();
          defaultTime.setHours(23, 0, 0, 0); 
          setBedTime(defaultTime);
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            bedTime: defaultTime,
            updatedAt: serverTimestamp()
          });
        }
      }
    };
    fetchBedTime();
  }, [userId]);

  const onTimeChange = async (event: any, selectedTime?: Date) => {
    setShowPicker(false);
    if (selectedTime) {
      setBedTime(selectedTime);
      // Update Firebase
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          bedTime: selectedTime,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.log('Error updating bedtime:', error);
      }
    }
  };

  const handleBack = () => {
    router.push({
      pathname: '/settings',
    });
  };
   
  return (
    <SafeAreaView style={styles.container}>
       <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
      </View>
      
      <View style={styles.settingSection}>
        <Text style={styles.description}>
          Set your bedtime so that SleepStreak can remind you to maintain your streak:
        </Text>

        <TouchableOpacity 
          style={styles.timeSelector}
          onPress={() => setShowPicker(true)}
        >
          <MaterialIcons name="bed" size={24} color={COLORS.icon} />
          <Text style={styles.timeText}>
            Bedtime: {bedTime.toLocaleTimeString('en-US', { 
              hour: 'numeric',
              minute: '2-digit',
              hour12: true 
            })}
          </Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={bedTime}
            mode="time"
            is24Hour={false}
            display="spinner"
            onChange={onTimeChange}
          />
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 20,
  },
  backButton: {
    padding: 8,
  },
  settingSection: {
    width: '100%',
    padding: 20,
    marginTop: 20,
  },
  description: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBackground,
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  timeText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 16,
  },

});


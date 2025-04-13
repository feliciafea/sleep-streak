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


export default function HelpScreen() {
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  const [googleFitAuth, setGoogleFitAuth] = useState<boolean>(false);
  const db = getFirestore();

  useEffect(() => {
    const fetchGoogleFitAuth = async () => {
      if (userId) {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          const userData = userDoc.data();
          setGoogleFitAuth(userData?.googleFitAuth ?? false);
        } catch (error) {
          console.error('Error fetching Google Fit auth status:', error);
        }
      }
    };

    fetchGoogleFitAuth();
  }, [userId]);

  
  const toggleGoogleFit = async (value: boolean) => {
    try {
      if (value) {
        const auth = await authorizeGoogleFit();
        setGoogleFitAuth(auth ?? false);

        if (auth && userId) {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            googleFitAuth: true,
            updatedAt: serverTimestamp()
          });
          console.log('Updated user Google Fit auth status');
        }
      } else {
        setGoogleFitAuth(false);
        if (userId) {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            googleFitAuth: false,
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error updating Google Fit auth status:', error);
    }
  };

  const handleBack = () => {
    router.push({
      pathname: '/(tabs)',
      params: {
        googleFitAuth: googleFitAuth.toString()
      }
    });
  };
   
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.switchTitle}>Other tracking options: </Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchText}>Use Google Fit (Android Only) </Text>
          <Switch
            trackColor={{ false: COLORS.tabBar, true: COLORS.accent }}
            thumbColor={COLORS.text}
            ios_backgroundColor={COLORS.tabBar}
            onValueChange={toggleGoogleFit}
            value={googleFitAuth}
          />
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  switchText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
    paddingRight: 8,
  },
  switchTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.accent,
    paddingTop: 30,
  }
});

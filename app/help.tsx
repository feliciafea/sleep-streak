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
      
      <SafeAreaView style={styles.titleContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.icon} />
        </TouchableOpacity>
        <Text style={styles.title}>How do I use SleepStreak? </Text>
      </SafeAreaView>
      <View style={styles.listContainer}>
        <View style={styles.listItem}>
          <Text style={styles.bullet}>1.</Text>
          <Text style={styles.text}>Right before you go to bed, start a sleep session by pressing the "start sleep session" button.</Text>
        </View>
        <View style={styles.listItem}>
          <Text style={styles.bullet}>2.</Text>
          <Text style={styles.text}>During your sleep session, SleepStreak will track device movements that indicate you are not sleeping.
            If the app detects that you are not sleeping, it will penalize your sleep time by 15 minutes!
          </Text>
        </View>
        <View style={styles.listItem}>
          <Text style={styles.bullet}>3.</Text>
          <Text style={styles.text}>When you wake up, stop the sleep session to end the tracking.</Text>
        </View>
        <View style={styles.listItem}>
          <Text style={styles.bullet}>4.</Text>
          <Text style={styles.text}>The sleep streak counter updates daily, counting the number of consequtive nights you got 7+ hours of sleep!  </Text>
        </View>
      </View>
      <SafeAreaView style={styles.titleContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} >
        </TouchableOpacity>
        <Text style={styles.title}>Other tracking options: </Text>
      </SafeAreaView>
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
    titleContainer: {
      alignItems: 'flex-start',
      marginBottom: 20,
      flexDirection: 'row',
      
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: COLORS.accent,
    },
    text: {
      color: COLORS.text,
    }, 
    listContainer: {
      width: '100%',
      padding: 10
    },
    listItem: {
      flexDirection: 'row',
      marginBottom: 10,
      paddingRight: 16,
    },
    bullet: {
      color: COLORS.accent,
      marginRight: 8,
      fontWeight: 'bold',
    },
    backButton: {
      marginLeft: 0,
      marginRight: 10,
      marginVertical: 5,
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


});

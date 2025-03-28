import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  authorizeGoogleFit,
} from '../utils/sleepTracking';
import { getFirestore, doc, updateDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { useState } from 'react';


export default function HelpScreen() {
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  const [googleFitAuth, setGoogleFitAuth] = useState<boolean>(false);

  
  const authGoogleFit = async () => {
    try {
      const auth = await authorizeGoogleFit();
      setGoogleFitAuth(auth ?? false);

      if (auth && userId) {
        // Update Firestore user document
        const db = getFirestore();
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          googleFitAuth: true,
          updatedAt: serverTimestamp()
        });
        console.log('Updated user Google Fit auth status');
      }
    } catch (error) {
      console.error('Error updating Google Fit auth status:', error);
    }

  }
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
      <TouchableOpacity 
        onPress={authGoogleFit}
        style={styles.authButton}
      >
        <Text style={styles.text}>Auth sleep data</Text>
      </TouchableOpacity>
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
    authButton: {
      backgroundColor: COLORS.accent,
      padding: 10,
      borderRadius: 8,
      margin: 10,
    }


});

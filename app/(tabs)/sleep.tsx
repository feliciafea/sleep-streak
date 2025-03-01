import { useLocalSearchParams } from 'expo-router';
import { Text, View, StyleSheet, TextInput, Button } from 'react-native';
import { FIRESTORE_DB } from '../../firebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useState } from 'react';

export default function HomeScreen() {
  const db = FIRESTORE_DB;
  const [funFact, setFact] = useState('');
  const { email } = useLocalSearchParams();
  const [currentFunFact, setCurrentFunFact] = useState('');
  const [randomInfo, setRandomInfo] = useState<any>(null);

  const saveFact = async (fact: string) => {
    try {
      const docRef = await addDoc(collection(db, 'funFacts'), {
        fact: fact,
        email: email,
      });
      console.log('Document written with ID: ', docRef.id);
      setCurrentFunFact(fact);
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  };

  const getFact = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'funFacts'));
      const documents = querySnapshot.docs;
      if (documents.length > 0) {
        const randomIndex = Math.floor(Math.random() * documents.length);
        console.log('Document data:', documents[randomIndex].data());
        setRandomInfo(documents[randomIndex].data());
      }
    } catch (e) {
      console.error('Error getting documents: ', e);
    }
  };

  return (
    <SafeAreaView>
      <Text>Sleep</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create();

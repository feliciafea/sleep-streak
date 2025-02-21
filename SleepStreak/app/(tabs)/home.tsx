import { useLocalSearchParams } from 'expo-router';
import { Text, View, StyleSheet, TextInput, Button } from 'react-native';
import { FIRESTORE_DB } from "../../firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore"; 
import { useState } from 'react';


export default function HomeScreen() {
  const db = FIRESTORE_DB;
  const [funFact, setFact] = useState("");
  const { email } = useLocalSearchParams();
  const [currentFunFact, setCurrentFunFact] = useState('');
  const [randomInfo, setRandomInfo] = useState<any>(null);

  const saveFact = async (fact: string) => {
    try {
      const docRef = await addDoc(collection(db, "funFacts"), {
        fact: fact,
        email: email,
      });
      console.log("Document written with ID: ", docRef.id);
      setCurrentFunFact(fact);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
  
  const getFact = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "funFacts"));
      const documents = querySnapshot.docs;
      if (documents.length > 0) {
        const randomIndex = Math.floor(Math.random() * documents.length);  
        console.log("Document data:", documents[randomIndex].data());
        setRandomInfo(documents[randomIndex].data());
      }
    } catch (e) {
      console.error("Error getting documents: ", e);
    }
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.text}>Signed in with email {email}</Text>
      </View>

      <Text style={styles.text}>{currentFunFact ? `Entered fact: ${currentFunFact}` : "Enter a information!"}</Text>  
      <TextInput value={funFact} style={styles.textInput} onChangeText={(text) => setFact(text)}></TextInput>
      <View  style={styles.butttonContainer} />
        <Button title="Save" onPress={() => saveFact(funFact)}></Button>
      <View  style={styles.butttonContainer} />
      <Text style={styles.text}>{randomInfo ? `${randomInfo.email} entered fact: ${randomInfo.fact}` : "Retrieve from database"}</Text>  
      <View  style={styles.butttonContainer} />
        <Button title="Get" onPress={() => getFact()}></Button>
      <View  style={styles.butttonContainer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff6d4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'black',
    fontSize: 15,
    paddingHorizontal: 25,
    padding: 10,
    textAlign: 'center',
  },
  textInput: {
    marginVertical: 4,
    height: 50,
    width: 250,
    borderWidth : 1,
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#ffff'
    
  },
  butttonContainer: {
    paddingBottom: 10,
  },
  titleContainer: {
    paddingBottom: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingBottom: 20,
  },
});

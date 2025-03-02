import { Text, View, StyleSheet, TextInput, Button } from 'react-native';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
} from '@react-native-firebase/auth';
import { useState } from 'react';
import { router } from 'expo-router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPass] = useState('');
  const [logInError, setLogInError] = useState('');

  const signIn = () => {
    signInWithEmailAndPassword(getAuth(), email, password)
      .then(() => {
        console.log('logged in');
        router.push({
          pathname: '/(tabs)',
          params: { email: email },
        });
      })
      .catch((error) => {
        console.log(error);
        setLogInError(error.message);
      });
  };

  const createAccount = () => {
    createUserWithEmailAndPassword(getAuth(), email, password)
      .then(() => {
        console.log('signed in');
        router.push({
          pathname: '/(tabs)',
          params: { email: email },
        });
      })
      .catch((error) => {
        console.log(error);
        setLogInError(error.message);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <TextInput
        value={email}
        style={styles.textInput}
        placeholder="email"
        onChangeText={(text) => setEmail(text)}
      ></TextInput>
      <TextInput
        value={password}
        secureTextEntry={true}
        style={styles.textInput}
        placeholder="password"
        onChangeText={(text) => setPass(text)}
      ></TextInput>

      <View style={styles.buttonContainer} />
      <Button title="Log in" onPress={signIn}></Button>
      <View style={styles.buttonContainer} />
      <Text> or </Text>
      <View style={styles.buttonContainer} />
      <Button title="Sign up" onPress={createAccount}></Button>
      <View style={styles.buttonContainer} />
      {logInError ? <Text style={styles.text}>{logInError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  textInput: {
    marginVertical: 4,
    height: 50,
    width: 250,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#ffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff6d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    padding: 15,
    color: 'black',
  },
  buttonContainer: {
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

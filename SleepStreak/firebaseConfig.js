import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";

// Optionally import the services that you want to use
// import {...} from 'firebase/auth';
// import {...} from 'firebase/database';
// import {...} from 'firebase/firestore';
// import {...} from 'firebase/functions';
// import {...} from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC-fG0mzZT8h4DRUIFljK6CJexX9sVaTt0",
  authDomain: "sleep-streak-ecbcc.firebaseapp.com",
  projectId: "sleep-streak-ecbcc",
  storageBucket: "sleep-streak-ecbcc.firebasestorage.app",
  messagingSenderId: "402325774920",
  appId: "1:402325774920:web:2711cbe22eb36890f7ee7d",
  measurementId: "G-Y0V6WSB7FJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const FIREBASE_AUTH = getAuth(app);
export const FIRESTORE_DB = getFirestore(app);

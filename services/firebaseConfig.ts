
// Fix: Use standard modular imports for Firebase initialization
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyCaFpKeQuZszdWRL1Y7pt5PYepGnc6Qo1E",
  authDomain: "react-chat-app-b3937.firebaseapp.com",
  projectId: "react-chat-app-b3937",
  storageBucket: "react-chat-app-b3937.firebasestorage.app",
  messagingSenderId: "902063613038",
  appId: "1:902063613038:web:2d05d4bf8238912093b27f",
  measurementId: "G-0EPVZ2P30R"
};

// Initialize Firebase services using the standard modular approach
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

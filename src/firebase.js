// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBqcvCOgNg_I7eXYGregJR63dMW0Ol7yTs",
  authDomain: "fit-track-6baa1.firebaseapp.com",
  projectId: "fit-track-6baa1",
  storageBucket: "fit-track-6baa1.firebasestorage.app",
  messagingSenderId: "127123716921",
  appId: "1:127123716921:web:145117928ad749356f06e8",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export Firestore
export const db = getFirestore(app);

// ✅ Export Auth
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

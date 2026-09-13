import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingFirebaseKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const firebaseSetupError =
  missingFirebaseKeys.length > 0
    ? `Missing Firebase environment values: ${missingFirebaseKeys.join(", ")}. Copy .env.example to .env and fill in your Firebase project settings.`
    : "";

const app = firebaseSetupError ? null : initializeApp(firebaseConfig);

export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;
export const provider = app ? new GoogleAuthProvider() : null;
provider?.setCustomParameters({ prompt: 'select_account' });

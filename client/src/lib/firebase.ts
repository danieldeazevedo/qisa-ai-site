import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, getRedirectResult, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase config is valid
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.error("Firebase configuration is incomplete:", firebaseConfig);
}

let app: any;
let auth: Auth | null = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
  // Firebase authentication is not available
  auth = null;
}

export { auth };

const provider = new GoogleAuthProvider();

export function signInWithGoogle() {
  if (!auth) {
    throw new Error("Firebase authentication is not properly configured");
  }
  return signInWithRedirect(auth, provider);
}

export function handleRedirectResult() {
  if (!auth) {
    return Promise.resolve(null);
  }
  return getRedirectResult(auth);
}

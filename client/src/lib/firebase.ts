import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, getRedirectResult, type Auth } from "firebase/auth";

// Check if Firebase credentials are available
const hasFirebaseConfig = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_APP_ID
);

let auth: Auth | null = null;

if (hasFirebaseConfig) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
    auth = null;
  }
}

export { auth, hasFirebaseConfig };

const provider = new GoogleAuthProvider();

export function signInWithGoogle() {
  if (!auth) {
    throw new Error('Firebase não está configurado. Verifique as credenciais do Firebase.');
  }
  return signInWithRedirect(auth, provider);
}

export function handleRedirectResult() {
  if (!auth) {
    return Promise.resolve(null);
  }
  return getRedirectResult(auth);
}

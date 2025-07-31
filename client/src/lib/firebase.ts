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
    console.log('Initializing Firebase with config...');
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    console.log('Firebase config project ID:', firebaseConfig.projectId);
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    auth = null;
  }
} else {
  console.warn('Firebase config missing. Available env vars:', {
    apiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
    projectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: !!import.meta.env.VITE_FIREBASE_APP_ID
  });
}

export { auth, hasFirebaseConfig };

const provider = new GoogleAuthProvider();

export function signInWithGoogle() {
  if (!auth) {
    console.error('Firebase auth not available');
    throw new Error('Firebase não está configurado. Verifique as credenciais do Firebase.');
  }
  console.log('Starting Google sign in...');
  return signInWithRedirect(auth, provider);
}

export function handleRedirectResult() {
  if (!auth) {
    return Promise.resolve(null);
  }
  return getRedirectResult(auth);
}

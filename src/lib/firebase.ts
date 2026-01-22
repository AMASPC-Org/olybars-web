import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
console.log(`[OlyBars] Firebase Initialized for Project: ${firebaseConfig.projectId}`);

// Initialize the Shared Network Backend
const app = initializeApp(firebaseConfig);

// Export the services so the rest of the app can use them
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const functions = getFunctions(app, 'us-west1');
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// --- EMULATOR WIRING ---
// If we are on localhost, connect to the local emulators instead of the cloud.
// --- EMULATOR WIRING ---
// If we are on localhost, connect to the local emulators instead of the cloud.
if (typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
  import.meta.env.VITE_USE_EMULATORS === 'true'
) {
  console.log('🔧 Connecting to Local Firebase Emulators...');

  // Connect Firestore (Database)
  connectFirestoreEmulator(db, 'localhost', 8080);

  // Connect Auth (Login)
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });

  // Connect Functions (Backend Logic)
  connectFunctionsEmulator(functions, 'localhost', 5001);

  // Enable a dummy App Check token so local requests don't get blocked
  // @ts-ignore
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  console.log('🛡️ [AppCheck] Local Debug Token Enabled');
} else {
  // --- PRODUCTION APP CHECK ---
  // Only run standard App Check in production/staging
  if (typeof window !== 'undefined') {
    const siteKey = import.meta.env.VITE_APP_CHECK_KEY;
    if (siteKey && !siteKey.includes('PLACEHOLDER')) {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true
      });
    }
  }
}


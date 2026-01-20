import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (function () {
    console.warn('⚠️ [FIREBASE] Missing VITE_FIREBASE_API_KEY. Auth will fail.');
    return "MISSING_API_KEY";
  })(),
  authDomain: "ama-ecosystem-prod.firebaseapp.com",
  projectId: "ama-ecosystem-prod",
  storageBucket: "ama-ecosystem-prod.firebasestorage.app",
  messagingSenderId: "26629455103",
  appId: "1:26629455103:web:987d7a42b4dd82a38720ca"
};

// Initialize the Shared Network Backend
const app = initializeApp(firebaseConfig);

// Export the services so the rest of the app can use them
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const functions = getFunctions(app, 'us-west1');

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


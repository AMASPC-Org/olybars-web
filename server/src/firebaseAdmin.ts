import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

import type * as AdminTypes from 'firebase-admin';

import { config } from './appConfig/config.js';

// Safety Switch: Ensure we don't accidentally target Production from Local
const isCloudIntention = process.argv.includes('--cloud') || process.argv.includes('--force-prod') || process.env.DEV_USE_CLOUD === 'true';

if (isCloudIntention) {
    delete process.env.FIRESTORE_EMULATOR_HOST;
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    console.log('☁️ FORCE-PROD: Explicitly targeting Remote Firestore (Emulator Env Vars Cleared)');
}

if (process.env.NODE_ENV === 'development' && !process.env.FIRESTORE_EMULATOR_HOST && !isCloudIntention) {
    // If no emulator host is set and we're not explicitly intending for cloud, 
    // we default to allowing cloud in dev if emulators aren't defined, 
    // but we log a warning for clarity.
    console.log('📡 [INFO] No Emulator Host detected. Defaulting to Cloud Firestore for Development.');
}

// Initialize Firebase Admin with data-driven projectId from validated config
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: config.GOOGLE_CLOUD_PROJECT
    });
}

export const db = admin.firestore() as AdminTypes.firestore.Firestore;
export const auth = admin.auth() as AdminTypes.auth.Auth;
export const appCheck = admin.appCheck() as AdminTypes.appCheck.AppCheck;
export const storage = admin.storage() as AdminTypes.storage.Storage;

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const admin = require("firebase-admin");

import type * as AdminTypes from "firebase-admin";

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { config } from "./appConfig/config.js";

// Safety Switch: Ensure we don't accidentally target Production from Local
const isCloudIntention =
  process.argv.includes("--cloud") ||
  process.argv.includes("--force-prod") ||
  process.env.DEV_USE_CLOUD === "true";

if (isCloudIntention) {
  delete process.env.FIRESTORE_EMULATOR_HOST;
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  console.log(
    "☁️ FORCE-PROD: Explicitly targeting Remote Firestore (Emulator Env Vars Cleared)",
  );
}

if (
  process.env.NODE_ENV === "development" &&
  !process.env.FIRESTORE_EMULATOR_HOST &&
  !isCloudIntention
) {
  // If no emulator host is set and we're not explicitly intending for cloud,
  // we default to allowing cloud in dev if emulators aren't defined,
  // but we log a warning for clarity.
  console.log(
    "📡 [INFO] No Emulator Host detected. Defaulting to Cloud Firestore for Development.",
  );
}

// Initialize Firebase Admin with data-driven projectId from validated config
if (!admin.apps.length) {
  const serviceAccountPath = path.resolve(
    __dirname,
    "../../functions/src/config/service-account.json",
  );

  // Check for the double .json extension first as seen in file listing

  // However, applicationDefault() might try to find a file relative to env var if set.
  // Ideally for ADC in Cloud Run we just don't provide a 'credential' field at all, or use applicationDefault().
  // But admin.initializeApp({ projectId }) without credential usually works for ADC.

  if (fs.existsSync(serviceAccountPath)) {
    console.log(
      `🔌 [AUTH] Dual Mode: Loaded Local Credentials from ${serviceAccountPath}`,
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      projectId: config.GOOGLE_CLOUD_PROJECT,
    });
  } else {
    console.log(
      `☁️ [AUTH] Dual Mode: Using Google Default Credentials (ADC) for ${config.GOOGLE_CLOUD_PROJECT}`,
    );
    admin.initializeApp({
      projectId: config.GOOGLE_CLOUD_PROJECT,
    });
  }
}

export const db = admin.firestore() as AdminTypes.firestore.Firestore;
export const auth = admin.auth() as AdminTypes.auth.Auth;
export const appCheck = admin.appCheck() as AdminTypes.appCheck.AppCheck;
export const storage = admin.storage() as AdminTypes.storage.Storage;

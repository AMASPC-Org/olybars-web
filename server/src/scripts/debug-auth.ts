
import { auth, db } from "../firebaseAdmin.js";
import { config } from "../appConfig/config.js";
import fetch from "node-fetch";

async function debugAuth() {
  console.log("🔍 [DEBUG-AUTH] Starting Auth Diagnostics...");
  console.log(`Config Project ID: ${config.GOOGLE_CLOUD_PROJECT}`);
  console.log(`Emulator Host: ${process.env.FIREBASE_AUTH_EMULATOR_HOST || "NOT SET"}`);

  const testUid = "test-user-" + Date.now();
  console.log(`\n1. Minting Custom Token for UID: ${testUid}...`);

  try {
    const customToken = await auth.createCustomToken(testUid, { role: "admin" });
    console.log("✅ Custom Token created.");

    // Exchange for ID Token using Emulator REST API
    const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || "localhost:9099";
    const exchangeUrl = `http://${authHost}/www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken?key=fake-api-key`;

    console.log(`\n2. Exchanging for ID Token via ${exchangeUrl}...`);
    const response = await fetch(exchangeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: customToken,
        returnSecureToken: true
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to exchange token: ${response.status} ${text}`);
    }

    const data = await response.json();
    const idToken = data.idToken;
    console.log("✅ ID Token obtained.");

    console.log("\n3. Verifying ID Token with Admin SDK...");
    const decoded = await auth.verifyIdToken(idToken);
    console.log("✅ Verification Successful!");
    console.log("Decoded Token:", decoded);

    console.log("\n4. Testing Audience Check Logic...");
    const isEmulator = !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
    if (!isEmulator && decoded.aud !== config.GOOGLE_CLOUD_PROJECT) {
      console.error(`❌ Project ID Mismatch would occur! Token aud: ${decoded.aud}, Config: ${config.GOOGLE_CLOUD_PROJECT}`);
    } else {
      console.log(`✅ Audience Check Passed (isEmulator=${isEmulator}, aud=${decoded.aud}, config=${config.GOOGLE_CLOUD_PROJECT})`);
    }

  } catch (error: any) {
    console.error("❌ DIAGNOSTIC FAILED:", error);
    process.exit(1);
  }
}

debugAuth();

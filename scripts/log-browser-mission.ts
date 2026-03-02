import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    projectId: 'ama-event-scraper'
  });
}

const db = getFirestore();

async function logSuccess() {
  const logData = {
    mission: "Newsletter Signup Verification",
    target: "Thurston County Food Bank",
    email: "ryan@amaspc.com",
    status: "SUCCESS",
    timestamp: new Date().toISOString(),
    vibe_config_verified: true,
    confirmation_screenshot: "C:\\Users\\USER1\\.gemini\\antigravity\\brain\\e8864b77-71b0-4ff1-b752-fe1065d0d968\\confirmation_message_1770550796912.png",
    recording: "C:\\Users\\USER1\\.gemini\\antigravity\\brain\\e8864b77-71b0-4ff1-b752-fe1065d0d968\\food_bank_signup_1770550761749.webp"
  };

  const docRef = await db.collection('system_logs').add(logData);
  console.log(`Document written with ID: ${docRef.id}`);
}

logSuccess().catch(console.error);

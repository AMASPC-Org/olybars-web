import { db } from '../server/src/firebaseAdmin.js';

async function verifyBotLogs() {
  console.log('--- AUDITING BOT ACCESS LOGS ---');
  try {
    const snapshot = await db.collection('ai_access_logs')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();

    if (snapshot.empty) {
      console.log('[AUDIT] FAILURE: No logs found in ai_access_logs.');
      process.exit(1);
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`[LOG] ID: ${doc.id}`);
      console.log(` - IP: ${data.ip}`);
      console.log(` - Status: ${data.status}`);
      console.log(` - UA: ${data.userAgent}`);
      const ts = data.timestamp?.toDate ? data.timestamp.toDate() : (data.timestamp ? new Date(data.timestamp) : new Date());
      console.log(` - Timestamp: ${ts.toISOString()}`);

      if (data.status === 'AI_BOT_DETECTED' && data.userAgent?.includes('GPTBot')) {
        console.log('[AUDIT] SUCCESS: Found recent GPTBot detection log with metadata.');
      }
    });
  } catch (error: any) {
    console.error('[AUDIT] ERROR:', error.message);
    process.exit(1);
  }
}

verifyBotLogs();

import { db } from '../server/src/firebaseAdmin'; // Reusing existing admin instance
// note: using Admin SDK methods, so no modular imports needed from 'firebase/firestore'

async function verifyVibe() {
  console.log('🔍 Initiating Vibe Check...');

  try {
    // 1. Find a Gushing Venue
    // Admin SDK uses chaining, not modular functions
    const venuesRef = db.collection('venues');
    const snapshot = await venuesRef.where('status', '==', 'gushing').limit(1).get();

    if (snapshot.empty) {
      console.warn('⚠️ No "gushing" venues found in DB. Cannot verify UI state.');
      process.exit(0);
    }

    const doc = snapshot.docs[0];
    const venue = doc.data();
    const venueId = doc.id;
    const venueName = venue.name || 'Unknown Venue';
    const targetUrl = `http://localhost:3000/bars/${venueId}`;

    console.log(`✅ Found Target: ${venueName} (${venueId})`);
    console.log(`🎯 Target URL: ${targetUrl}`);
    console.log(`Expected Visuals: .marker-gold, .animate-pulse`);

    // 2. Output Instructions for Agent
    console.log('\n--- AGENT INSTRUCTIONS ---');
    console.log(`1. Call open_browser("${targetUrl}")`);
    console.log('2. Verify element ".marker-gold" exists');
    console.log('3. Verify element ".animate-pulse" exists');
    console.log('--------------------------');

  } catch (error) {
    console.error('❌ Verification Failed:', error);
    process.exit(1);
  }
}

verifyVibe();

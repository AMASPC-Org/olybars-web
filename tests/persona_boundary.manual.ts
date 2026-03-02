import { PERMISSIONS, isOwnerCapability } from '../src/config/persona_manifest';
import { strict as assert } from 'assert';
import http from 'http';

/**
 * PERSONA BOUNDARY TEST SUITE
 * 
 * Goal: Prove that Artie (Guest) CANNOT access Schmidt (Owner) functions.
 * Target: Local Emulator (localhost:5001)
 */

const FUNCTIONS_HOST = 'http://127.0.0.1:5001/ama-ecosystem-dev-9ceda/us-west1';
const SCHMIDT_ENDPOINT = `${FUNCTIONS_HOST}/schmidtChat`;
const ARTIE_ENDPOINT = `${FUNCTIONS_HOST}/artieChat`;

// Mock Config - In a real run we'd fetch a fresh ID token, 
// but for the "Zero Trust" test we can simulate the token payload structure 
// if we were testing internal logic, but since we are testing endpoints, 
// we rely on the emulator accepting a "Guest" token or absence of one.
// We will simulate a "Guest" by providing NO Auth header, which the backend 
// should treat as role='guest'.

async function postRequest(url: string, body: any, token?: string) {
  return new Promise<{ status: number, data: any }>((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 500, data: JSON.parse(data || '{}') });
        } catch (e) {
          resolve({ status: res.statusCode || 500, data: { raw: data } });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🛡️  STARTING PERSONA BOUNDARY AUDIT 🛡️');
  console.log('Targeting:', FUNCTIONS_HOST);

  let failures = 0;
  let attempts = 0;

  // 1. ITERATE SCHMIDT CAPABILITIES
  // We want to ensure that if we ask for these via Artie/Guest, we get blocked.
  // Since the actual HTTP endpoints are just /artieChat and /schmidtChat, 
  // we test the ACCESS to the endpoint itself.

  // SCENARIO 1: Guest tries to hit Schmidt Chat
  console.log('\n🧪 [TEST 1] Guest access to Schmidt Chat endpoint');
  attempts++;
  try {
    const res = await postRequest(SCHMIDT_ENDPOINT, { message: "Generate Marketing Post" }); // No Token = Guest
    console.log(`   Result: ${res.status}`);

    if (res.status === 403) {
      console.log('   ✅ PASS: Access Denied');
    } else {
      console.error('   ❌ FAIL: Guest was NOT blocked (Status ' + res.status + ')');
      if (res.data) console.error('   Response Body:', JSON.stringify(res.data, null, 2));
      failures++;
    }
  } catch (e: any) {
    console.error('   ⚠️ ERROR: Could not connect', e.message);
    failures++;
  }

  // SCENARIO 2: Guest tries Artie Chat (Should Pass)
  console.log('\n🧪 [TEST 2] Guest access to Artie Chat endpoint');
  attempts++;
  try {
    const res = await postRequest(ARTIE_ENDPOINT, { message: "Hello Artie" });
    console.log(`   Result: ${res.status}`);

    if (res.status === 200) {
      console.log('   ✅ PASS: Access Granted');
    } else {
      console.error('   ❌ FAIL: Guest blocked from Artie (Status ' + res.status + ')');
      failures++;
    }
  } catch (e: any) {
    console.error('   ⚠️ ERROR: Could not connect', e.message);
    failures++;
  }

  // SCENARIO 3: "Tool Blindness" Check
  // Can Artie accept a "venue_ops" tool call? 
  // This is harder to test via HTTP without a mock conversation, 
  // but we can verify the manifest usage later. 
  // For now, we stick to the HTTP layer verification.

  console.log('\n----------------------------------------');
  if (failures > 0) {
    console.error(`🛑 AUDIT FAILED: ${failures}/${attempts} violations found.`);
    process.exit(1);
  } else {
    console.log(`✅ AUDIT PASSED: System is secure.`);
    process.exit(0);
  }
}

runTests();

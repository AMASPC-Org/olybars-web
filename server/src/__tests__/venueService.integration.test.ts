import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { clockIn } from '../venueService.js';
import { db } from '../firebaseAdmin.js';
import { Venue } from '../../src/types.js';

// Force Cloud Mode for this test suite
process.env.DEV_USE_CLOUD = 'true';

describe('INTEGRATION: venueService (Live Cloud)', () => {
  const TEST_VENUE_ID = 'integration-test-venue-' + Date.now();
  const TEST_USER_ID = 'integration-test-user-' + Date.now();

  // Downtown Olympia Coords
  const VENUE_LAT = 47.0454;
  const VENUE_LNG = -122.8959;

  beforeAll(async () => {
    console.log(`Creating Test Venue: ${TEST_VENUE_ID}`);
    // Create a real venue in Firestore
    const testVenue: Partial<Venue> = {
      id: TEST_VENUE_ID,
      name: 'Integration Test Bar',
      location: { lat: VENUE_LAT, lng: VENUE_LNG, address: 'Test Address' },
      ownerId: 'some-other-owner',
      isActive: true,
      status: 'mellow',
      capacity: 100,
      isLocalMaker: false
    };

    await db.collection('venues').doc(TEST_VENUE_ID).set(testVenue);

    // Ensure no signals exist for this user/venue (idempotency)
    const signals = await db.collection('signals')
      .where('userId', '==', TEST_USER_ID)
      .get();

    const batch = db.batch();
    signals.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  });

  afterAll(async () => {
    console.log(`Cleaning up Test Resources...`);
    // Delete Venue
    await db.collection('venues').doc(TEST_VENUE_ID).delete();

    // Delete Signals
    const signals = await db.collection('signals')
      .where('userId', '==', TEST_USER_ID)
      .get();
    const batch = db.batch();
    signals.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  });

  it('should successfully clock in when within geofence', async () => {
    // Act: User at same location
    const result = await clockIn(TEST_VENUE_ID, TEST_USER_ID, VENUE_LAT, VENUE_LNG, 'gps');

    // Assert
    expect(result.success).toBe(true);
    expect(result.pointsAwarded).toBeGreaterThan(0);
    expect(result.message).toContain('Clocked in');

    // Verify Persistence in Firestore
    const signals = await db.collection('signals')
      .where('userId', '==', TEST_USER_ID)
      .where('venueId', '==', TEST_VENUE_ID)
      .where('type', '==', 'clock_in')
      .get();

    expect(signals.empty).toBe(false);
    expect(signals.docs[0].data().verificationMethod).toBe('gps');
  });

  it('should fail when user is outside geofence', async () => {
    // Act: User at Null Island (0,0)
    await expect(
      clockIn(TEST_VENUE_ID, TEST_USER_ID, 0, 0, 'gps')
    ).rejects.toThrow(/Too far away/);
  });
}, 30000); // 30s timeout for network ops


import { describe, it, expect, beforeAll } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';
import { fetchVenues } from '../venueService';

// Load Staging/Dev Environment
dotenv.config({ path: path.resolve(process.cwd(), '.env.staging') });

describe('VenueService Integration (Live Data)', () => {

  beforeAll(() => {
    // Enforce staging environment
    if (!process.env.VITE_FIREBASE_PROJECT_ID) {
      throw new Error("Missing VITE_FIREBASE_PROJECT_ID. Ensure .env.staging is loaded.");
    }
    // Polyfill for Server Config
    process.env.GOOGLE_CLOUD_PROJECT = process.env.VITE_FIREBASE_PROJECT_ID;
    process.env.DEV_USE_CLOUD = "true"; // Force firebaseAdmin to use cloud

    console.log(`[Integration] Testing against Project: ${process.env.GOOGLE_CLOUD_PROJECT}`);
  });

  it('should fetch > 0 venues from live backend', async () => {
    const venues = await fetchVenues(true); // Brief mode

    console.log(`[Integration] Fetch Result: ${venues.length} venues found.`);
    if (venues.length > 0) {
      console.log(`[Integration] Sample Venue: ${JSON.stringify(venues[0].id)}`);
    }

    expect(Array.isArray(venues)).toBe(true);
    expect(venues.length).toBeGreaterThan(0);

    // Schema Check
    const firstVenue = venues[0];
    expect(firstVenue).toHaveProperty('id');
    expect(firstVenue).toHaveProperty('name');
  }, 20000); // 20s timeout for cloud latency

  it('should complete within Performance Budget (<10s)', async () => {
    const start = Date.now();
    await fetchVenues(true);
    const duration = Date.now() - start;
    console.log(`[Performance] fetchVenues took ${duration}ms`);
    expect(duration).toBeLessThan(10000);
  });
});

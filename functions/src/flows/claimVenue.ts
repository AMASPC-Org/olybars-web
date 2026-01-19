import { onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { getVenueDetails } from '../services/googlePlaces';

// Initialize admin if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const ClaimInput = z.object({
    placeId: z.string(), // Selected Google Place ID
    claimerUserId: z.string()
});

export const claimVenueFlow = onCall(
    {
        cors: true,
        secrets: ["GOOGLE_API_KEY", "GOOGLE_MAPS_API_KEY"],
        region: 'us-west1'
    },
    async (request) => {
        // 0. AUTH & SECURITY: Verify claimer matches auth user
        if (!request.auth) throw new Error("Unauthorized: You must be signed in to claim a venue.");

        const input = ClaimInput.parse(request.data);

        if (input.claimerUserId !== request.auth.uid) {
            throw new Error("Security Violation: Claimer ID mismatch.");
        }

        const db = admin.firestore();

        // 1. HYDRATE: Get details from Google
        const googleData = await getVenueDetails(input.placeId);
        if (!googleData) throw new Error("Could not fetch details for this venue from Google.");

        // 2. SEARCH FOR EXISTING: Prevent duplicates
        const existingSnap = await db.collection('venues').where('googlePlaceId', '==', input.placeId).get();
        if (!existingSnap.empty) {
            throw new Error("This venue has already been claimed or added to the system.");
        }

        // 3. CREATE RECORD
        const venueId = `venue_${input.placeId}`; // Deterministic ID
        const venueData = {
            id: venueId,
            ownerId: input.claimerUserId,
            name: googleData.name,
            address: googleData.address,
            website: googleData.website || '',
            description: googleData.description || '',
            googlePlaceId: googleData.googlePlaceId,
            googlePlacePhotos: googleData.photos,
            venueType: (googleData.types.includes('bar') ? 'Bar' : 'Restaurant') as any, // Simple mapping
            status: {
                vibe: 'chill',
                volume: 50,
                last_updated: Date.now()
            },
            partnerConfig: {
                tier: 'basic',
                isActive: true
            },
            createdAt: new Date().toISOString()
        };

        await db.collection('venues').doc(venueId).set(venueData);

        // Initial Brand Audit is handled by extractBrandDnaFlow which the UI will call next
        // to provide the user with a preview before finalizing.

        return {
            success: true,
            venueId,
            data: googleData,
            message: "Venue successfully staged for audit."
        };
    }
);

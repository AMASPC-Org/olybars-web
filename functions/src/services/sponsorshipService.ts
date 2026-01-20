import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

const db = admin.firestore();

export const reserveSponsorshipPackage = onCall({ region: 'us-west1' }, async (request) => {
    // 1. Auth Check
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { eventId, packageId, makerId } = request.data;
    const userId = request.auth.uid;

    if (!eventId || !packageId || !makerId) {
        throw new HttpsError('invalid-argument', 'Missing metadata.');
    }

    // 2. Permission Check: Can this user act on behalf of the Maker?
    const makerRef = db.collection('makers').doc(makerId);

    // We fetch checks outside transaction to reduce contention, 
    // though strict correction might want it inside. 
    // Maker ownership unlikely to change rapidly properly implies outside is OK.
    const makerDoc = await makerRef.get();

    if (!makerDoc.exists) {
        throw new HttpsError('not-found', 'Maker profile not found.');
    }

    const makerData = makerDoc.data();
    if (makerData?.ownerId !== userId) {
        // Allow Super Admin override check
        // For now, strict owner check.
        // If needed, fetch user role. 
        // Assuming claims are on request.auth.token for efficiency
        const token = request.auth.token;
        if (token.role !== 'super-admin' && token.role !== 'admin') {
            throw new HttpsError('permission-denied', 'You do not own this Maker profile.');
        }
    }

    // 3. Transaction
    const eventRef = db.collection('events').doc(eventId);

    try {
        await db.runTransaction(async (transaction) => {
            const eventDoc = await transaction.get(eventRef);
            if (!eventDoc.exists) {
                throw new HttpsError('not-found', 'Event not found.');
            }

            const eventData = eventDoc.data();
            const packages = eventData?.sponsorshipPackages || [];
            const pkgIndex = packages.findIndex((p: any) => p.id === packageId);

            if (pkgIndex === -1) {
                throw new HttpsError('not-found', 'Sponsorship package not found on this event.');
            }

            const pkg = packages[pkgIndex];

            if (pkg.status !== 'available') {
                throw new HttpsError('failed-precondition', `Package is already ${pkg.status}.`);
            }

            // Lock it!
            pkg.status = 'reserved';
            pkg.sponsorId = makerId;
            pkg.reservedAt = Date.now();
            pkg.reservedByUserId = userId;

            transaction.update(eventRef, {
                sponsorshipPackages: packages,
                sponsorIds: admin.firestore.FieldValue.arrayUnion(makerId)
            });
        });

        logger.info(`[Sponsorship] Reserved package ${packageId} for maker ${makerId} on event ${eventId}`);
        return { success: true, message: 'Reservation confirmed.' };

    } catch (e: any) {
        logger.error(`[Sponsorship] Transaction failed`, e);
        if (e instanceof HttpsError) throw e;
        throw new HttpsError('internal', e.message || 'Transaction failed');
    }
});

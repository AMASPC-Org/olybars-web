import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { AppEvent } from '../../../types/event';

/**
 * Fetches events that overlap with the given time window.
 * Overlap Logic: Event A overlaps B if (A.start < B.end) AND (A.end > B.start).
 */
export const getOverlappingEvents = async (venueId: string, startTime: number, endTime: number): Promise<AppEvent[]> => {
    const eventsRef = collection(db, 'events');
    // Optimization: We define a query window.
    // We want events that start BEFORE our end time.
    // And end AFTER our start time.

    // Firestore Index requirement: venueId ASC, startTime ASC
    const q = query(
        eventsRef,
        where('venueId', '==', venueId),
        where('startTime', '<', endTime),
        // We can't easily filter by endTime > startTime in the same query with inequality on different fields efficiently without composite index.
        // So we filter the 'tail' in memory.
    );

    const snapshot = await getDocs(q);
    const candidates = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as AppEvent))
        .filter(event => event.status !== 'cancelled');

    // Filter for actual overlap
    return candidates.filter(event => event.endTime > startTime);
};

/**
 * Checks if a specific asset is available for the given time window.
 * Returns the usage count and remaining availability.
 */
export const checkAssetAvailability = async (
    venueId: string,
    assetId: string,
    totalQuantity: number,
    startTime: number,
    endTime: number,
    excludeEventId?: string
): Promise<{ available: boolean; used: number; remaining: number }> => {

    // -1 denotes infinite/digital assets that don't run out (optional convention)
    if (totalQuantity === -1) return { available: true, used: 0, remaining: 9999 };

    const overlappingEvents = await getOverlappingEvents(venueId, startTime, endTime);

    let usedCount = 0;

    for (const event of overlappingEvents) {
        if (excludeEventId && event.id === excludeEventId) continue;

        if (event.sponsorshipPackages) {
            for (const pkg of event.sponsorshipPackages) {
                // If a package is defined, it consumes the inventory.
                // We count it regardless of status (available/reserved/sold) 
                // because we can't double-list the same physical item.
                const item = pkg.items.find(i => i.assetId === assetId);
                if (item) {
                    usedCount += item.count;
                }
            }
        }
    }

    return {
        available: usedCount < totalQuantity,
        used: usedCount,
        remaining: Math.max(0, totalQuantity - usedCount)
    };
};

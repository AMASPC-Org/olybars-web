import { db } from "../firebaseAdmin.js";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { Scraper, ScraperRun } from "../types/scraper.js";
import { RunStatus } from "../types/scraper.js";

type PartnerTier = "LOCAL" | "DIY" | "PRO" | "AGENCY"; // Simplified local definition to avoid import issues 

// Temporary fix if types not available:
type ScraperInput = Omit<Scraper, "id" | "createdAt" | "updatedAt" | "deleted" | "errorCount">;

const SCRAPERS_COLLECTION = "scrapers";
const RUNS_COLLECTION = "scraper_runs";
const USAGE_MONTHS_COLLECTION = "partner_usage_months";

export class ScraperService {

    static async createScraper(data: ScraperInput): Promise<string> {
        const docRef = db.collection(SCRAPERS_COLLECTION).doc();
        const scraper: Scraper = {
            ...data,
            id: docRef.id,
            deleted: false,
            errorCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            schedule: {
                ...data.schedule,
                nextRunAt: data.schedule.isEnabled ? Date.now() : null
            }
        };
        await docRef.set(scraper);
        return docRef.id;
    }

    static async getScraper(id: string): Promise<Scraper | null> {
        const doc = await db.collection(SCRAPERS_COLLECTION).doc(id).get();
        if (!doc.exists) return null;
        const data = doc.data() as Scraper;
        if (data.deleted) return null;
        return data;
    }

    static async updateScraper(venueId: string, id: string, updates: Partial<Scraper> | Record<string, any>): Promise<void> {
        const docRef = db.collection(SCRAPERS_COLLECTION).doc(id);
        const doc = await docRef.get();
        if (!doc.exists) throw new Error("Scraper not found");
        const data = doc.data() as Scraper;
        if (data.venueId !== venueId) throw new Error("Access Denied: Scraper belongs to another venue");

        await docRef.update({
            ...updates,
            updatedAt: Date.now()
        });
    }

    static async deleteScraper(venueId: string, id: string): Promise<void> {
        const docRef = db.collection(SCRAPERS_COLLECTION).doc(id);
        const doc = await docRef.get();
        if (!doc.exists) throw new Error("Scraper not found");
        const data = doc.data() as Scraper;
        if (data.venueId !== venueId) throw new Error("Access Denied: Scraper belongs to another venue");

        await docRef.update({
            deleted: true,
            "schedule.isEnabled": false,
            updatedAt: Date.now()
        });
    }

    static async listScrapers(venueId: string): Promise<Scraper[]> {
        const snapshot = await db.collection(SCRAPERS_COLLECTION)
            .where("venueId", "==", venueId)
            .where("deleted", "==", false)
            .get();

        return snapshot.docs.map(d => d.data() as Scraper);
    }

    /**
     * Atomic Reservation:
     * 1. Check Monthly Usage < Limit
     * 2. Increment Usage
     * 3. Create Run Doc
     */
    static async reserveQuotaAndCreateRun(
        venueId: string,
        scraperId: string,
        trigger: ScraperRun["trigger"]
    ): Promise<{ runId: string, allowed: boolean, reason?: string }> {

        return db.runTransaction(async (t) => {
            // 1. Get Limits
            const venueRef = db.collection("venues").doc(venueId);
            const venueSnap = await t.get(venueRef);
            if (!venueSnap.exists) throw new Error("Venue not found");

            const venueData = venueSnap.data();
            const tier = (venueData?.partnerConfig?.tier as PartnerTier) || "LOCAL";
            const timezone = venueData?.timezone || "America/Los_Angeles";

            // Determine Limit
            // Fixed unrealistic limits. Agency needs to support multiple daily scrapers.
            const LIMITS: Record<string, number> = {
                "LOCAL": 5,      // Free tier: occasional usage
                "DIY": 60,       // ~2 daily scrapers
                "PRO": 300,      // ~10 daily scrapers
                "AGENCY": 1000   // High volume
            };

            const monthlyLimit = LIMITS[tier] || 5;

            // 2. Check Usage
            const now = new Date();
            const monthKey = ScraperService.getMonthlyUsageKey(now, timezone);

            const usageRef = db.collection(USAGE_MONTHS_COLLECTION).doc(`${venueId}_${monthKey}`);

            const usageSnap = await t.get(usageRef);
            const currentUsage = usageSnap.exists ? (usageSnap.data()?.run_count_total || 0) : 0;

            if (currentUsage >= monthlyLimit) {
                return { runId: "", allowed: false, reason: `Monthly quota exceeded (${currentUsage}/${monthlyLimit})` };
            }

            // 3. Create Run
            const runRef = db.collection(RUNS_COLLECTION).doc();
            const runId = runRef.id;

            const runDoc: ScraperRun = {
                id: runId,
                scraperId,
                venueId,
                status: RunStatus.enum.QUEUED,
                trigger,
                createdAt: Date.now(),
            };

            t.set(runRef, runDoc);

            // 4. Increment Usage
            t.set(usageRef, {
                run_count_total: FieldValue.increment(1),
                updated_at: FieldValue.serverTimestamp()
            }, { merge: true });

            // 5. Add idempotency marker
            const markerRef = usageRef.collection("runs").doc(runId);
            t.set(markerRef, { timestamp: FieldValue.serverTimestamp() });

            return { runId, allowed: true };
        });
    }

    // ... (markRunStarted, markRunFailed)

    /**
     * Refunds the quota for a failed system run.
     * Should be called when a run fails due to internal system error (not user config error).
     */
    static async refundQuota(venueId: string, runId: string): Promise<void> {
        try {
            await db.runTransaction(async (t) => {
                // 1. Load Run First to get exact creation time
                const runRef = db.collection(RUNS_COLLECTION).doc(runId);
                const runDoc = await t.get(runRef);

                if (!runDoc.exists) {
                    console.log(`[Quota] Run ${runId} not found, cannot refund.`);
                    return;
                }
                const runData = runDoc.data() as ScraperRun;

                // Idempotency check
                if (runData?.quotaRefunded) {
                    console.log(`[Quota] Already refunded for run ${runId}`);
                    return;
                }

                // 2. Determine Month Key from Run Creation Time (Accuracy Fix)
                const venueRef = db.collection("venues").doc(venueId);
                const venueDoc = await t.get(venueRef);
                const timezone = venueDoc.exists ? (venueDoc.data()?.timezone || "America/Los_Angeles") : "America/Los_Angeles";

                const createdDate = runData.createdAt ? new Date(runData.createdAt) : new Date();
                const monthKey = ScraperService.getMonthlyUsageKey(createdDate, timezone);

                const usageDocId = `${venueId}_${monthKey}`;
                const usageRef = db.collection(USAGE_MONTHS_COLLECTION).doc(usageDocId);

                // 3. Decrement usage
                // We must check if usage doc exists to avoid creating a negative doc if it was somehow deleted
                const usageSnap = await t.get(usageRef);
                if (usageSnap.exists) {
                    t.update(usageRef, {
                        run_count_total: FieldValue.increment(-1),
                        updated_at: FieldValue.serverTimestamp()
                    });
                } else {
                    console.warn(`[Quota] Usage doc ${usageDocId} missing during refund. Skipping decrement.`);
                }

                // 4. Mark as refunded
                t.update(runRef, {
                    quotaRefunded: true,
                    status: RunStatus.enum.REFUNDED_FAILURE
                });
            });
            console.log(`[Quota] Refunded 1 credit to ${venueId} for run ${runId}`);
        } catch (e) {
            console.error(`[Quota] Failed to refund ${venueId} for run ${runId}`, e);
        }
    }

    private static getMonthlyUsageKey(date: Date, timezone: string): string {
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit'
        });
        const parts = formatter.formatToParts(date);
        const year = parts.find(p => p.type === 'year')?.value;
        const month = parts.find(p => p.type === 'month')?.value;
        return `${year}${month}`;
    }

    static async markRunComplete(runId: string, status: string, stats?: any, error?: string): Promise<void> {
        await db.collection(RUNS_COLLECTION).doc(runId).update({
            status,
            completedAt: Date.now(),
            stats,
            error
        });
    }
}

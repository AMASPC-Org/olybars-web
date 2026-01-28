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

    static async updateScraper(venueId: string, id: string, updates: Partial<Scraper>): Promise<void> {
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
            // 1. Get Limits (Assume Tier lookup or simplified for now)
            // Ideally read 'partners/{venueId}' -> tier -> PLANS[tier].monthly_limit
            // For now, let's look up venue to get tier
            const venueRef = db.collection("venues").doc(venueId); // Assuming 'venues' holds partner config
            const venueSnap = await t.get(venueRef);
            if (!venueSnap.exists) throw new Error("Venue not found");

            const venueData = venueSnap.data();
            const tier = (venueData?.partnerConfig?.tier as PartnerTier) || "LOCAL"; // Default to LOCAL/FREE

            // Determine Limit (Hardcoded or imported - importing TIER_CONFIG is better if possible)
            const LIMITS: Record<string, number> = {
                "LOCAL": 1,
                "DIY": 4,
                "PRO": 8,
                "AGENCY": 9999
            };

            const monthlyLimit = LIMITS[tier] || 1;

            // 2. Check Usage
            const date = new Date();
            const monthKey = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
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
                // quota.reserved flag if we want it explicit
            };

            t.set(runRef, runDoc);

            // 4. Increment Usage
            t.set(usageRef, {
                run_count_total: FieldValue.increment(1),
                updated_at: FieldValue.serverTimestamp()
            }, { merge: true });

            // 5. Add idempotency marker to run subcollection in usage doc? Optional but good.
            const markerRef = usageRef.collection("runs").doc(runId);
            t.set(markerRef, { timestamp: FieldValue.serverTimestamp() });

            return { runId, allowed: true };
        });
    }

    static async markRunStarted(runId: string): Promise<void> {
        await db.collection(RUNS_COLLECTION).doc(runId).update({
            status: "STARTED", // Using string to match legacy if needed, or RunStatus enum
            startedAt: Date.now()
        });
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

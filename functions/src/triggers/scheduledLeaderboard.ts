import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Initialize admin if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();

/**
 * Scheduled Leaderboard Snapshot
 * Runs every 60 minutes.
 * Fetches top 50 profiles and stores them in a single document for FinOps optimization.
 */
export const scheduledLeaderboardSnapshot = onSchedule({
    schedule: "every 30 minutes", // Increased frequency for real-time feel
    region: "us-west1",
    memory: "256MiB"
}, async (event) => {
    logger.info("[FinOps] Starting Leaderboard Snapshot...");

    try {
        // 1. Get total members count efficiently
        const countSnapshot = await db.collection("public_profiles").count().get();
        const totalMembers = countSnapshot.data().count;

        // 2. Fetch top 50
        const snapshot = await db.collection("public_profiles")
            .orderBy("league_stats.points", "desc")
            .limit(50)
            .get();

        const leaderboardData = snapshot.docs.map((doc, index) => {
            const data = doc.data();
            return {
                uid: doc.id,
                handle: data.handle || "Anonymous",
                avatarUrl: data.avatarUrl || "",
                points: data.league_stats?.points || 0,
                rank: index + 1
            };
        });

        const entryCount = snapshot.size;

        await db.collection("system_data").doc("leaderboard").set({
            topUsers: leaderboardData,
            totalMembers: totalMembers,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });

        logger.info(`[FinOps] Snapshot complete. Cached ${leaderboardData.length} users.`);
    } catch (error) {
        logger.error("[FinOps] Leaderboard Snapshot failed:", error);
    }
});

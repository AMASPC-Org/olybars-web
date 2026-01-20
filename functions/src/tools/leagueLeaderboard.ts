import { z } from 'zod';
import { ai } from '../genkit';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
    initializeApp();
}
const db = getFirestore();

const LeaderboardEntrySchema = z.object({
    rank: z.number(),
    handle: z.string(),
    points: z.number(),
    isUser: z.boolean().optional(),
});

const LeaderboardInputSchema = z.object({
    userId: z.string().optional().describe('The ID of the user to find their specific rank.'),
});

export const leagueLeaderboard = ai.defineTool(
    {
        name: 'leagueLeaderboard',
        description: 'Get the current OlyBars League standings and leaderboards.',
        inputSchema: LeaderboardInputSchema,
        outputSchema: z.array(LeaderboardEntrySchema),
    },
    async ({ userId }: z.infer<typeof LeaderboardInputSchema>) => {
        try {
            const snapshot = await db.collection('public_profiles')
                .orderBy('league_stats.points', 'desc')
                .limit(20)
                .get();

            const entries = snapshot.docs.map((doc, index) => {
                const data = doc.data();
                return {
                    rank: index + 1,
                    handle: data.handle || 'Anonymous Legend',
                    points: data.league_stats?.points || 0,
                    isUser: doc.id === userId
                };
            });

            // If the user isn't in top 20, we'd ideally fetch their specific rank.
            // For now, return top 20.
            return entries;
        } catch (error) {
            console.error("League leaderboard fetch failed:", error);
            return [];
        }
    }
);

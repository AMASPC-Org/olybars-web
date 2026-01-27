/**
 * SocialManager Service
 * 
 * This service handles the "Publish Once, Distribute Everywhere" logic.
 * It integrates with the Meta Graph API to read from and publish to IG/FB.
 */

import { Venue, LeagueEvent } from '../../../src/types.js';
import { db } from '../firebaseAdmin.js';

export class SocialManager {
    /**
     * Entry point for the Auto-Sync Cron.
     * Iterates through venues with social sync enabled.
     */
    async syncAllVenues() {
        try {
            const snapshot = await db.collection('venues')
                .where('social_auto_sync', '==', true)
                .get();

            const venues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Venue));

            for (const venue of venues) {
                await this.syncVenue(venue);
            }
        } catch (error) {
            console.error('[SOCIAL_MANAGER] Error in syncAllVenues:', error);
        }
    }

    private async syncVenue(venue: Venue) {
        if (!venue.partnerConfig?.metaSync?.instagramBusinessId || !venue.partnerConfig.metaSync.pageToken) {
            return;
        }

        try {
            // 1. Fetch latest posts from Instagram via Meta Graph API
            const rawContent = await this.fetchMetaContent(
                venue.partnerConfig.metaSync.instagramBusinessId,
                venue.partnerConfig.metaSync.pageToken
            );

            if (!rawContent || !rawContent.data) return;

            // 2. Filter for UNSEEN content would happen here (using lastSyncTimestamp)
            const lastSync = venue.partnerConfig.metaSync.lastSync || 0;
            const newPosts = rawContent.data.filter((post: any) => new Date(post.timestamp).getTime() > lastSync);

            const gemini = new (await import('./geminiService.js')).GeminiService();
            const today = new Date().toISOString().split('T')[0];

            // Context Prep
            let city = "Olympia, WA";
            if (venue.address) {
                const parts = venue.address.split(",");
                if (parts.length >= 2) {
                    city = parts[1].trim(); // Usually the city
                }
            }
            const venueContext = { city, timezone: "America/Los_Angeles" };

            for (const post of newPosts) {
                // 3. Draft creation using AI Brain
                console.log(`[SOCIAL_MANAGER] Analyzing post ${post.id} for venue ${venue.id}`);
                const analysis = await gemini.analyzeScrapedContent(
                    post.caption || '',
                    today,
                    venueContext,
                    'SOCIAL_FEED'
                );

                if (analysis && analysis.sourceConfidence > 0.7) {
                    if (analysis.classification === 'EVENT' && analysis.extractedEvent) {
                        await this.createEventDraft(venue.id, post, analysis.extractedEvent);
                    } else if (analysis.classification === 'MENU_UPDATE' || analysis.classification === 'NEWS') {
                        await this.createGeneralDraft(venue.id, post, analysis);
                    }
                }
            }

            // 4. Update last sync
            await db.collection('venues').doc(venue.id).update({
                'partnerConfig.metaSync.lastSync': Date.now()
            });

        } catch (error) {
            console.error(`[SOCIAL_MANAGER] Error syncing venue ${venue.id}:`, error);
        }
    }

    private async fetchMetaContent(instagramId: string, accessToken: string) {
        const url = `https://graph.facebook.com/v18.0/${instagramId}/media?fields=id,caption,media_type,media_url,timestamp,permalink&access_token=${accessToken}&limit=5`;
        const response = await fetch(url);

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Meta API Error: ${response.status} - ${error}`);
        }

        return await response.json();
    }

    private async createEventDraft(venueId: string, post: any, extractedEvent: any) {
        const draftEvent = {
            venueId,
            title: extractedEvent.title || 'Instagram Sync Event',
            description: post.caption,
            date: extractedEvent.date,
            time: extractedEvent.time,
            sourceUrl: post.permalink,
            imageUrl: post.media_url,
            status: 'pending-approval',
            createdAt: Date.now(),
            metaPostId: post.id,
            origin: 'social_sync'
        };

        await db.collection('event_drafts').add(draftEvent);
    }

    private async createGeneralDraft(venueId: string, post: any, analysis: any) {
        const draft = {
            venueId,
            type: analysis.classification === 'MENU_UPDATE' ? 'menu_highlight' : 'news_post',
            highlights: analysis.extractedHighlights || [],
            description: post.caption,
            sourceUrl: post.permalink,
            imageUrl: post.media_url,
            status: 'pending-approval',
            createdAt: Date.now(),
            metaPostId: post.id,
            origin: 'social_sync'
        };

        await db.collection('general_drafts').add(draft);
    }

    /**
     * Multi-Platform Pusher
     * When a venue manually adds an event in the dashboard, push it back to social.
     */
    async publishToSocial(venueId: string, activity: LeagueEvent) {
        // Implementation for posting back to IG/FB would go here
        console.log(`[SOCIAL_MANAGER] Placeholder: Publishing ${activity.title} for venue ${venueId}`);
    }
}

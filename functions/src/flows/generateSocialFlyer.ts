import { onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { ai } from '../genkit';
import { imagen3Fast } from '@genkit-ai/vertexai';
import { buildImagePrompt } from '../utils/promptBuilder';
import { saveGeneratedFlyer } from '../utils/assetManager';
import { getSocialDimensions } from '../skills/Schmidt/utils';

// Schema: Accepts draft event data OR an existing ID
const FlyerGeneratorInput = z.object({
    venueId: z.string(),
    eventId: z.string().optional().default('drafts'),
    eventContext: z.object({
        title: z.string(),
        type: z.string(),
        details: z.string(),
        date: z.string()
    }),
    spec: z.object({
        platform: z.string(), // "facebook"
        type: z.string()      // "story"
    })
});

export const generateSocialFlyerFlow = onCall(
    {
        cors: true,
        secrets: ["GOOGLE_API_KEY", "GOOGLE_MAPS_API_KEY"],
        region: 'us-west1'
    },
    async (request) => {
        const input = FlyerGeneratorInput.parse(request.data);
        const db = admin.firestore();

        // 1. Fetch Brand DNA (The "Vibe")
        const venueSnap = await db.collection('venues').doc(input.venueId).get();
        const venueData = venueSnap.data();

        if (!venueData || !venueData.brand_dna) {
            throw new Error("Missing Brand DNA. Please run the Brand Audit first.");
        }

        // 2. Get Dimensions (The "Container")
        const dimensions = getSocialDimensions(input.spec.platform as any, input.spec.type);
        if (!dimensions) throw new Error(`Unknown format: ${input.spec.platform} / ${input.spec.type}`);

        // 3. Build the Prompt (The "Director")
        const finalPrompt = buildImagePrompt({
            event: {
                title: input.eventContext.title,
                type: input.eventContext.type as any,
                description: input.eventContext.details,
                date: input.eventContext.date
            },
            brand: venueData.brand_dna,
            spec: {
                platform: input.spec.platform,
                type: input.spec.type,
                aspect_ratio: dimensions.aspect_ratio
            }
        });

        // 4. Generate (The "Artist")
        // Map to supported Vertex AI aspect ratios: "9:16" | "1:1" | "16:9" | "3:4" | "4:3"
        let targetAspectRatio = dimensions.aspect_ratio;
        if (targetAspectRatio === "1.91:1") targetAspectRatio = "16:9";
        if (targetAspectRatio === "4:5") targetAspectRatio = "3:4";

        const result = await ai.generate({
            model: imagen3Fast,
            prompt: finalPrompt,
            config: {
                aspectRatio: targetAspectRatio as any
            }
        });

        // 5. Save (The "Librarian")
        const media = result.media as any;
        if (!media || !media.data) throw new Error("AI generated no image media data.");

        const asset = await saveGeneratedFlyer({
            venueId: input.venueId,
            eventId: input.eventId || 'drafts',
            imageBase64: media.data as string,
            prompt: finalPrompt,
            spec: {
                platform: input.spec.platform,
                type: input.spec.type,
                width: dimensions.width,
                height: dimensions.height
            }
        });

        return { success: true, assetUrl: asset.publicUrl, flyerId: asset.id };
    }
);

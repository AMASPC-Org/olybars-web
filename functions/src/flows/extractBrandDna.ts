import { onCall } from 'firebase-functions/v2/https';
import { ai } from '../genkit';
import { gemini15Pro } from '@genkit-ai/googleai';
import { BrandDNASchema } from '../types/shared_types';
import { z } from 'zod';
import * as admin from 'firebase-admin';

// Initialize admin if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const BrandExtractionInput = z.object({
    venueId: z.string(),
    uploadedImages: z.array(z.string()).optional(), // Scenario A: User provides files
});

export const extractBrandDnaFlow = onCall(
    {
        cors: true,
        secrets: ["GOOGLE_API_KEY", "GOOGLE_MAPS_API_KEY"],
        region: 'us-west1'
    },
    async (request) => {
        const input = BrandExtractionInput.parse(request.data);
        const { venueId, uploadedImages } = input;
        const db = admin.firestore();

        // 1. Fetch venue data
        const venueDoc = await db.collection('venues').doc(venueId).get();
        const venue = venueDoc.data();
        if (!venue) throw new Error(`Venue ${venueId} not found`);

        // --- WATERFALL LOGIC ---

        // TIER 1: USER UPLOADS
        if (uploadedImages && uploadedImages.length > 0) {
            console.log(`[BrandAudit] Tier 1: Analyzing ${uploadedImages.length} uploaded images.`);
            return await analyzeVisuals(venueId, uploadedImages, venue, 'upload');
        }

        // TIER 2: SCRAPED (Google Photos)
        const googlePhotos = venue.googlePlacePhotos || [];
        if (googlePhotos.length > 0) {
            console.log(`[BrandAudit] Tier 2: Analyzing ${googlePhotos.length} Google photos.`);
            return await analyzeVisuals(venueId, googlePhotos, venue, 'scraped');
        }

        // TIER 3: INFERRED (Text Only)
        console.log(`[BrandAudit] Tier 3: Inferring brand from text metadata.`);
        return await inferBrand(venueId, venue);
    }
);

/**
 * Visual Analysis Path (Uploads or Scraped)
 */
async function analyzeVisuals(venueId: string, imageUrls: string[], venue: any, source: 'upload' | 'scraped') {
    const prompt = `You are an expert Brand Director. Analyze these images for "${venue.name}" (${venue.venueType}).
    Extract the Brand DNA profile. 
    Since these images come from ${source}, distinguish between core brand elements and transient background details.
    
    OUTPUT: Return a JSON object matching the BrandDNA schema.`;

    const result = await ai.generate({
        model: gemini15Pro,
        prompt: [
            { text: prompt },
            ...imageUrls.slice(0, 5).map(url => ({ media: { url, contentType: 'image/jpeg' } }))
        ],
        output: { schema: BrandDNASchema as any }
    });

    const brandDna = result.output();
    if (brandDna) {
        brandDna.extraction_source = source;
        brandDna.last_updated = new Date().toISOString();
        await saveBrandDna(venueId, brandDna);
    }
    return { success: true, data: brandDna };
}

/**
 * Text Inference Path (Generic Stereotype)
 */
async function inferBrand(venueId: string, venue: any) {
    const prompt = `You are a Brand Strategist. We have NO IMAGES for "${venue.name}".
    Venue Type: ${venue.venueType}
    Description: ${venue.description || 'N/A'}
    
    TASK: Infer a high-quality, stereotypical Brand DNA profile for this type of venue.
    1. Choose a palette that matches a ${venue.venueType}.
    2. Set a low confidence_score (e.g. 50).
    3. Add notes explaining the inference.
    
    OUTPUT: Return a JSON object matching the BrandDNA schema.`;

    const result = await ai.generate({
        model: gemini15Pro,
        prompt: prompt,
        output: { schema: BrandDNASchema as any }
    });

    const brandDna = result.output();
    if (brandDna) {
        brandDna.extraction_source = 'inferred';
        brandDna.notes = `Auto-inferred based on venue type (${venue.venueType}). Upload photos for better accuracy.`;
        brandDna.last_updated = new Date().toISOString();
        await saveBrandDna(venueId, brandDna);
    }
    return { success: true, data: brandDna };
}

async function saveBrandDna(venueId: string, dna: any) {
    await admin.firestore().collection('venues').doc(venueId).update({
        brand_dna: dna,
        'status.last_brand_audit': new Date().toISOString()
    });
}

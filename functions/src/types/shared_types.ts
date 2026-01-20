import { z } from 'zod';

// --- BRAND DNA SCHEMAS (DUPLICATED FOR ISOLATION) ---

const PaletteSchema = z.object({
    primary: z.string().describe("Dominant hex color code (e.g. #FF5733)"),
    secondary: z.string().describe("Secondary hex color code"),
    accent: z.string().describe("Accent hex color code for buttons/highlights"),
    background_preference: z.enum(['dark', 'light', 'colorful']).describe("Best background style for this brand"),
});

const StyleGuideSchema = z.object({
    aesthetic: z.string().describe("3-word visual summary (e.g. 'Industrial Rustic Chic')"),
    lighting_mood: z.string().describe("The lighting vibe (e.g. 'Neon-soaked', 'Candlelit', 'Natural')"),
    texture_keywords: z.array(z.string()).describe("List of 3-5 visible textures (e.g. 'brick', 'velvet', 'wood')"),
});

const GenerationRulesSchema = z.object({
    negative_prompt: z.string().describe("Comma-separated list of elements to AVOID (e.g. 'cartoon, 3d render, bright neon')"),
    logo_placement: z.enum(['center', 'bottom_right', 'top_left', 'top_right']).describe("Optimal placement for logo overlay"),
    human_presence: z.enum(['crowded', 'sparse', 'no_humans']).describe("How populated the venue should look"),
});

export const BrandDNASchema = z.object({
    palette: PaletteSchema,
    style_guide: StyleGuideSchema,
    generation_rules: GenerationRulesSchema,
    extraction_source: z.enum(['upload', 'scraped', 'inferred']).describe("Where did we get this style?"),
    confidence_score: z.number().min(1).max(100).describe("Confidence score (1-100) of the analysis"),
    notes: z.string().optional().describe("Explanation of why we chose this style"),
    last_updated: z.string().optional().describe("ISO Date string of extraction"),
});

export type BrandDNA = z.infer<typeof BrandDNASchema>;

// --- EVENT TYPES (DUPLICATED FOR ISOLATION) ---

export interface EventAnalysis {
    confidenceScore: number;
    issues: string[];
    lcbWarning: boolean;
    suggestions: string[];
    summary: string;
}

export interface AppEvent {
    id: string;
    venueId: string;
    venueName: string;
    title: string;
    type: 'karaoke' | 'trivia' | 'live_music' | 'bingo' | 'openmic' | 'other';
    date: string;
    time: string;
    description?: string;
    points?: number;
    status: 'pending' | 'approved' | 'rejected';
    submittedBy: string;
    createdAt: number;
    updatedAt?: number;
    isLeagueEvent?: boolean;
    analysis?: EventAnalysis;
}

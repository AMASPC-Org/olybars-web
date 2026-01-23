import { GoogleGenAI } from '@google/genai';
import { ARTIE_SYSTEM_INSTRUCTION } from '../appConfig/agents/artie.js';
import { SCHMIDT_SYSTEM_INSTRUCTION } from '../appConfig/agents/schmidt.js';
import { genkit } from 'genkit';
import { vertexAI, imagen3Fast } from '@genkit-ai/vertexai';
import { StorageService } from './storageService.js';
import { config as appConfig } from '../appConfig/config.js';

// Initialize Genkit with Vertex AI
const ai = genkit({
    plugins: [vertexAI({ location: 'us-west1' })],
});

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

export class GeminiService {
    private genAI: any;

    // Agent Personas (Imported from Config)
    public static ARTIE_PERSONA = ARTIE_SYSTEM_INSTRUCTION;
    public static SCHMIDT_PERSONA = SCHMIDT_SYSTEM_INSTRUCTION;

    constructor(apiKey?: string) {
        const isCloudRun = !!process.env.K_SERVICE;
        const effectiveApiKey = apiKey || appConfig.GOOGLE_GENAI_API_KEY;
        const useADC = isCloudRun || !effectiveApiKey;

        if (useADC) {
            console.log(`📡 GeminiService: Using Vertex AI (ADC) for ${isCloudRun ? 'Cloud Run' : 'local'} resilience.`);
            this.genAI = new GoogleGenAI({
                vertexai: true,
                project: process.env.GOOGLE_CLOUD_PROJECT || 'ama-ecosystem-prod',
                location: 'us-west1',
            });
        } else {
            const maskedKey = effectiveApiKey ? `${effectiveApiKey.substring(0, 4)}...` : 'NONE';
            console.log(`📡 GeminiService: Initialized using API Key: ${maskedKey}`);
            this.genAI = new GoogleGenAI({
                apiKey: effectiveApiKey,
                vertexai: false,
            });
        }
    }

    // Generic Generation Method (Used by Chat Routes)
    async generateArtieResponse(model: string, contents: any[], temperature: number = 0.7, systemInstruction?: string, tools?: any[], cachedContent?: string) {
        // Default to Artie if no instruction provided, but allow overrides
        const instruction = systemInstruction || GeminiService.ARTIE_PERSONA;

        const response = await this.genAI.models.generateContent({
            model,
            contents,
            systemInstruction: { parts: [{ text: instruction }] },
            tools: tools ? [{ function_declarations: tools }] : undefined,
            cachedContent,
            config: { temperature }
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    async generateArtieResponseStream(model: string, contents: any[], temperature: number = 0.7, systemInstruction?: string, tools?: any[], cachedContent?: string) {
        const instruction = systemInstruction || GeminiService.ARTIE_PERSONA;

        return this.genAI.models.generateContentStream({
            model,
            contents,
            systemInstruction: { parts: [{ text: instruction }] },
            tools: tools ? [{ function_declarations: tools }] : undefined,
            cachedContent,
            config: { temperature }
        });
    }

    async generateEventDescription(context: {
        venueName: string;
        venueType: string;
        eventType: string;
        date: string;
        time: string;
        weather?: string;
        holiday?: string;
        deals?: any[];
        city?: string;
        eventTitle?: string;
        originalDescription?: string;
        venueLore?: string;
        triviaHost?: string;
        triviaPrizes?: string;
        triviaSpecials?: string;
    }) {
        const cityContext = context.city || "Olympia, WA";

        // Uses a specific mini-prompt for descriptions, keeping Schmidt's voice
        const prompt = `Generate a high-energy, contextually aware event description for OlyBars.
        VENUE: ${context.venueName} (${context.venueType})
        LOCATION: ${cityContext}
        EVENT TYPE: ${context.eventType}
        EVENT TITLE: ${context.eventTitle || context.eventType}
        DATE: ${context.date} @ ${context.time}
        WEATHER: ${context.weather || 'Standard Olympia Vibes'}
        HOLIDAY: ${context.holiday || 'None'}
        ACTIVE DEALS: ${context.deals?.map(d => `${d.title} (${d.time})`).join(', ') || 'None'}
        
        ${context.venueLore ? `VENUE LORE: ${context.venueLore}` : ''}
        ${context.triviaHost ? `TRIVIA HOST: ${context.triviaHost}` : ''}
        ${context.triviaPrizes ? `TRIVIA PRIZES: ${context.triviaPrizes}` : ''}
        ${context.triviaSpecials ? `TRIVIA SPECIALS: ${context.triviaSpecials}` : ''}

        USER DRAFT / EXISTING NOTES: 
        ${context.originalDescription || "No existing notes provided."}

        CONSTRAINTS:
        1. Max 2-3 sentences.
        2. Stay in persona: Schmidt (Lead Architect). Professional, sharp, slightly arrogant about quality.
        3. [INTEGRATION]: You MUST incorporate the "User Draft / Existing Notes" into the final description while polishing it for the OlyBars vibe.
        4. [STRICT LCB COMPLIANCE]:
           - ANTI-VOLUME: NEVER imply the goal is to consume alcohol rapidly or in large quantities.
           - FORBIDDEN TERMS: "Bottomless", "Chug", "Wasted", "Get Hammered", "All you can drink", "Unlimited", "Endless". // @guardrail-ignore
           - THE PIVOT: If constraints or inputs imply these terms, PIVOT the description to focus on 'Flavor', 'Experience', or 'Community' without scolding.
        5. SAFE RIDE: ALWAYS suggest a safe ride (Lyft/Red Cab) if the event is after 5:30 PM.
        6. Tone: OSWALD font energy (League vibes).

        OUTPUT:
        The generated description only.`;

        try {
            const response = await this.genAI.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                systemInstruction: { parts: [{ text: GeminiService.SCHMIDT_PERSONA }] },
                config: { temperature: 0.8 }
            });

            return response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        } catch (error: any) {
            console.error('❌ [GEMINI_ERROR]', error);
            throw error;
        }
    }

    async analyzeEvent(event: any): Promise<{ confidenceScore: number; issues: string[]; lcbWarning: boolean; suggestions: string[]; summary: string }> {
        // Event Analysis uses Artie as the "Guardian"
        const prompt = `You are Artie, the Event Quality Guardian for OlyBars.
        Analyze this event submission for completeness, excitement ("Vibe"), and LCB Compliance.

        EVENT DATA:
        Title: ${event.title}
        Type: ${event.type}
        Date: ${event.date}
        Time: ${event.time}
        Description: ${event.description || "MISSING"}

        RULES:
        1. COMPLETENESS: Does it have a good title, date, time, and descriptive text?
        2. LCB COMPLIANCE (Traffic Light System):
           - RED LIGHT (Warning=true): Usage of "Bottomless", "All you can drink", "Free shots", "Chug challenge", "Drunk", "Wasted". // @guardrail-ignore
           - CITATION DIRECTIVE: If RED LIGHT, explicitly cite "WAC 314-52" as the authority in the summary.
           - GREEN LIGHT: Focuses on music, trivia, food, or community.      
        3. VIBE CHECK: Is it boring? (e.g., just "Music") vs Exciting (e.g., "Live Jazz with The Cats").

        OUTPUT JSON ONLY:
        {
           "confidenceScore": number (0-100),
           "issues": string[] (List specific missing fields or weaknesses),  
           "lcbWarning": boolean (True if it violates anti-volume rules),    
           "suggestions": string[] (2-3 quick actions to improve it),        
           "summary": string (1 sentence critique in Artie Persona)
        }`;

        const response = await this.genAI.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { response_mime_type: "application/json" }
        });

        let text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!text) throw new Error("Artie failed to analyze event.");

        text = text.replace(/```json\n?|```/g, '').trim();

        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("JSON Parse Error on Artie Analysis:", text);
            return {
                confidenceScore: 0,
                issues: ["Failed to parse AI response"],
                lcbWarning: false,
                suggestions: [],
                summary: "Artie is confused. Try again."
            };
        }
    }

    async getTriage(question: string): Promise<string> {
        return "I'm ready to serve, boss.";
    }

    async generateManagerSuggestion(stats: any, venue: any): Promise<any> {
        const prompt = `
        TASK: Analyze venue performance and suggest a "Yield Management" action.

        CONTEXT:
        Venue Vibe: ${venue.insiderVibe || venue.description}
        Amenities: ${venue.amenityDetails?.map((a: any) => a.name).join(', ')}
        Private Spaces: ${venue.privateSpaces?.map((s: any) => `${s.name} (${s.capacity})`).join(', ') || 'None'}
        Last 14 Days Activity: ${JSON.stringify(stats)}
        Point Bank Balance: ${venue.pointBank || 5000}

        STRATEGY:
        1. Identify the consistently slow time/day.
        2. Suggest a "Flash Bounty" or "Vibe Boost".
        3. Allocate a Point Bank spend (usually 500-1000 points).
        4. Pitch it concisely to the owner.

        COMPLIANCE:
        - Must follow WA LCB rules (Safe ride mention, no chugging, points for engagement only).

        OUTPUT JSON ONLY:
        {
           "type": "YIELD_BOOST",
           "message": "Schmidt-style pitch (Direct, business-focused, citing the data)",
           "actionLabel": "Approve Flash Bounty",
           "actionSkill": "schedule_flash_deal",
           "actionParams": {
              "summary": "Title of deal",
              "details": "Details including safe ride info",
              "duration": "Duration in minutes"
           },
           "pointCost": number,
           "potentialImpact": "HIGH" | "MEDIUM" | "LOW"
        }`;

        // INJECT SCHMIDT SYSTEM INSTRUCTION
        const response = await this.genAI.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: GeminiService.SCHMIDT_PERSONA }] },
            config: { response_mime_type: "application/json" }
        });

        let text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!text) throw new Error("Schmidt failed to generate suggestion.");
        text = text.replace(/```json\n?|```/g, '').trim();

        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("JSON Parse Error on Schmidt Suggestion:", text);
            return null;
        }
    }

    async parseFlyerContent(imageBuffer: Buffer, contextDate: string): Promise<any> {
        const prompt = `You are Schmidt, the Lead Architect of OlyBars.
        TASK: Extract event details from this flyer for system entry.
        
        CONTEXT:
        Current Date Context: ${contextDate} (Use this to resolve relative dates like "Friday" or "Tomorrow").
        
        EXTRACTION RULES:
        1. TITLE: Catchy, clear. Shorten if it's too long.
        2. DATE: Convert to ISO (YYYY-MM-DD). If "tonight", use the system date.
        3. TIME: Convert to 24h format (HH:mm).
        4. TYPE: One of: trivia, music, sports, comedy, happy_hour, other.
        5. DESCRIPTION: 1-2 sentence high-energy pitch.
        
        LCB COMPLIANCE:
        - If the flyer mentions "Free base", "Bottomless", or "Unlimited alcohol", FLAG it but still try to extract other data. // @guardrail-ignore
        - PIVOT descriptions to focus on the experience, NOT the volume of alcohol.
        
        {
          "title": "string",
          "date": "YYYY-MM-DD",
          "time": "HH:mm",
          "type": "string",
          "description": "string",
          "lcbViolationDetected": boolean,
          "missingFields": ["date", "time", "type", "title"]
        }
        
        Note: Only include fields in "missingFields" if they are truly ambiguous or missing from the image.
        `;

        const response = await this.genAI.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{
                role: 'user',
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: imageBuffer.toString('base64')
                        }
                    }
                ]
            }],
            systemInstruction: { parts: [{ text: GeminiService.SCHMIDT_PERSONA }] },
            config: { response_mime_type: "application/json" }
        });

        let text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!text) throw new Error("Schmidt failed to read the flyer.");
        text = text.replace(/```json\n?|```/g, '').trim();

        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("JSON Parse Error on Flyer Analysis:", text);
            throw new Error("Failed to parse flyer data.");
        }
    }

    async generateEventCopy(draft: any, venueContext: any, vibe: string = 'standard'): Promise<string> {
        const prompt = `You are Schmidt, the Product Architect for OlyBars.
        TASK: Write a creative, engaging social media / calendar blurb for this event.
        
        VENUE: ${venueContext.name} (${venueContext.venueType || 'Local Spot'})
        EVENT: ${draft.title}
        DATE: ${draft.date} @ ${draft.time}
        PRIZES/SPECIALS: ${draft.prizes || 'None listed'}
        VIBE REQUEST: ${vibe}
        
        INSTRUCTIONS:
        1. Do NOT be robotic. Write like a local who knows the spot.
        2. Match the Venue Type: ${venueContext.venueType}. (e.g., Dive bars are gritty/fun, Lounges are sleek/chill).
        3. [STRICT LCB COMPLIANCE]:
           - NEVER link points/prizes to alcohol purchase.
           - NEVER imply rapid/volume consumption.
           - Mention a safe ride (Lyft/Red Cab) if it's a late night "hype" vibe.
        4. Emojis: Use 2-3 appropriate ones.
        5. Length: 1-2 powerful sentences max.
        
        VIBE HINTS:
        - hype: Energy, exclamation marks, "Get here early".
        - chill: Laid back, "The perfect recovery", "Easy evening".
        - funny: Witty observations, light sarcasm about the weather or trivia nerds.
        - standard: Professional but warm.
        
        OUTPUT: Only the creative text.`;

        const response = await this.genAI.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: GeminiService.SCHMIDT_PERSONA }] },
            config: { temperature: 0.8 }
        });

        return response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Event details staged and ready!";
    }

    async generateImage(prompt: string, venueId: string): Promise<string> {
        console.log(`🎨 GeminiService: Generating image for ${venueId} with prompt: "${prompt.substring(0, 50)}..."`);

        try {
            const result = await ai.generate({
                model: imagen3Fast,
                prompt: prompt,
                config: {
                    aspectRatio: '1:1', // Standard square for social
                },
            });

            if (!result || !result.media) {
                throw new Error("No media returned from Imagen 3");
            }

            // Imagen returns media with a url (if GCS) or data URI? 
            // Genkit's GenerateResponse for image models typically puts the image in the message.
            // Let's inspect the result structure for basic Genkit usage.
            // Actually, genkit generate returns a GenerateResponse.
            // For image models, the output is media.

            const media = result.media;
            if (!media) throw new Error("No media in generation result");

            // If it's a data URI, we need to strip headers and upload
            // media.url might be a data uri like: data:image/png;base64,....
            let buffer: Buffer;

            if (media.url.startsWith('data:')) {
                const base64Data = media.url.split(',')[1];
                buffer = Buffer.from(base64Data, 'base64');
            } else {
                throw new Error("Unexpected media URL format from Genkit (expected data URI)");
            }

            // Upload to Persistence Layer
            const publicUrl = await StorageService.uploadImage(buffer, venueId);
            return publicUrl;

        } catch (error: any) {
            console.error("❌ GeminiService: Image Generation Failed", error);
            throw new Error(`Image Generation Failed: ${error.message}`);
        }
    }

    async analyzeScrapedContent(rawContent: string, currentTime: string, venueContext: { city: string, timezone: string }, target: 'EVENTS' | 'MENU' | 'NEWSLETTER' | 'SOCIAL_FEED' = 'EVENTS'): Promise<any> {
        // Default to Olympia if missing (Safety Net)
        const cityString = venueContext?.city || "Olympia, WA";

        let prompt = '';

        if (target === 'EVENTS') {
            prompt = `You are Schmidt, the Lead Architect of OlyBars.
            TASK: Extract all upcoming nightlife events from the provided raw page content.
            
            CONTEXT:
            Current Date Context: ${currentTime} (Use this to resolve relative dates like "Tonight", "This Friday", or "Tomorrow").
            Venue Location: ${cityString} (Pacific Time).
            
            EXTRACTION RULES:
            1. Extract ALL unique events found in the text.
            2. TITLE: Catchy, clear. Shorten if it's too long.
            3. DATE: Convert to ISO (YYYY-MM-DD). If "tonight", use the system date.
            4. TIME: Convert to 24h format (HH:mm). If only "7 PM" is listed, use "19:00".
            5. TYPE: One of: trivia, karaoke, live_music, bingo, sports, comedy, happy_hour, other.
            6. DESCRIPTION: 1-2 sentence high-energy pitch.
            
            LCB COMPLIANCE:
            - If the text mentions "Free drinks", "Bottomless", or "Unlimited alcohol", FLAG it in the description or pivot to focus on the experience. // @guardrail-ignore
            
            OUTPUT FORMAT (JSON ARRAY ONLY):
            [{
              "title": "string",
              "date": "YYYY-MM-DD",
              "time": "HH:mm",
              "type": "string",
              "description": "string",
              "sourceConfidence": number (0.0 to 1.0)
            }]
            
            Note: If no events are found, return an empty array [].
            `;
        } else if (target === 'MENU') {
            prompt = `You are Schmidt, the Lead Architect of OlyBars.
            TASK: Analyze this menu/webpage and extract "Hero Items" and "Special Deals".
            
            CONTEXT:
            Current Date Context: ${currentTime}.
            Venue Location: ${cityString}.

            EXTRACTION RULES:
            1. HIGHLIGHTS: Identify 3-5 distinct items that define this place (e.g., "Signature Burger", "Flight of 4", "Taco Tuesday Special").
            2. DEALS: Extract any happy hour rules or time-based offers.
            3. SUMMARY: A 2-sentence vibe check of the menu (e.g., "Pub grub heavy on fryers but great selection of local drafts.").

            OUTPUT FORMAT (JSON ONLY):
            {
                "highlights": ["string"],
                "deals": [{ "title": "string", "details": "string" }],
                "menuSummary": "string",
                "sourceConfidence": number
            }
            `;
        } else if (target === 'NEWSLETTER') {
            prompt = `You are Schmidt, the Lead Architect of OlyBars.
            TASK: Extract key announcements from this text.
            
            CONTEXT:
            Current Date Context: ${currentTime}.
            
            EXTRACTION RULES:
            1. LOOK FOR: Closures, Grand Openings, New Menu Launches, Special Guests.
            2. IGNORE: Generic marketing fluff ("We create memories").
            3. OUTPUT: A concise bulleted list of ACTUAL news.
            
            OUTPUT FORMAT (JSON ONLY):
            {
                "newsItems": ["string"],
                "hasUrgentNews": boolean,
                "sourceConfidence": number
            }
            `;
        } else {
            // Default/Fallback
            prompt = `Analyze this text and extract key summary points relevant to nightlife. Output JSON: { "summary": string }`;
        }

        const response = await this.genAI.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{
                role: 'user',
                parts: [
                    { text: prompt },
                    { text: `RAW PAGE CONTENT:\n\n${rawContent.substring(0, 20000)}` } // Token clamp
                ]
            }],
            systemInstruction: { parts: [{ text: GeminiService.SCHMIDT_PERSONA }] },
            config: { response_mime_type: "application/json" }
        });

        let text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!text) return target === 'EVENTS' ? [] : null;
        text = text.replace(/```json\n?|```/g, '').trim();

        try {
            const result = JSON.parse(text);
            return result;
        } catch (e) {
            console.error("JSON Parse Error on Scraped Content Analysis:", text);
            return target === 'EVENTS' ? [] : null;
        }
    }
}

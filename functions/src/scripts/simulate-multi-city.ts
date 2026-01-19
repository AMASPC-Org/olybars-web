import { GeminiService } from '../services/geminiService';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from project root
const envPath = path.resolve(process.cwd(), '../.env');
dotenv.config({ path: envPath });

async function simulateMultiCity() {
    console.log("🏙️🚀 Simulating Multi-City Logic for Schmidt...");

    if (!process.env.GOOGLE_GENAI_API_KEY) {
        console.error("❌ GOOGLE_GENAI_API_KEY is missing!");
        process.exit(1);
    }

    const gemini = new GeminiService();
    const today = new Date().toISOString().split('T')[0];

    // TEST 1: TACOMA SCRAPE SIMULATION
    console.log("\n[SIMULATION 1] Tacoma Scraped Content Analysis");
    const tacomaRawText = `
        Join us at The Grit City Lounge this Friday for Live Jazz! 
        Located in the heart of Tacoma, 123 Pacific Ave.
        Event starts at 8 PM.
    `;
    const tacomaContext = { city: "Tacoma, WA", timezone: "America/Los_Angeles" };

    try {
        const events = await gemini.analyzeScrapedContent(tacomaRawText, today, tacomaContext, 'EVENTS');
        console.log("📊 Extracted Events:", JSON.stringify(events, null, 2));

        if (events.length > 0) {
            console.log("✅ SUCCESS: Schmidt extracted Tacoma events.");
        } else {
            console.warn("⚠️ No events extracted. Check prompt/content.");
        }
    } catch (e) {
        console.error("❌ Scrape Simulation Failed:", e);
    }

    // TEST 2: TACOMA DESCRIPTION GENERATION
    console.log("\n[SIMULATION 2] Tacoma Event Description Generation");
    try {
        const description = await gemini.generateEventDescription({
            venueName: "The Grit City Lounge",
            venueType: "Jazz Club",
            eventType: "Live Jazz Night",
            date: today,
            time: "20:00",
            city: "Tacoma, WA"
        });

        console.log("📝 Generated Description (Tacoma):", description);

        // Check for Tacoma-specific flavor (based on his new system instruction)
        if (description.toLowerCase().includes("tacoma") || description.toLowerCase().includes("grit")) {
            console.log("✅ SUCCESS: Description includes Tacoma/Grit City context!");
        } else {
            console.log("ℹ️ Description generated, but didn't explicitly mention the city (Schmidt may be subtle).");
        }
    } catch (e) {
        console.error("❌ Description Simulation Failed:", e);
    }
}

simulateMultiCity();

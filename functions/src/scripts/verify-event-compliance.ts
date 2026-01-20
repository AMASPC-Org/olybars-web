import { GeminiService } from '../services/geminiService';
import dotenv from 'dotenv';
import path from 'path';

// Reliable path resolution relative to process.cwd() (which is functions root)
// If we are in functions/, root is ../.env
const envPath = path.resolve(process.cwd(), '../.env');
console.log(`Debug: Loading .env from ${envPath}`);
dotenv.config({ path: envPath });

async function verifyEventCompliance() {
    console.log("🍹🚀 Verifying Event LCB Compliance...");

    if (!process.env.GOOGLE_GENAI_API_KEY) {
        console.error("❌ GOOGLE_GENAI_API_KEY is missing!");
        process.exit(1);
    }

    const gemini = new GeminiService();

    // TEST 1: Generation Pivot
    console.log("\n[TEST 1] Generation Pivot Check (Input: 'Bottomless Mimosas')");
    try {
        const description = await gemini.generateEventDescription({
            venueName: "The Tipsy Toad",
            venueType: "Dive Bar",
            eventType: "Bottomless Mimosa Brunch", // RISKY INPUT
            date: "2025-06-01",
            time: "11:00 AM",
            city: "Olympia, WA"
        });

        console.log("📝 Generated Description:", description);

        if (description.toLowerCase().includes("bottomless")) {
            console.error("❌ FAIL: Generated description still contains 'Bottomless'.");
        } else {
            console.log("✅ PASS: Artie pivoted away from 'Bottomless'.");
        }

    } catch (error) {
        console.error("❌ Generation Error:", error);
    }

    // TEST 2: Analysis Warning
    console.log("\n[TEST 2] Analysis Warning Check (Input: 'Bottomless Mimosas')");
    try {
        const analysis = await gemini.analyzeEvent({
            title: "Bottomless Mimosa Sunday",
            type: "Brunch",
            date: "2025-06-01",
            time: "11:00 AM", // Early, so Safe Ride isn't mandatory but Anti-Volume is
            description: "Drink all you can drink mimosas for $20!"
        });

        console.log("📊 Analysis Result:", JSON.stringify(analysis, null, 2));

        if (analysis.lcbWarning === true) {
            console.log("✅ PASS: LCB Warning triggered.");
        } else {
            console.error("❌ FAIL: LCB Warning NOT triggered for 'Bottomless'.");
        }

        if (analysis.summary.includes("314-52")) {
            console.log("✅ PASS: Citation (314-52) found in summary.");
        } else {
            console.log("⚠️ WARNING: Citation (314-52) NOT found in summary.");
        }

    } catch (error) {
        console.error("❌ Analysis Error:", error);
    }
}

verifyEventCompliance();

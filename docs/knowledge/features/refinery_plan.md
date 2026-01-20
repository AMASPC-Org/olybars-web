# Implementation Plan - OlyBars Data Refinery

The OlyBars Data Refinery is a specialized pipeline designed to ingest raw, messy data (text dumps, images, social media captures) and transform it into structured, high-quality JSON profiles for the OlyBars directory.

## Current Progress
- [x] Initialized `refinery/` project with Node.js, TypeScript, and `@google/genai`.
- [x] Defined `refinery/src/schema.ts` matching the "Holy Trinity" master specifications.
- [x] Implemented `refinery/src/refine.ts` - the core logic using Gemini 2.0 Flash for multimodal data extraction.
- [x] Configured `package.json` with a `npm run refine` script.
- [x] Created a test venue folder: `refinery/data/brotherhood_lounge/` with a sample `dump.txt` and `vibe.png`.

## Next Steps
1. **API Integration**: User needs to provide a `GEMINI_API_KEY` in `refinery/.env`.
2. **Grounding (Optional)**: If high accuracy is needed, we can integrate Google Search grounding using Vertex AI.
3. **Execution**: Run `npm run refine` from the `refinery` directory to process all venues.
4. **Integration**: Feed the resulting `data.json` files back into the main OlyBars database (/api/admin/onboard).

## Schema Overview
The refinery extracts the following sections:
1. **Identity**: Type (Bar/Restaurant), Age-Gate, Style, Scene Tags.
2. **Local Maker**: Local support, Makers, Products, Tap Count.
3. **Play**: Pool, Pinball, Arcade, Darts, etc.
4. **Features**: Sports setup, Comfort (Patio, Fireplace), Infrastructure (WiFi, Power), Payment.
5. **Kitchen**: Food service level, Close time, Late night food, Hero item.
6. **Vibe & Story**: Headline, Insider Vibe (40-60 words), Origin Story.
7. **Digital**: Socials, Newsletter, Action links.

## Usage
To process raw data:
1. Create a folder in `refinery/data/` for each venue (e.g., `refinery/data/mccoys_tavern`).
2. Drop raw text files (`dump.txt`) or images (`menu.jpg`) into that folder.
3. Run `npm run refine`.
4. Check `data.json` in the venue folder for the output.

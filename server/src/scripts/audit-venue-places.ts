import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findPlaceLocation } from '../utils/geocodingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const DATA_PATH = path.join(__dirname, '../data/venues_master.json');
const REPORT_PATH = path.join('C:/Users/USER1/.gemini/antigravity/brain/97ec7e1e-44a2-4d89-816d-36c04bf069a1', 'audit-results.md');
const DELAY_MS = 250;

/**
 * Normalizes addresses for easier comparison.
 */
function normalizeAddress(addr: string = ''): string {
    return addr
        .toLowerCase()
        .replace(/, usa$/i, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Sanitizes venue names by removing parenthetical notes.
 */
function sanitizeName(name: string): string {
    return name.replace(/\s*\(.*?\)\s*/g, ' ').trim();
}

async function runAudit() {
    console.log('🚀 [AUDIT] Starting Venue Database Audit...');

    if (!fs.existsSync(DATA_PATH)) {
        console.error(`❌ [AUDIT] Data file not found at ${DATA_PATH}`);
        return;
    }

    const venues = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    console.log(`📊 [AUDIT] Found ${venues.length} venues in database.`);

    const report: string[] = [
        '# Venue Database Audit Results',
        `Generated: ${new Date().toLocaleString()}`,
        '',
        '## Summary Stats',
    ];

    const results = {
        total: venues.length,
        matches: 0,
        mismatches: 0,
        ambiguous: 0,
        missingLocal: 0,
        notFound: 0,
        issues: [] as string[]
    };

    for (const venue of venues) {
        const cleanName = sanitizeName(venue.name);
        // We use name + city + state to bias the search correctly
        const query = `${cleanName}, Olympia, WA`;

        console.log(`🔍 [AUDIT] Checking: ${venue.name} (${venue.id})...`);

        try {
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
            const googleData = await findPlaceLocation(query);

            if (!googleData) {
                results.notFound++;
                results.issues.push(`- ❌ **NOT FOUND**: [${venue.name}](file://${DATA_PATH}) - Query: "${query}"`);
                continue;
            }

            const localPlaceId = venue.googlePlaceId;
            const remotePlaceId = googleData.placeId;
            const isAmbiguous = (googleData.candidateCount || 0) > 1;

            if (!localPlaceId) {
                results.missingLocal++;
                results.issues.push(`- ⚠️ **MISSING LOCAL ID**: [${venue.name}](file://${DATA_PATH}) - Google ID: \`${remotePlaceId}\``);
            } else if (localPlaceId !== remotePlaceId) {
                results.mismatches++;
                results.issues.push(`- 🚫 **MISMATCH**: [${venue.name}](file://${DATA_PATH}) - Local: \`${localPlaceId}\` | Google: \`${remotePlaceId}\``);
            } else {
                results.matches++;
            }

            if (isAmbiguous) {
                results.ambiguous++;
                results.issues.push(`- ❓ **AMBIGUOUS**: [${venue.name}](file://${DATA_PATH}) - Multiple candidates (${googleData.candidateCount}) returned by Google.`);
            }

            // Check address consistency
            const localAddr = normalizeAddress(venue.address);
            const remoteAddr = normalizeAddress(googleData.formattedAddress);
            if (localAddr && remoteAddr && !localAddr.includes(remoteAddr) && !remoteAddr.includes(localAddr)) {
                results.issues.push(`- 📍 **ADDRESS VARIANCE**: [${venue.name}](file://${DATA_PATH}) - Local: "${venue.address}" | Google: "${googleData.formattedAddress}"`);
            }

        } catch (error: any) {
            console.error(`❌ [AUDIT] Error auditing ${venue.name}:`, error.message);
            results.issues.push(`- 🔥 **ERROR**: [${venue.name}](file://${DATA_PATH}) - ${error.message}`);
        }
    }

    // Finalize report
    report.push(`- **Total Audited**: ${results.total}`);
    report.push(`- **Perfect Matches**: ${results.matches}`);
    report.push(`- **Place ID Mismatches**: ${results.mismatches}`);
    report.push(`- **Ambiguous Results**: ${results.ambiguous}`);
    report.push(`- **Missing Local IDs**: ${results.missingLocal}`);
    report.push(`- **Not Found on Google**: ${results.notFound}`);
    report.push('', '---', '', '## Detailed Issues', '');
    report.push(...results.issues);

    fs.writeFileSync(REPORT_PATH, report.join('\n'));
    console.log(`\n🎉 [AUDIT] Finished! Report saved to: ${REPORT_PATH}`);
}

runAudit().catch(console.error);

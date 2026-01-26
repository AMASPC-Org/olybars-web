import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
// In CommonJS, __filename and __dirname are already available globally.

// Safety: Clear emulator variables if running locally
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

const projectId = process.env.GOOGLE_CLOUD_PROJECT;

if (!projectId) {
    console.error("❌ CRTICAL ERROR: GOOGLE_CLOUD_PROJECT is not set.");
    console.error("   To prevent accidental production data wipes, this script requires an explicit target.");
    console.error("   Usage: cross-env GOOGLE_CLOUD_PROJECT=your-project-id npm run artie:sync");
    process.exit(1);
}

if (admin.apps.length === 0) {
    console.log(`📡 [CLOUD] TARGETING REMOTE PROJECT: ${projectId}`);
    admin.initializeApp({
        projectId: projectId
    });
}

const db = admin.firestore();

/**
 * Generates a safe document ID from a string using SHA-256 prefix.
 */
function generateSafeId(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex').substring(0, 32);
}

async function syncKnowledge() {
    try {
        // 1. Read Knowledge Base JSON
        const kbPath = path.join(__dirname, '..', 'knowledgeBase.json');
        const kb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));

        // 2. Sync Metadata (Persona, Directives, Protocols)
        const metadata = {
            persona: kb.persona,
            directives: kb.directives,
            skill_protocols: kb.skill_protocols,
            response_protocol: kb.response_protocol,
            technical_directives: kb.technical_directives || [],
            safety_and_compliance: kb.safety_and_compliance || [],
            glossary: kb.lore?.local_knowledge || {},
            updatedAt: new Date().toISOString()
        };

        console.log("Syncing Artie Metadata to config/artie_metadata...");
        await db.collection('config').doc('artie_metadata').set(metadata);

        const knowledgeItems: { question: string, answer: string, category: string }[] = [];

        // 3. Add FAQs
        kb.faq.forEach((f: { question: string, answer: string }) => knowledgeItems.push({ question: f.question, answer: f.answer, category: 'FAQ' }));

        // 4. Add History
        Object.entries(kb.history_timeline).forEach(([k, v]) => {
            knowledgeItems.push({ question: `History: ${k}`, answer: v as string, category: 'History' });
        });

        // 5. Add Market Context
        Object.entries(kb.market_context).forEach(([k, v]) => {
            knowledgeItems.push({ question: `Market: ${k}`, answer: v as string, category: 'Market' });
        });

        // 6. Add Local Knowledge (Glossary)
        if (kb.lore && kb.lore.local_knowledge) {
            Object.entries(kb.lore.local_knowledge).forEach(([k, v]) => {
                knowledgeItems.push({ question: `Glossary: ${k}`, answer: v as string, category: 'Glossary' });
            });
        }

        // 7. Add Bar Games
        if (kb.bar_games) {
            kb.bar_games.forEach((cat: any) => {
                cat.games.forEach((g: any) => {
                    knowledgeItems.push({
                        question: `Game / Activity: ${g.name} (${cat.category})`,
                        answer: `${g.description} Tags: ${g.tags.join(', ')}`,
                        category: 'Games'
                    });
                });
            });
        }

        const batch = db.batch();
        const knowledgeCol = db.collection('knowledge');
        const currentIds = new Set<string>();

        // Overwrite/Update knowledge items
        knowledgeItems.forEach(item => {
            const docId = generateSafeId(item.question);
            currentIds.add(docId);
            batch.set(knowledgeCol.doc(docId), {
                ...item,
                updatedAt: new Date().toISOString()
            });
        });

        console.log("Cleaning up orphaned knowledge records...");
        const existingDocs = await knowledgeCol.get();
        existingDocs.forEach(doc => {
            if (!currentIds.has(doc.id)) {
                batch.delete(doc.ref);
            }
        });

        console.log("Committing batch to Firestore...");

        // [FINOPS] Race condition protection with 10s Timeout
        const commitPromise = batch.commit();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Firestore Batch Commit Timeout (10s reached). Check network/auth.")), 10000)
        );

        await Promise.race([commitPromise, timeoutPromise]);
        console.log(`✅ Synced metadata and ${knowledgeItems.length} items to Firestore.`);

    } catch (error) {
        console.error("❌ Sync Failed:", error);
        process.exit(1);
    }
}

syncKnowledge();

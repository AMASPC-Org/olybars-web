
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// --- THE AUDITOR'S CHECKLIST ---
const CHECKS = [
    { id: 'CLI_TOOLS', name: 'Required CLI Tools', command: 'gcloud --version && firebase --version' },
    { id: 'AUTH_STATE', name: 'GCP Authentication', command: 'gcloud auth list --filter=status:ACTIVE --format="value(account)"' },
    { id: 'API_ENABLED_SM', name: 'API: Secret Manager', command: 'gcloud services list --enabled --filter="config.name:secretmanager.googleapis.com" --format="value(config.name)"' },
    { id: 'API_ENABLED_CB', name: 'API: Cloud Build', command: 'gcloud services list --enabled --filter="config.name:cloudbuild.googleapis.com" --format="value(config.name)"' },
    { id: 'API_ENABLED_CR', name: 'API: Cloud Run', command: 'gcloud services list --enabled --filter="config.name:run.googleapis.com" --format="value(config.name)"' },
    { id: 'SECRET_ACCESS_PROD', name: 'IAM: Prod Secret Accessor', command: 'gcloud projects get-iam-policy ama-ecosystem-prod --flatten="bindings[].members" --filter="bindings.role:roles/secretmanager.secretAccessor AND bindings.members:serviceAccount:26629455103-compute@developer.gserviceaccount.com" --format="value(bindings.role)"' },
    { id: 'SECRET_EXISTENCE', name: 'Secrets Existence', command: 'gcloud secrets list --project=ama-ecosystem-prod --format="value(name)"' }
];

const CREDENTIALS_CHECK = [
    'GOOGLE_BROWSER_KEY',
    'GOOGLE_GENAI_API_KEY',
    'GOOGLE_BACKEND_KEY',
    'INTERNAL_HEALTH_TOKEN',
    'MASTER_SETUP_KEY'
];

async function runAudit() {
    console.log('\n🕵️  --- STARTING INFRASTRUCTURE AUDIT ---\n');
    let issuesFound = 0;

    // 1. SYSTEM CHECKS
    for (const check of CHECKS) {
        process.stdout.write(`[...] ${check.name}...`);
        try {
            const output = execSync(check.command, { stdio: 'pipe' }).toString().trim();
            if (output) {
                console.log(`\r[✅] ${check.name}`);
            } else {
                console.log(`\r[❌] ${check.name} - FAIL (No output/Empty)`);
                issuesFound++;
            }
        } catch (error: any) {
            console.log(`\r[❌] ${check.name} - ERROR: ${error.message.split('\n')[0]}`);
            issuesFound++;
        }
    }

    // 2. SECRET CONTENT CHECK (Existence Only)
    console.log('\n🔐 --- SECRET INVENTORY CHECK ---');
    try {
        const secretList = execSync('gcloud secrets list --project=ama-ecosystem-prod --format="value(name)"').toString();
        CREDENTIALS_CHECK.forEach(secret => {
            if (secretList.includes(secret)) {
                console.log(`[✅] Secret Present: ${secret}`);
            } else {
                console.log(`[❌] MISSING SECRET: ${secret}`);
                issuesFound++;
            }
        });
    } catch (e) {
        console.log('[❌] Failed to list secrets.');
        issuesFound++;
    }

    // 3. DATABASE CONNECTIVITY SIMULATION (Configuration Check)
    console.log('\n💾 --- DATABASE CONFIGURATION ---');
    const firebaseJsonPath = path.resolve('firebase.json');
    if (fs.existsSync(firebaseJsonPath)) {
        console.log('[✅] firebase.json found');
    } else {
        console.log('[❌] firebase.json MISSING');
        issuesFound++;
    }

    // SUMMARY
    console.log('\n---------------------------------------------------');
    if (issuesFound === 0) {
        console.log('🎉  AUDIT PASSED: Pipeline is HEALTHY.');
        console.log('    You are ready to deploy.');
    } else {
        console.log(`⚠️  AUDIT FAILED: Found ${issuesFound} issues.`);
        console.log('    Refactor required before deployment.');
    }
    console.log('---------------------------------------------------\n');
}

runAudit();

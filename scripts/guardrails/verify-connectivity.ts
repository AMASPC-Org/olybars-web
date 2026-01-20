
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import http from 'http';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

const TARGET_ENV = process.argv[2] as 'local' | 'development' | 'production';

if (!TARGET_ENV || !['local', 'development', 'production'].includes(TARGET_ENV)) {
    console.error('❌ Usage: tsx scripts/guardrails/verify-connectivity.ts <local|development|production>');
    process.exit(1);
}

const MAX_RETRIES = 5;

async function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function ping(url: string, options: any = {}): Promise<{ ok: boolean; status?: number; data?: any; error?: string }> {
    const protocol = url.startsWith('https') ? https : http;

    return new Promise((resolve) => {
        const req = protocol.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                // Determine if 'ok' based on environment
                // For local emulators, a 404/403 just means the port is LISTENING which is enough for 'Alive'
                const isLocal = url.includes('localhost');
                const isHealthy = res.statusCode && res.statusCode >= 200 && res.statusCode < 400;
                const isResponding = res.statusCode && res.statusCode < 500;

                if (isHealthy || (isLocal && isResponding)) {
                    resolve({ ok: true, status: res.statusCode });
                } else {
                    resolve({ ok: false, status: res.statusCode, error: `Status ${res.statusCode}: ${data.substring(0, 100)}` });
                }
            });
        });

        req.on('error', (e) => {
            resolve({ ok: false, error: e.message });
        });

        req.setTimeout(5000, () => {
            req.destroy();
            resolve({ ok: false, error: 'TIMEOUT (5s)' });
        });

        req.end();
    });
}

async function pingWithRetry(name: string, url: string, options: any = {}): Promise<boolean> {
    console.log(`📡 Checking ${name}: ${url}...`);

    for (let i = 1; i <= MAX_RETRIES; i++) {
        const result = await ping(url, options);
        if (result.ok) {
            console.log(`✅ [OK] ${name} responds ${result.status ? `(Status: ${result.status})` : ''}`);
            return true;
        }

        if (i < MAX_RETRIES) {
            // Exponential backoff with jitter
            const baseDelay = 1000 * Math.pow(2, i - 1);
            const jitter = Math.random() * 1000;
            const delay = baseDelay + jitter;

            console.warn(`⚠️ [RETRY ${i}/${MAX_RETRIES}] ${name} failed: ${result.error || 'Connection Refused'}. Retrying in ${(delay / 1000).toFixed(1)}s...`);
            await wait(delay);
        } else {
            console.error(`❌ [FAILED] ${name} reached max retries. Final Error: ${result.error || 'Connection Refused'}`);
            return false;
        }
    }
    return false;
}

async function runLocalChecks() {
    console.log('\n🏠 [LOCAL] Verifying Local Stack connectivity...');

    let ports = { auth: 9099, firestore: 8080, functions: 5001 };
    try {
        const firebaseJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'firebase.json'), 'utf8'));
        ports.auth = firebaseJson.emulators?.auth?.port || ports.auth;
        ports.firestore = firebaseJson.emulators?.firestore?.port || ports.firestore;
        ports.functions = firebaseJson.emulators?.functions?.port || ports.functions;
    } catch (e) {
        console.warn('⚠️ Could not parse firebase.json, using defaults.');
    }

    const checks: { name: string, url: string, options?: any }[] = [
        { name: 'Firebase Auth Emulator', url: `http://localhost:${ports.auth}` },
        { name: 'Firebase Firestore Emulator', url: `http://localhost:${ports.firestore}` },
        { name: 'Firebase Functions Emulator', url: `http://localhost:${ports.functions}` },
        { name: 'Backend Express Server', url: `http://localhost:${process.env.PORT || 3001}/health` },
        { name: 'Frontend Proxy Path', url: 'http://localhost:3000/api/health' }
    ];

    let allOk = true;
    for (const check of checks) {
        const ok = await pingWithRetry(check.name, check.url, check.options);
        if (!ok) allOk = false;
    }

    if (!allOk) {
        console.error('\n❌ [CRITICAL] Local stack is partially disconnected.');
        console.error('👉 Ensure you ran "npm run dev:all" and emulators are warm.');
        process.exit(1);
    }

    console.log('\n✨ [SUCCESS] Local stack is fully connected and talking.');
}

async function runCloudChecks(env: 'development' | 'production') {
    const projectId = env === 'development' ? 'ama-ecosystem-dev-9ceda' : 'ama-ecosystem-prod';
    const serviceName = 'olybars-backend';
    const region = 'us-west1';

    console.log(`\n☁️ [${env.toUpperCase()}] Verifying Cloud Connectivity for ${projectId}...`);

    let serviceUrl = '';
    try {
        serviceUrl = execSync(`gcloud run services describe ${serviceName} --project ${projectId} --region ${region} --format="value(status.url)"`, { encoding: 'utf8' }).trim();
    } catch (e: any) {
        console.error('❌ Failed to resolve Cloud Run URL.');
        process.exit(1);
    }

    let internalToken = process.env.INTERNAL_HEALTH_TOKEN;
    if (!internalToken) {
        try {
            const envContent = fs.readFileSync(path.join(rootDir, '.env'), 'utf8');
            const match = envContent.match(/INTERNAL_HEALTH_TOKEN=([^\s]+)/);
            if (match) internalToken = match[1];
        } catch (e) { }
    }

    const checks: { name: string, url: string, options?: any }[] = [
        { name: 'Public Health Check', url: `${serviceUrl}/health` },
        { name: 'Firebase Functions V2 Smoke', url: `https://${region}-${projectId}.cloudfunctions.net/smokeTest` }
    ];

    if (internalToken) {
        checks.push({
            name: 'Deep Artie Integrity',
            url: `${serviceUrl}/api/health/artie`,
            options: { headers: { 'X-Internal-Token': internalToken } }
        });
    }

    let allOk = true;
    for (const check of checks) {
        const ok = await pingWithRetry(check.name, check.url, check.options);
        if (!ok) allOk = false;
    }

    if (!allOk) {
        console.error('\n❌ [CRITICAL] Cloud environment has connectivity issues.');
        process.exit(1);
    }

    console.log(`\n✨ [SUCCESS] ${env.toUpperCase()} environment is live and reachable.`);
}

if (TARGET_ENV === 'local') {
    runLocalChecks();
} else {
    runCloudChecks(TARGET_ENV);
}

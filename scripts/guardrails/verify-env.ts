
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

const TARGET_ENV = process.argv[2] as 'local' | 'development' | 'production';

if (!TARGET_ENV || !['local', 'development', 'production'].includes(TARGET_ENV)) {
    console.error('❌ Usage: tsx scripts/guardrails/verify-env.ts <local|development|production>');
    process.exit(1);
}

// 0. ESCAPE HATCH
if (process.env.SKIP_GUARDRAIL === 'true') {
    console.warn('⚠️ [GUARDRAIL] SKIP_GUARDRAIL is set to true. Bypassing checks.');
    process.exit(0);
}

console.log(`🛡️ [GUARDRAIL] Verifying environment: ${TARGET_ENV.toUpperCase()}...`);

// 1. LOCAL CHECKS (Localhost)
if (TARGET_ENV === 'local') {
    verifyLocalEnv();
}
// 2. CLOUD CHECKS (Dev/Prod)
else {
    verifyCloudEnv(TARGET_ENV);
}

async function verifyLocalEnv() {
    const envPath = path.join(rootDir, '.env');

    // Check .env existence
    if (!fs.existsSync(envPath)) {
        console.error('❌ [FATAL] .env file is missing!');
        console.error(`   Expected at: ${envPath}`);
        console.error('   Please copy .env.example to .env and fill in the required values.');
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const tempEnv: Record<string, string> = {};

    // Robust parsing for both Windows and Linux line endings
    envContent.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            // Handle optional quotes around values
            const value = match[2].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
            tempEnv[key] = value;
        }
    });

    console.log('📝 Validating local .env against Unified Schema...');
    console.log(`📝 Identified ${Object.keys(tempEnv).length} keys in .env`);

    const errors: string[] = [];
    const { RequiredKeys } = await import('./schema-loader');

    const missingKeys = RequiredKeys.filter(key => {
        const val = process.env[key] || tempEnv[key];
        return val === undefined || val === null || val === '';
    });

    if (missingKeys.length > 0) {
        errors.push(`[MISSING] The following required variables are missing:`);
        missingKeys.forEach(k => errors.push(`   - ${k}`));
    }

    if (errors.length > 0) {
        console.error('❌ [FAILED] Local Environment Validation Failed:');
        errors.forEach(e => console.error(`   ${e}`));
        console.error('\n👉 Fix your .env file to match server/src/appConfig/schema.ts');
        process.exit(1);
    }

    console.log('✅ [PASS] Local .env schema validation passed.');
}

async function verifyCloudEnv(env: 'development' | 'production') {
    const projectId = env === 'development' ? 'ama-ecosystem-dev-9ceda' : 'ama-ecosystem-prod';
    const serviceName = 'olybars-backend';
    const region = 'us-west1';

    console.log(`☁️  Inspecting Cloud Run Service: ${serviceName} [${projectId}]...`);

    const { RequiredKeys } = await import('./schema-loader');

    try {
        const cmd = `gcloud run services describe ${serviceName} --project ${projectId} --region ${region} --format="json"`;
        const output = execSync(cmd, { encoding: 'utf8' });
        const serviceConfig = JSON.parse(output);

        const containers = serviceConfig.spec?.template?.spec?.containers;
        if (!containers || containers.length === 0) {
            throw new Error('No containers found in Cloud Run spec.');
        }

        const cloudEnvVars = containers[0].env || [];
        const cloudKeys = new Set(cloudEnvVars.map((e: any) => e.name));

        const missingRequired = RequiredKeys.filter(key => {
            if (key.startsWith('VITE_')) return false; // Backend doesn't strictly need VITE_ keys (though some might be shared)
            // Actually, if Schema says required, it should be there. 
            // But VITE_ keys are often build-time for frontend.
            // We ignore VITE_ keys for Cloud Run backend check to avoid false positives.
            return !cloudKeys.has(key);
        });

        if (missingRequired.length > 0) {
            console.error('❌ [FAILED] Cloud Run Environment Validation Failed:');
            console.error(`   The following REQUIRED keys are missing from the ${serviceName} configuration:`);
            missingRequired.forEach(k => console.error(`   - ${k}`));
            console.error('\n👉 Run "gcloud run services update" or use the Firebase/Console UI to add these secrets.');
            process.exit(1);
        }

        console.log('✅ [PASS] Cloud Run configuration contains all required backend keys.');

    } catch (error: any) {
        console.error('❌ [ERROR] Failed to fetch Cloud Run config.');
        console.error(`   Ensure you have permissions for project: ${projectId}`);
        console.error(`   Error: ${error.message}`);
        process.exit(1);
    }
}

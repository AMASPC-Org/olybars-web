
import { execSync } from 'child_process';
import path from 'path';

const TARGET_ENV = process.argv[2] as 'local' | 'development' | 'production';

if (!TARGET_ENV || !['local', 'development', 'production'].includes(TARGET_ENV)) {
    console.error('❌ Usage: tsx scripts/guardrails/verify-permissions.ts <local|development|production>');
    process.exit(1);
}

// Map Environments to Allowed Projects
const ALLOWED_PROJECTS = {
    development: ['ama-ecosystem-dev-9ceda'],
    production: ['ama-ecosystem-prod'],
    local: ['ama-ecosystem-dev-9ceda', 'ama-ecosystem-prod'] // Local can query either, but usually dev is safer
};

console.log(`🛡️ [GUARDRAIL] Verifying IAM Context for: ${TARGET_ENV.toUpperCase()}...`);

try {
    // 1. Get Current GCP Project
    const projectCmd = 'gcloud config get-value project';
    const currentProject = execSync(projectCmd, { encoding: 'utf8' }).trim();

    console.log(`   Active Project: ${currentProject}`);

    if (!currentProject) {
        console.error('❌ [FAILED] No active Google Cloud Project found.');
        console.error('   Run "gcloud config set project [PROJECT_ID]" to set context.');
        process.exit(1);
    }

    const allowed = ALLOWED_PROJECTS[TARGET_ENV];
    if (!allowed.includes(currentProject)) {
        console.error(`❌ [FAILED] DANGEROUS CONTEXT DETECTED!`);
        console.error(`   You are targeting environment "${TARGET_ENV}"`);
        console.error(`   But your gcloud context is set to "${currentProject}"`);
        console.error(`   Allowed projects: ${allowed.join(', ')}`);
        console.error('\n👉 Run "gcloud config set project [CORRECT_PROJECT]" to fix.');
        process.exit(1);
    }

    // 2. Get Active Account (Audit only)
    const accountCmd = 'gcloud config get-value account';
    const currentAccount = execSync(accountCmd, { encoding: 'utf8' }).trim();
    console.log(`   Active Account: ${currentAccount}`);

    console.log('✅ [PASS] IAM Context matches target environment.');

} catch (error: any) {
    console.error('❌ [ERROR] Failed to verify IAM context.');
    console.error(`   ${error.message}`);
    process.exit(1);
}

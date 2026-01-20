import { ConfigSchema } from '../server/src/appConfig/schema';
import { loadLocalEnv } from '../server/src/appConfig/localEnv';

async function verifySecurity() {
    console.log('--- 1. Verification of Production Env Blocking ---');
    process.env.NODE_ENV = 'production';
    loadLocalEnv();
    // This should log "⚠️ [CONFIG] Attempted to load dotenv in production"

    console.log('\n--- 2. Verification of Schema Validation (Secrets Redacted) ---');
    try {
        ConfigSchema.parse({ NODE_ENV: 'production' });
    } catch (e: any) {
        process.stdout.write('Got expected validation error.\n');
        if (e.issues) {
            e.issues.forEach((err: any) => {
                process.stdout.write(`   - ${err.path.join('.')}: ${err.message}\n`);
            });
        }
    }

    console.log('\n--- 3. Verification of Health Check Auth Logic ---');
    // Simulate the logic in index.ts
    const testAuth = (token?: string, env: string = 'production') => {
        const expectedToken = 'secure-token';
        const isAuthorized = !(token !== expectedToken && env !== 'development');
        console.log(`Env: ${env}, Token: ${token || 'None'} -> Authorized: ${isAuthorized}`);
    };

    testAuth(undefined, 'production'); // False
    testAuth('wrong-token', 'production'); // False
    testAuth('secure-token', 'production'); // True
    testAuth(undefined, 'development'); // True (relaxed for local dev)
}

verifySecurity();

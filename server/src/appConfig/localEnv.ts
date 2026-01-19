import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { isProduction } from './schema.js';

/**
 * Loads local .env files anchored to the repository root.
 * HARD-BLOCKED in production to ensure deterministic Secret Manager/ADC runtime configuration.
 */
export function loadLocalEnv() {
    if (isProduction()) {
        console.warn('⚠️ [CONFIG] Dotenv load requested in PRODUCTION. Hard-blocking to prevent configuration drift.');
        return;
    }

    // CTO Constraint: Anchor to repo root, not CWD, to handle subfolder execution (Antigravity/Emulators).
    const REPO_ROOT = 'c:/Users/USER1/olybars';

    // Deterministic order: .env.local (primary overrides) > .env (base defaults/example)
    const files = [
        'secrets/development.env',
        '.env.local',
        '.env'
    ];

    let filesLoaded = 0;
    files.forEach(file => {
        const fullPath = path.resolve(REPO_ROOT, file);
        if (fs.existsSync(fullPath)) {
            console.log(`📡 [CONFIG] Loading local environment: ${file} (Root-Anchored)`);
            dotenv.config({ path: fullPath });
            filesLoaded++;
        }
    });

    if (filesLoaded === 0) {
        console.warn('⚠️ [CONFIG] No local .env.local or .env files detected at repo root.');
    }
}

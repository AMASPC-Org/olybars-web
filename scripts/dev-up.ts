import { spawn, execSync } from 'child_process';
import { platform } from 'os';

/**
 * dev-up.ts
 * "The Artie Pulse" - Safe Localhost Restoration
 * 
 * This script carefully restores the local development stack without breaking 
 * unrelated processes. It handles port clearage, environment resets, and 
 * service orchestration.
 */

const PORTS = [3000, 3001, 8080, 9099, 5001];
const IS_WINDOWS = platform() === 'win32';

async function heal() {
    console.log('\n🚀 [Artie Pulse] Initiating Safe Localhost Restoration...');

    // 1. Clear Environmental Poison
    // We force development mode for this process and any children
    process.env.NODE_ENV = 'development';
    process.env.PORT = '3001';
    console.log('✅ Environment sanitized to: development (PORT: 3001)');

    // 2. Targeted Port Clearance
    // Instead of killing ALL node processes, we only kill those on our dev ports
    console.log('🔍 Checking for port contention...');
    for (const port of PORTS) {
        try {
            const command = IS_WINDOWS
                ? `netstat -ano | findstr :${port}`
                : `lsof -i :${port} -t`;

            const output = execSync(command).toString().trim();
            if (output) {
                console.log(`⚠️ Port ${port} is occupied. Clearing process...`);
                const pid = IS_WINDOWS
                    ? output.split('\n')[0].trim().split(/\s+/).pop()
                    : output.split('\n')[0];

                if (pid) {
                    execSync(IS_WINDOWS ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`);
                    console.log(`✅ Cleared process ${pid} on port ${port}.`);
                }
            }
        } catch (e) {
            // Port is likely free, which is good
        }
    }

    // 3. Service Orchestration
    console.log('\n📡 Starting Local Stack...');

    // A. Firebase Emulators
    const emulator = startService('Firebase Emulators', 'npx firebase emulators:start');

    // Wait for emulator to warm up before seeding
    console.log('⏳ Waiting for Emulators to warm up (5s)...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // B. Local Seeding
    console.log('🌱 Seeding local database...');
    try {
        execSync('node --import tsx server/src/seed.ts', {
            stdio: 'inherit',
            env: {
                ...process.env,
                NODE_ENV: 'development'
            }
        });
    } catch (e) {
        console.warn('⚠️ Seed warning - continue if data is already present.');
    }

    // C. Backend Server
    startService('Backend Server', 'npm run server');

    // D. Frontend (Vite)
    startService('Frontend (Vite)', 'npm run dev');

    console.log('\n✨ All services are warming up. Check localhost:3000 in a few seconds!');
    process.exit(0);
}

function startService(name: string, command: string) {
    console.log(` -> Launching ${name}...`);
    const [cmd, ...args] = command.split(' ');

    // Using spawn with detached:true and stdio:ignore lets them live outside this script
    const child = spawn(cmd, args, {
        shell: true,
        detached: true,
        stdio: 'ignore',
        env: {
            ...process.env,
            NODE_ENV: 'development'
        }
    });

    child.unref(); // Allow the parent (this script) to exit while child lives
}

heal().catch(err => {
    console.error('❌ Error during restoration:', err);
    process.exit(1);
});

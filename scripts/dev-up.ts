import { spawn, execSync } from "child_process";
import { platform } from "os";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv"; // Import ONLY

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// [GUARDRAIL] Force-load .env to overwrite any stale shell variables (e.g. from previous prod deploys)
dotenv.config({ path: path.join(rootDir, ".env"), override: true });

const PORTS = [3000, 3001, 8080, 9099, 5001];
const IS_WINDOWS = platform() === "win32";
const LOG_DIR = path.join(rootDir, ".logs");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

function clearPort(port: number) {
  try {
    const command = IS_WINDOWS
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} -t`;

    const output = execSync(command).toString().trim();
    if (output) {
      const pids = new Set(
        output
          .split(/\r?\n/)
          .map((line) => line.trim().split(/\s+/).pop())
          .filter((pid) => pid && !isNaN(parseInt(pid))),
      );

      for (const pid of pids) {
        try {
          execSync(IS_WINDOWS ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`, {
            stdio: "ignore",
          });
        } catch (e) {}
      }
    }
  } catch (e) {}
}

async function heal() {
  console.log("\n🚀 [Artie Pulse] Initiating Safe Localhost Restoration...");

  // 0. Pre-flight Guardrail
  console.log("🛡️  Running Environmental Guardrail...");
  try {
    execSync("npm run guardrail:local", { stdio: "inherit" });
  } catch (e) {
    console.error(
      "\n❌ [STOP] Your .env is invalid. Fix it before running dev:all.",
    );
    process.exit(1);
  }

  // 1. Set global env
  process.env.NODE_ENV = "development";
  process.env.PORT = "3001";
  // IMPORTANT: Tell seed.ts and others to use emulators explicitly
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
  process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = "127.0.0.1:5001";

  // 2. Clear ports
  console.log("🔍 Clearing dev ports...");
  PORTS.forEach(clearPort);

  // 3. Service Orchestration
  console.log("\n📡 Starting Local Stack...");

  // A. Firebase Emulators
  // [GUARDRAIL] Inject Project ID to prevent 'prod' fallback
  const projectFlag = `--project ${process.env.GOOGLE_CLOUD_PROJECT}`;
  startService(
    "emulators",
    IS_WINDOWS
      ? `npx.cmd firebase emulators:start ${projectFlag}`
      : `npx firebase emulators:start ${projectFlag}`,
  );

  console.log("⏳ Waiting for Emulators to warm up (15s)...");
  await new Promise((resolve) => setTimeout(resolve, 15000));

  // B. Local Seeding
  console.log("🌱 Seeding local database...");
  execSync("node --import tsx server/src/seed.ts", {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "development" },
  });

  // C. Backend Server
  startService("backend", IS_WINDOWS ? "npm.cmd run server" : "npm run server");

  // D. Frontend (Vite)
  startService("frontend", IS_WINDOWS ? "npm.cmd run dev" : "npm run dev");

  // E. Guardrail Connectivity Check
  console.log("\n🩺 Running final connectivity check (Wait 12s)...");
  await new Promise((resolve) => setTimeout(resolve, 12000));

  try {
    execSync("npm run guardrail:conn:local", { stdio: "inherit" });
    console.log(
      "\n✨ [ALL CLEAR] Local stack is healthy. Pulse detected at localhost:3000",
    );
  } catch (e) {
    console.error("\n❌ Connectivity check failed. Inspect logs for details.");
    console.error(`👉 Logs: ${LOG_DIR}`);
  }

  process.exit(0);
}

function startService(id: string, command: string) {
  console.log(` -> Launching ${id}...`);

  const logFile = path.join(LOG_DIR, `${id}.log`);
  fs.writeFileSync(
    logFile,
    `--- LOG START: ${new Date().toISOString()} ---\nCMD: ${command}\n\n`,
  );

  const out = fs.openSync(logFile, "a");
  const err = fs.openSync(logFile, "a");

  // For Windows 'shell: true', passing the full string is often better
  const child = spawn(command, [], {
    shell: true,
    detached: true,
    stdio: ["ignore", out, err],
    env: { ...process.env, NODE_ENV: "development" },
  });

  child.unref();
}

heal().catch((err) => {
  console.error("❌ Error during restoration:", err);
  process.exit(1);
});

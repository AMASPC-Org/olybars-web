import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { isProduction } from "./schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads local .env files anchored to the repository root.
 * HARD-BLOCKED in production to ensure deterministic Secret Manager/ADC runtime configuration.
 */
export function loadLocalEnv() {
  if (isProduction()) {
    console.warn(
      "⚠️ [CONFIG] Dotenv load requested in PRODUCTION. Hard-blocking to prevent configuration drift.",
    );
    return;
  }

  // Anchor to repo root using relative path from this file
  // this file is in server/src/appConfig
  // repo root is 3 levels up: server/src/appConfig -> server/src -> server -> root
  const REPO_ROOT = path.resolve(__dirname, "../../..");

  // Deterministic order: .env.local (primary overrides) > .env (base defaults/example)
  const files = [
    "secrets/development.env",
    ".env.local",
    ".env.development", // Match frontend project configuration
    ".env",
  ];

  let filesLoaded = 0;
  files.forEach((file) => {
    const fullPath = path.resolve(REPO_ROOT, file);
    if (fs.existsSync(fullPath)) {
      console.log(`📡 [CONFIG] Loading local environment: ${file}`);
      dotenv.config({ path: fullPath, override: true });
      filesLoaded++;
    }
  });

  if (filesLoaded === 0) {
    // Silent in CI/Cloud build if we are trying to build there
    // But helpful for local dev
    console.warn(
      "⚠️ [CONFIG] No local .env.local or .env files detected at repo root.",
    );
  }
}

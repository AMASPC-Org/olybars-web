import path from "path";
import fs from "fs";
import dotenv from "dotenv";

/**
 * Loads environment variables from a .env file.
 * This function avoids hardcoding absolute paths.
 */
export const loadLocalEnv = () => {
  // Only load .env files in non-production environments
  if (process.env.NODE_ENV === "production") {
    return;
  }

  try {
    // Resolve path relative to THIS file (helpers/envLoader.ts)
    // Compiled to: functions/dist/config/envLoader.js
    // Path to root .env: ../../../.env
    const envPath = path.resolve(__dirname, "../../../.env");

    if (fs.existsSync(envPath)) {
      const result = dotenv.config({ path: envPath });
      if (result.error) {
        console.warn("⚠️ [ENV] Failed to parse .env file:", result.error);
      } else {
        console.log("✅ [ENV] Loaded local environment configuration.");
      }
    } else {
      console.log("ℹ️ [ENV] No .env file found (skipping).");
    }
  } catch (err) {
    console.warn("⚠️ [ENV] Error loading .env file:", err);
  }
};

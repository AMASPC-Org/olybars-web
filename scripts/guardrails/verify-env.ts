import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");

const TARGET_ENV = process.argv[2] as "local" | "development" | "production";

if (
  !TARGET_ENV ||
  !["local", "development", "production"].includes(TARGET_ENV)
) {
  console.error(
    "❌ Usage: tsx scripts/guardrails/verify-env.ts <local|development|production>",
  );
  process.exit(1);
}

// 0. ESCAPE HATCH
if (process.env.SKIP_GUARDRAIL === "true") {
  console.warn(
    "⚠️ [GUARDRAIL] SKIP_GUARDRAIL is set to true. Bypassing checks.",
  );
  process.exit(0);
}

console.log(
  `🛡️ [GUARDRAIL] Verifying environment: ${TARGET_ENV.toUpperCase()}...`,
);

// 1. LOCAL CHECKS (Localhost)
if (TARGET_ENV === "local") {
  verifyLocalEnv();
}
// 2. CLOUD CHECKS (Dev/Prod)
else {
  verifyCloudEnv(TARGET_ENV);
}

async function verifyLocalEnv() {
  // 1. Load all relevant environment files to ensure we capture VITE_ keys (often in .env.development)
  // Priority: .env.local (overrides) > .env.development > .env
  // We read them in order and let them overwrite, or just read all.
  // For triangulation, we just need the values to exist.
  const envFiles = [".env", ".env.development", ".env.local"];
  const tempEnv: Record<string, string> = {};

  console.log("📝 Loading local environment files...");

  envFiles.forEach((file) => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`   - Loaded ${file}`);
      const content = fs.readFileSync(filePath, "utf8");
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;

        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2]
            .trim()
            .replace(/^"(.*)"$/, "$1")
            .replace(/^'(.*)'$/, "$1");
          tempEnv[key] = value;
        }
      });
    }
  });

  // --- [GUARDRAIL] TRIANGULATION CHECK ---
  const backendId = tempEnv["GOOGLE_CLOUD_PROJECT"];
  const frontendId = tempEnv["VITE_FIREBASE_PROJECT_ID"];

  // Read .firebaserc for Infrastructure Truth
  const firebasercPath = path.join(rootDir, ".firebaserc");
  let infrastructureId = "unknown";
  if (fs.existsSync(firebasercPath)) {
    try {
      const rc = JSON.parse(fs.readFileSync(firebasercPath, "utf8"));
      // Local development should align with the 'staging' alias (dev project)
      infrastructureId = rc.projects?.staging;
    } catch (e) {
      console.warn("⚠️ Could not parse .firebaserc");
    }
  }

  console.log(`🔍 Triangulating Environmental Constants:`);
  console.log(`   Backend (GOOGLE_CLOUD_PROJECT):      ${backendId}`);
  console.log(`   Frontend (VITE_FIREBASE_PROJECT_ID): ${frontendId}`);
  console.log(`   Infra (.firebaserc:staging):         ${infrastructureId}`);

  if (!backendId || !frontendId || !infrastructureId) {
    console.error(
      "❌ [FATAL] Missing critical environment variables for triangulation.",
    );
    process.exit(1);
  }

  if (backendId !== frontendId || backendId !== infrastructureId) {
    console.error("\n❌ [FATAL] SPLIT-BRAIN ENVIRONMENT DETECTED");
    console.error(
      "   The Frontend, Backend, and Infrastructure configurations MUST match.",
    );
    console.error("   This is the root cause of 401 Unauthorized errors.");
    console.error(
      "\n   Resolution: Update your .env or .firebaserc so all IDs are identical.",
    );
    process.exit(1);
  }
  console.log("✅ [PASS] Environment Triangulation Verified (No Split-Brain).");
  // ---------------------------------------

  console.log("📝 Validating local .env against Unified Schema...");
  console.log(`📝 Identified ${Object.keys(tempEnv).length} keys in .env`);

  const errors: string[] = [];
  const { RequiredKeys } = await import("./schema-loader");

  const missingKeys = RequiredKeys.filter((key) => {
    const val = process.env[key] || tempEnv[key];
    return val === undefined || val === null || val === "";
  });

  if (missingKeys.length > 0) {
    errors.push(`[MISSING] The following required variables are missing:`);
    missingKeys.forEach((k) => errors.push(`   - ${k}`));
  }

  if (errors.length > 0) {
    console.error("❌ [FAILED] Local Environment Validation Failed:");
    errors.forEach((e) => console.error(`   ${e}`));
    console.error(
      "\n👉 Fix your .env file to match server/src/appConfig/schema.ts",
    );
    process.exit(1);
  }

  console.log("✅ [PASS] Local .env schema validation passed.");
}

async function verifyCloudEnv(env: "development" | "production") {
  const projectId =
    env === "development" ? "ama-ecosystem-dev-9ceda" : "ama-ecosystem-prod";
  const serviceName = "olybars-backend";
  const region = "us-west1";

  console.log(
    `☁️  Inspecting Cloud Run Service: ${serviceName} [${projectId}]...`,
  );

  const { RequiredKeys } = await import("./schema-loader");

  try {
    const cmd = `gcloud run services describe ${serviceName} --project ${projectId} --region ${region} --format="json"`;
    const output = execSync(cmd, { encoding: "utf8" });
    const serviceConfig = JSON.parse(output);

    const containers = serviceConfig.spec?.template?.spec?.containers;
    if (!containers || containers.length === 0) {
      throw new Error("No containers found in Cloud Run spec.");
    }

    const cloudEnvVars = containers[0].env || [];
    const cloudKeys = new Set(cloudEnvVars.map((e: any) => e.name));

    const missingRequired = RequiredKeys.filter((key) => {
      if (key.startsWith("VITE_")) return false; // Backend doesn't strictly need VITE_ keys (though some might be shared)
      // Actually, if Schema says required, it should be there.
      // But VITE_ keys are often build-time for frontend.
      // We ignore VITE_ keys for Cloud Run backend check to avoid false positives.
      return !cloudKeys.has(key);
    });

    if (missingRequired.length > 0) {
      console.error("❌ [FAILED] Cloud Run Environment Validation Failed:");
      console.error(
        `   The following REQUIRED keys are missing from the ${serviceName} configuration:`,
      );
      missingRequired.forEach((k) => console.error(`   - ${k}`));
      console.error(
        '\n👉 Run "gcloud run services update" or use the Firebase/Console UI to add these secrets.',
      );
      process.exit(1);
    }

    console.log(
      "✅ [PASS] Cloud Run configuration contains all required backend keys.",
    );
  } catch (error: any) {
    console.error("❌ [ERROR] Failed to fetch Cloud Run config.");
    console.error(`   Ensure you have permissions for project: ${projectId}`);
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }
}

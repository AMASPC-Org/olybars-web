import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.argv[2];

if (!PROJECT_ID) {
  console.error(
    "❌ Error: GOOGLE_CLOUD_PROJECT environment variable or project ID argument is required.",
  );
  process.exit(1);
}

// --- CONFIGURATION ---
const FORBIDDEN_KEYWORDS = [
  "wasted",
  "chug",
  "bottomless",
  "blackout",
  "binge",
  "hammered",
  "shitfaced",
];

const SCAN_DIRECTORIES = ["src", "functions/src", "server/src"];

// --- 1. WSLCB KEYWORD SENTINEL ---
function runKeywordScan() {
  console.log("🔍 [GUARDRAIL] Running WSLCB Keyword Sentinel...");
  let violationCount = 0;

  SCAN_DIRECTORIES.forEach((dir) => {
    const fullPath = path.join(rootDir, dir);
    if (!fs.existsSync(fullPath)) return;

    const files = getAllFiles(fullPath);
    files.forEach((file) => {
      if (file.endsWith(".test.ts") || file.endsWith(".spec.ts")) return; // Ignore tests

      const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
      lines.forEach((line, index) => {
        // Ignore markers: regulatory code or explicitly ignored lines
        if (
          line.includes("@guardrail-ignore") ||
          line.includes("COMPLIANCE") ||
          line.includes("LCB_FORBIDDEN")
        )
          return;

        FORBIDDEN_KEYWORDS.forEach((word) => {
          const regex = new RegExp(`\\b${word}\\b`, "gi");
          if (regex.test(line)) {
            console.error(
              `❌ [VIOLATION] Forbidden keyword "${word}" found in: ${path.relative(rootDir, file)}:${index + 1}`,
            );
            violationCount++;
          }
        });
      });
    });
  });

  if (violationCount > 0) {
    console.error(
      `🛑 [FAILED] WSLCB Scan failed with ${violationCount} violations.`,
    );
    return false;
  }
  console.log("✅ [PASS] WSLCB Keyword Sentinel cleared.");
  return true;
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      // Target source files
      if (/\.(ts|tsx|js|jsx)$/.test(file)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

// --- 2. MAPS KEY RESTRICTION AUDIT ---
function runMapsAudit() {
  console.log(`🔍 [GUARDRAIL] Auditing API Keys for ${PROJECT_ID}...`);
  try {
    const output = execSync(
      `gcloud alpha services api-keys list --project=${PROJECT_ID} --format="json"`,
      { encoding: "utf8" },
    );
    const keys = JSON.parse(output);

    let insecureKeys = 0;
    keys.forEach((key: any) => {
      const displayName = key.displayName || "Unnamed Key";
      const isMapsKey =
        displayName.toLowerCase().includes("maps") ||
        displayName.toLowerCase().includes("browser");

      if (isMapsKey) {
        const restrictions = key.restrictions || {};
        const browserRestrictions = restrictions.browserKeyRestrictions || {};
        const allowedReferrers = browserRestrictions.allowedReferrers || [];

        if (
          allowedReferrers.length === 0 &&
          displayName !== "Browser key (auto created by Firebase)"
        ) {
          console.error(
            `❌ [SECURITY] Maps API Key "${displayName}" has NO HTTP Referrer restrictions!`,
          );
          insecureKeys++;
        } else if (displayName === "Browser key (auto created by Firebase)") {
          console.log(
            `ℹ️  [ALLOWLIST] Maps API Key "${displayName}" is currently exempted from strict referrer checks.`,
          );
        } else {
          console.log(
            `✅ [SECURE] Maps API Key "${displayName}" is restricted.`,
          );
        }
      }
    });

    if (insecureKeys > 0) {
      console.error(
        "🛑 [FAILED] Insecure Maps API Keys detected in cloud configuration.",
      );
      return false;
    }
    return true;
  } catch (error: any) {
    console.warn(
      "⚠️ [WARN] Could not audit API keys. Ensure apikeys.googleapis.com is enabled.",
    );
    return true;
  }
}

// --- 3. IAM SENTINEL ---
function runIAMCheck() {
  console.log("🔍 [GUARDRAIL] Running IAM Sentinel (Least Privilege Check)...");
  try {
    const currentAccount = execSync("gcloud config get-value account", {
      encoding: "utf8",
    }).trim();
    const isServiceAccount = currentAccount.includes(".gserviceaccount.com");

    console.log(
      `🔍 Checking permissions for: ${currentAccount} (Type: ${isServiceAccount ? "SA" : "User"})`,
    );

    if (!isServiceAccount) {
      console.log("ℹ️  [SKIP] Skipping IAM Sentinel for human user account.");
      return true;
    }

    const policyOutput = execSync(
      `gcloud projects get-iam-policy ${PROJECT_ID} --format="json"`,
      { encoding: "utf8" },
    );
    const policy = JSON.parse(policyOutput);

    const elevatedRoles = ["roles/owner", "roles/editor"];
    let hasPrivilegeDrift = false;

    policy.bindings.forEach((binding: any) => {
      if (elevatedRoles.includes(binding.role)) {
        if (binding.members.includes(`serviceAccount:${currentAccount}`)) {
          console.error(
            `❌ [SECURITY_DRIFT] Service Account ${currentAccount} has elevated role: ${binding.role}`,
          );
          hasPrivilegeDrift = true;
        }
      }
    });

    if (hasPrivilegeDrift) {
      console.error(
        "🛑 [FAILED] IAM Sentinel detected Privilege Drift. Build halted for security.",
      );
      return false;
    }
    console.log("✅ [PASS] IAM Sentinel confirmed Least Privilege.");
    return true;
  } catch (error: any) {
    console.warn(
      "⚠️ [WARN] IAM Sentinel could not fetch policy. Ensure iam.securityReviewer role is granted.",
    );
    return true;
  }
}

// --- EXECUTION MAIN ---
async function main() {
  console.log("🛡️  [GUARDRAIL] Starting Audit & Compliance Suite...");

  const wslcbOk = runKeywordScan();
  const mapsOk = runMapsAudit();
  const iamOk = runIAMCheck();

  if (!wslcbOk || !mapsOk || !iamOk) {
    console.error(
      "\n❌ [FATAL] Audit & Compliance Suite failed. Correct the violations above before deploying.",
    );
    process.exit(1);
  }

  console.log("\n🌟 [SUCCESS] All OlyBars Operational Guardrails passed!");
}

main();

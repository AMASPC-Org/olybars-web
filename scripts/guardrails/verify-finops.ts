import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");

const ALLOWED_REGION = "us-west1";
const MAX_MONTHLY_BUDGET = 50;

console.log(`💰 [FINOPS] Starting architectural cost & region audit...`);

let violationCount = 0;

// 1. Region Audit (Static Code Analysis)
const filesToScan = [
  ".github/workflows/deploy-dev.yml",
  ".github/workflows/deploy-prod.yml",
  "package.json",
];

console.log(`🔍 [REGION] Checking for non-${ALLOWED_REGION} leakage...`);

filesToScan.forEach((relPath) => {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) return;

  const content = fs.readFileSync(fullPath, "utf8");
  // Look for region patterns that aren't us-west1
  const regionMatches = content.match(/region[=:\s]+['"]?([a-z0-9-]+)['"]?/gi);

  if (regionMatches) {
    regionMatches.forEach((match) => {
      const region = match.split(/[=:\s]+/)[1]?.replace(/['"]/g, "");
      if (region && region.toLowerCase() !== ALLOWED_REGION) {
        console.error(
          `❌ [VIOLATION] Invalid region "${region}" found in ${relPath}`,
        );
        violationCount++;
      }
    });
  }
});

// 2. Resource Audit (GCP Live check - requires Auth)
console.log(`☁️ [RESOURCES] Scanning for unattached or expensive resources...`);
const projects = ["ama-ecosystem-dev-9ceda", "ama-ecosystem-prod"];

projects.forEach((project) => {
  try {
    console.log(`   - Project: ${project}`);
    // Check for unattached disks (common cost bloat)
    const diskCmd = `gcloud compute disks list --project ${project} --filter="-users:*" --format="json"`;
    const disks = JSON.parse(
      execSync(diskCmd, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }) || "[]",
    );

    if (disks.length > 0) {
      console.warn(
        `⚠️ [WARNING] Found ${disks.length} unattached disks in ${project}. These incur costs without use.`,
      );
      disks.forEach((d: any) =>
        console.log(`      - Disk: ${d.name} (${d.sizeGb}GB)`),
      );
    }

    // Check for static IPs not in use
    const ipCmd = `gcloud compute addresses list --project ${project} --filter="status=RESERVED" --format="json"`;
    const ips = JSON.parse(
      execSync(ipCmd, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }) || "[]",
    );

    if (ips.length > 0) {
      console.warn(
        `⚠️ [WARNING] Found ${ips.length} reserved but unused static IPs in ${project}.`,
      );
    }
  } catch (e) {
    console.log(
      `   ℹ️ [SKIP] Live resource check skipped for ${project} (Insufficient permissions or gcloud not authed).`,
    );
  }
});

if (violationCount > 0) {
  console.error(
    `\n❌ [FAILED] FinOps Audit found ${violationCount} critical architectural drift violations.`,
  );
  process.exit(1);
}

console.log(
  `\n✅ [PASS] FinOps Audit complete. All static regions aligned to ${ALLOWED_REGION}.`,
);
process.exit(0);

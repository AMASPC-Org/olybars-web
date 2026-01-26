import fs from "fs";
import path from "path";

const SECRETS_SIGNATURES = [
  /-----BEGIN PRIVATE KEY-----/,
  /AIza[0-9A-Za-z-_]{35}/,
];

const FORBIDDEN_FILENAMES = [
  /^service-account.*\.json$/i,
  /^secret.*\.json$/i,
  /^\.env$/i,
  /.*\.key$/i,
  /.*\.pem$/i,
];

/**
 * [WSLCB COMPLIANCE] Semantic Guard
 * Rejects code containing keywords that encourage binge consumption or over-service.
 */
const WSLCB_FORBIDDEN_KEYWORDS = [
  /\bchug\b/i,
  /\bwasted\b/i,
  /\bbottomless\b/i,
  /\bshwasted\b/i,
  /\bhammered\b/i,
  /\bshot special\b/i,
  /\ball you can drink\b/i,
];

const ALLOWLIST_DIRECTORIES = ["src/locales/", "docs/", "server/src/data/"];

const ALLOWLIST_FILES = ["package-lock.json", "package.json"];

function calculateEntropy(str: string): number {
  const len = str.length;
  if (len === 0) return 0;
  const frequencies: Record<string, number> = {};
  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

const args = process.argv.slice(2);

async function scan() {
  let hasError = false;

  for (const file of args) {
    const normalizedPath = file.replace(/\\/g, "/");
    const filename = path.basename(normalizedPath);

    // Existence check
    if (!fs.existsSync(file)) continue;

    const stats = fs.statSync(file);

    // Efficiency Guards
    if (stats.size > 1024 * 1024) {
      console.log(`[SEC] Skipping large file: ${normalizedPath}`);
      continue;
    }

    const content = fs.readFileSync(file);

    // Binary check (simplified but UTF-16 aware)
    const hasNulls = content.slice(0, 1024).some((byte) => byte === 0);
    const hasUTF16BOM =
      (content[0] === 0xff && content[1] === 0xfe) ||
      (content[0] === 0xfe && content[1] === 0xff);

    if (hasNulls && !hasUTF16BOM) {
      continue;
    }

    let textContent = content.toString("utf8");
    if (hasUTF16BOM) {
      textContent = content.toString(
        content[0] === 0xff ? "utf16le" : "utf16be",
      );
    }

    // Tier B: Content Override & WSLCB Guards
    if (!normalizedPath.endsWith("scripts/security/pre-commit-scanner.ts")) {
      // 1. Secrets Check
      for (const sig of SECRETS_SIGNATURES) {
        if (sig.test(textContent)) {
          console.error(
            `\x1b[31m[CRITICAL SECURITY BLOCK]\x1b[0m Secret signature detected in: ${normalizedPath}`,
          );
          hasError = true;
        }
      }

      // 2. [WSLCB COMPLIANCE] Binge Guard
      for (const kw of WSLCB_FORBIDDEN_KEYWORDS) {
        if (kw.test(textContent)) {
          console.error(
            `\x1b[31m[COMPLIANCE BLOCK]\x1b[0m Forbidden WSLCB keyword detected (${kw}): ${normalizedPath}`,
          );
          hasError = true;
        }
      }
    }

    // Check Allowlist for Filename and Entropy
    const lowerPath = normalizedPath.toLowerCase();
    const lowerFilename = filename.toLowerCase();

    const isAllowlisted =
      ALLOWLIST_DIRECTORIES.some((dir) =>
        lowerPath.startsWith(dir.toLowerCase()),
      ) || ALLOWLIST_FILES.some((f) => f.toLowerCase() === lowerFilename);
    const isMinified = lowerFilename.includes(".min.");

    if (!isAllowlisted) {
      // Tier A: Filename
      for (const pattern of FORBIDDEN_FILENAMES) {
        if (pattern.test(filename)) {
          // Double check .env for common safe files
          if (
            filename.toLowerCase() === ".env.example" ||
            filename.toLowerCase() === ".env.template"
          )
            continue;

          console.error(
            `\x1b[31m[SECURITY BLOCK]\x1b[0m Forbidden filename detected: ${normalizedPath}`,
          );
          hasError = true;
        }
      }

      // Tier C: Entropy (Skip minified)
      if (!isMinified) {
        const lines = textContent.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.length > 40) {
            // Check for long strings that look like keys
            const words = trimmed.match(/[a-zA-Z0-9+/=_-]{40,}/g);
            if (words) {
              for (const word of words) {
                const entropy = calculateEntropy(word);
                if (entropy > 4.5) {
                  console.error(
                    `\x1b[31m[SECURITY BLOCK]\x1b[0m High-entropy string detected (${entropy.toFixed(2)}): ${normalizedPath}`,
                  );
                  hasError = true;
                }
              }
            }
          }
        }
      }
    }
  }

  if (hasError) {
    console.error(
      `\x1b[33m[ADVICE]\x1b[0m If this is a false positive, move the file to an allowlisted directory or use --no-verify (OWNER ONLY).`,
    );
    process.exit(1);
  }
}

scan().catch((err) => {
  console.error(err);
  process.exit(1);
});

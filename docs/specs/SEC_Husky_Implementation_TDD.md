# TDD: Husky Security Hooks & Secret Detection

## 1. Objective

Implement automated, pre-commit secondary defenses to physically block the inclusion of sensitive credentials (GCP keys, service-account.json files) in the git history.

## 2. Infrastructure

- **Husky**: Git hook manager.
- **lint-staged**: Optimized execution (only scans staged files).
- **Custom Security Script**: `scripts/security/pre-commit-scanner.ts` (executed via `tsx`).

## 3. Detection Logic (The "Firewall")

### A. Filename-Based Blocking (Grave)

Files matching these patterns are strictly forbidden regardless of location:

- `^service-account.*\.json$` (Anchored to prevent middle-match false positives)
- `(?i)^secret.*\.json$`
- `\.env$` (Explicitly excludes `.env.example` and `.env.template`)
- `.*\.key$`
- `.*\.pem$`

### B. High-Entropy / Content-Based Blocking

Scan file contents using the following regex patterns:

- **GCP Private Key Signature**: `-----BEGIN` (followed by) `PRIVATE KEY-----`
- **Google API Key**: `AIza[0-9A-Za-z-_]{35}`
- **Generic High Entropy**: Look for strings with specific length (e.g., >40 chars) and high character diversity (Shannon entropy threshold > 4.5).
- **Efficiency Guard**: Skip binary files (images, audio) and files >1MB to prevent performance lag during commit.
- **Existence Check**: Files staged for deletion (missing from disk) must be skipped by the scanner to avoid EOF/Not Found errors.

### C. Logic: "Allowlist vs. Blacklist" (Heuristic Priority)

To prevent blocking legitimate project development while maintaining security:

1.  **Content Overrides Location**: A content-match (e.g., the `PRIVATE KEY` header) triggers an **INSTANT BLOCK** regardless of directory. The allowlist only applies to filename and entropy checks.
2.  **Explicit Directory Exclusions** (For Entropy/Filename only):
    - `src/locales/` (Translations)
    - `docs/` (Markdown documentation)
    - `server/src/data/` (Master JSON files verified as non-secret)

3.  **Path Normalization**: The scanner must normalize backslashes (`\`) to forward slashes (`/`) to ensure the allowlist works consistently on both Windows (Local) and Cloud Build (CI).
4.  **Minification Handling**: Files with `.min.` in the name are exempted from the general entropy check (to avoid false positives on compressed assets) but remain subject to Layer A (Filename) and Layer B (Signature) scanning.

## 4. Operational Limitations (Risk Assessment)

- **Local Hook Bypass**: The `--no-verify` flag skips Husky. This is a local guard, not a replacement for GCP Project-level security (e.g., revoking keys).
- **Environment Dependency**: The scanner will use `node --import tsx` to match the project's standardized script execution format.

## 5. Implementation Workflow

1.  **Bootstrap**: Install `husky` and `lint-staged`.
2.  **Initialization**: `npx husky init`.
3.  **Configuration**:
    - Update `package.json` with `lint-staged` rules.
    - Map `*.json` and `*` to the `pre-commit-scanner.ts`.
4.  **Script Development**: Write the scanner in TypeScript to leverage existing environment context.

## 6. Verification Plan

- **Test 1**: Attempt to stage a file named `dummy-service-account.json`. Expect **BLOCK**.
- **Test 2**: Attempt to stage a file containing the `PRIVATE KEY` header. Expect **BLOCK**.
- **Test 3**: Attempt to stage `src/locales/en.json`. Expect **PASS**.

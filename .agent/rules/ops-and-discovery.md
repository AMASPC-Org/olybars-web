---
trigger: always_on
---

# Ops & Discovery Protocol

This rule governs how the agent navigates the codebase, handles errors, and uses the terminal effectively.

## 1. The Discovery Mandate
Before writing a single line of code for a new feature:
- **Global Search**: Every plan MUST start with a global grep of `src/` to identify existing components or functions.
- **Merge & Enhance**: Prohibit 'New Builds' if a 'Merge & Enhance' into existing code is possible.
- **Dependency Awareness**: Verify if functionality is already supported by the current tech stack before adding new dependencies.

## 2. The Self-Healing Loop
When a command fails or a runtime bug is discovered:
- **Phase 1: Diagnostic**: Read the error log fully. Locate the exact line and file.
- **Phase 2: Root Cause**: State the root cause clearly (e.g., "Interface mismatch").
- **Phase 3: Deep Audit**: Scan for other instances where this logic exists.
- **Phase 4: Targeted Fix**: Apply the fix across ALL identified locations.
- **Phase 5: Build Integrity**: ALWAYS run `npm run build` after any logic or type change.
- **Phase 6: The Artie Pulse**: If localhost:3000 is unreachable, proactively run `npm run dev:all` to clear ports and restore services.

## 3. Schema-First Integrity
Every data-layer change (Firestore fields, API responses) MUST:
- **Update Seed**: Reflect the change in `server/src/seed.ts`.
- **Update Types**: Reflect the change in `src/types/`.
- **Verify Emulator**: Run the seed script in the local emulator before proposing a deploy.
- **The Ground Truth Anchor**: Any changes to `venues_master.json` must be followed by `npx tsx server/src/scripts/align-venue-locations.ts` to ensure coordinates are tied to the official Google Listing.

## 4. PowerShell Mastery
All terminal commands MUST follow Windows PowerShell syntax.
- **Chaining**: Use `;` for sequential commands. NEVER use `&&` or `||`.
- **HTTP**: Use `curl.exe` for bash-like behavior or `Invoke-RestMethod` for native JSON.
- **Path Handling**: Use backslashes `\` for file paths in commands. Quote paths containing spaces.
- **Case Sensitivity**: Be mindful that Cloud Run (Linux) is case-sensitive even if Windows is not.

## 5. Artifact & Media Standards
- **Media Embedding**: Use absolute paths with a leading forward slash for images/videos in artifacts (e.g., `![alt](/C:/...)`).
- **No file:// prefix**: Do not use the `file://` protocol in markdown image paths.
- **Copy First**: Ensure media is copied to the artifacts directory before embedding.

## 6. Environment Context Boundaries
- **Localhost != Dev**: 
  - `Localhost` = Your machine (`npm run dev`). Changes here are instant.
  - `Dev` = Cloud Run (deployed). Changes here require a full build & deploy pipeline.
- **Deployment Warning**: If asked to "deploy to fix localhost", STOP. You are confused. Deploying never fixes localhost.
- **Context Awareness**: Always check `window.location.hostname` or the current URL before assuming which environment is broken.

## 7. Known Environment Quirks (Self-Healing)
- **Firebase Emulator**: Requires **Java 21**. If you see Java-refusal errors, remind the user or check the `PATH`.
- **Port Locking**: If Port 3000 is occupied, use `/restore-dev` immediately.
- **Geofencing**: Local development often lacks valid GPS. Use the "Mock Location" override in the Dev Tools to test Vibe reports.

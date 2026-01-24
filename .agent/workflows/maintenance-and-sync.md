---
description: Synchronize codebase lore with Artie and perform health diagnostics.
---

# /maintenance-and-sync

Use this workflow to ensure Artie's brain is synced with the latest codebase data and to verify service health.

## 1. Artie Brain Sync

Run this whenever you change `seed.ts` (Venues), `playConfig.ts` (League Rules), or local lore.

1. **Verification**: Ensure `server/src/seed.ts` and `src/features/league/config/playConfig.ts` are saved.
2. **Sync**:
   ```powershell
   npm run artie:sync
   ```
3. **Confirmation**:
   - Use the **`getLoreContext`** tool to verify the brain is responding with updated lore.
   - Alternatively: `npx tsx functions/verify_brain.ts --question "What are the latest league rules?"`

## 2. Artie Brain Diagnostic

Verify Artie's integration, persona, and triage logic.

1. **Env Check**: Confirm API keys are synced.
   ```powershell
   Test-Path "functions/.env"
   ```
2. **Triage Test**: Verify Artie identifies as the "Spirit" and triages search queries correctly.
   ```powershell
   npx tsx functions/verify_brain.ts
   ```
3. **Infrastructure**: Confirm lazy instantiation is used in `functions/src/flows/artieChat.ts`.

## 3. Service & Port Cleanup

Resolve "EADDRINUSE: 3001" or orphaned node processes.

1. **Identify**:
   ```powershell
   Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object OwningProcess
   ```
2. **Terminate**:
   ```powershell
   Stop-Process -Id <PID> -Force
   # OR Bulk Cleanup
   Get-Process | Where-Object { $_.Name -eq "node" } | Stop-Process -Force
   ```

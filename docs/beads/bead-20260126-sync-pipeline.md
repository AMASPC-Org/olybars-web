# Bead: Pipeline Restoration (DevOps)
> **Context:** Fixing "Sync & Deploy" death loop. Phase 3: Pipeline.
> **Goal:** Achieve a "Green" deployment run.

## Status: Claimed
**Agent:** GEMINI-AGENT

## Tasks
- [x] **Verbose Logging** <!-- id: 1 -->
    - Patch `reusable-deploy.yml` to echo sanitized `gcloud` commands.
- [ ] **Manual Dispatch & Tail** <!-- id: 2 -->
    - Dispatch `deploy-dev.yml`.
    - Run `gcloud beta run services logs tail olybars-backend` immediately.

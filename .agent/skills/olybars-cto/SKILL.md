---
name: olybars-cto
description: Core operating standards for OlyBars.com. Defines the "What" (Quality), while Unified_Skill_Workflow defines the "How" (Process).
---

# OlyBars CTO Standards of Excellence

You are the Lead Architect. When executing the **Unified Skill Workflow**, you must enforce these standards.

## 1. THE PRIME DIRECTIVE
**Process Authority**: You must strictly follow `.agent/workflows/Unified_Skill_Workflow.md`.
**Conflict Resolution**: If a user request contradicts a Standard below, you must raise a "Warning" alert in your plan.

## 2. STANDARDS OF EXCELLENCE

### A. Frontend: The "Drunk Thumb" Standard
*Applies to: `src/`, UI Components, CSS*
- **Click Targets**: MINIMUM 44x44px. No exceptions.
- **Contrast**: WCAG AA (Text) / AAA (Interactive). Dark mode optimizations for dim bars.
- **State**: `Zustand` for client state, `React Query` for server state.
- **Vibe**: "Stripe-level" polish. Zero layout shift. Smooth transitions.

### B. Backend: The "Artesian Brain" Standard
*Applies to: `server/`, `functions/`, Database*
- **Security**: Zero-Trust. Validate Auth Claims on EVERY request.
- **FinOps**:
    -   Cache static assets aggressively.
    -   Schema-first: Update `types/` -> Update `seed.ts` -> Update DB.
- **Performance**: Cold starts <2s.

### C. Architecture: The "Command Center" Standard
*Applies to: Infrastructure, New Features*
- **Single Source of Truth**: All business logic lives in `server/` or `functions/`, NOT the frontend.
- **Feature Flags**: Critical changes must be togglable via `VenueOpsService`.
- **Simplification**: Delete code before adding code.

## 3. CHEAT CODES (Common Commands)
- **Check Health**: `npm run check-health`
- **Deploy**: `npm run deploy:dev` (Dev), `npm run deploy:prod` (Prod)
- **Sync**: `npm run artie:sync`

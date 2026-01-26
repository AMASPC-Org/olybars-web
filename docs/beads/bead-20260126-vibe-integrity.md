# Bead: Vibe Management - Nomenclature & Logic Integrity

**ID:** `bead-20260126-vibe-integrity`
**Status:** Done (Agent Z9X1)

// ... (skipping unchanged header lines if possible, but replace_file_content needs context)
**Type:** Foundation
**Priority:** Critical
**Owner:** Unclaimed

---

## 1. Objective
Harmonize the internal code, Firestore fields, and user-facing UI with the "Holy Trinity" branding. Specifically: "Drops" (Well Water) for currency and "Mellow -> Chill -> Buzzing -> Packed" for vibe states.

## 2. Background & Reasoning (For Future Self)
The OlyBars mission relies on "Operational Realism." Discordance between internal labels (like `Flooded`) and external marketing (like `Packed`) creates "Cognitive Friction" for owners and "Tech Drift" for developers.

### Why strictly "Drops"?
*   **Brand Identity**: We are the "Artesian Well." Points are generic; Drops are thematic.
*   **Regulatory Safety**: "Points" implies a game/contest, which can trigger gambling scrutiny. "Drops" frames it as a loyalty commodity.

### Why strictly "Trickle / Flowing / Gushing / Flooded"?
*   **Brand Identity**: OlyBars is the "Artesian Well." The nomenclature must adhere to the water theme.
*   **Correction**: I previously assumed "Packed" was better. The User has corrected this. "Flooded" is the thematic state for maximum capacity.
*   **Consistency**: We must align the entire stack to **Trickle / Flowing / Gushing / Flooded**.

## 3. Tasks & Implementation

### 3.1 Global Nomenclature Sync
- [x] **Config**: Update `src/config/gamification.ts` to strictly use the Water Metaphor keys.
- [x] **Services**: Audit `VenueOpsService.ts` to ensure `vibeStatus` enums match the Water Metaphor.
- [x] **UI Audit**:
    *   Replace `Mellow` $\rightarrow$ `Trickle`
    *   Replace `Chill` $\rightarrow$ `Flowing`
    *   Replace `Buzzing` $\rightarrow$ `Gushing`
    *   Replace `Packed` $\rightarrow$ `Flooded`

### 3.2 Backend Constant Alignment
- [x] **Cloud Functions**: Ensure `functions/src/triggers/onVibeCheck.ts` uses the same `GAMIFICATION_CONFIG` import as the frontend to prevent "Ghost Points" (UI says +10, Backend gives +5).
- [x] **Emulator Check**: Verify that `npm run dev` reflects these changes without breaking existing seeds.

## 4. Considerations
*   **Backward Compatibility**: We will NOT rename the Firestore keys (e.g., `current_buzz.score`) to avoid data migration hell. We are only changing the *Interface Layer* (enums, config, and display text).
*   **Drunk Thumb**: Ensure `Packed` (6 letters) fits on the button where `Flooded` (7 letters) used to be.

## 5. Dependencies
*   None. This is the root bead for the Vibe Management cluster.

# Bead: Vibe Management - "Double-Tap" Safety Protocol

**ID:** `bead-20260126-bh-safety`
**Status:** Open
**Type:** Feature/Safety
**Priority:** Critical
**Owner:** Unclaimed

---

## 1. Objective
Implement a high-friction confirmation modal for the `Packed` vibe status to prevent accidental mass "Star Alerts" to League Players.

## 2. Background & Reasoning (For Future Self)
The "Brew House Specs" state that setting a venue to its highest vibe level (Packed) triggers a system-wide broadcast. In a dark, chaotic bar environment ("Drunk Thumb" conditions), an owner might slip.

### Probabilistic Context (The Oracle Signal)
The Bayesian Vibe Model relies on noisy signals (Check-ins). The "Flooded" status override is an **Oracle Signal**.
*   When confirmed, it forces the posterior probability $P(\text{Vibe}=\text{Flooded}) \approx 1.0$, overriding all decay logic for a set duration (45 mins).
*   *Risk*: If this signal is false (accidental tap), it pollutes the Prior for weeks. We *need* the human to be sure.

## 3. Tasks & Implementation

### 3.1 The "Double-Tap" Modal
- [ ] **Component**: Create `VibeConfirmationModal.tsx` in `src/features/owner/components/dashboard/`.
    *   *Visual*: Dark, high-contrast, warning colors (Yellow/Amber).
    *   *Copy*: "Broadcast 'FLOODED' status to [X] Starred Players?"
- [ ] **Logic Intercept**: Update `onVibeSelect` in `OperationsTab.tsx`.
    *   If `newStatus === 'flooded'`, STOP $\rightarrow$ SHOW_MODAL $\rightarrow$ AWAIT_CONFIRM $\rightarrow$ EXECUTE.

### 3.2 Visual & Haptic Feedback
- [ ] **Feedback**: On confirm, show a "Broadcasting..." state.
- [ ] **Interaction Design**:
    *   *Preferred*: **"Hold to Broadcast"** (Fill loop 1.5s). This prevents "reflex tapping" better than a simple modal button.
    *   *Fallback*: Standard Modal with explicit "Broadcast" button.
    *   *Decision*: Implement "Hold to Confirm" if UI library supports it easily, otherwise use Modal.

## 4. Considerations
*   **Throttling**: Ensure the backend rejects this call if made > 1 time per 45 minutes (Spam prevention).
*   **Touch Targets**: The "Cancel" button must be distinct and large (min 44px) to allow easy aborts.

## 5. Dependencies
*   `bead-20260126-vibe-integrity` (Nomenclature)
*   `bead-20260126-bh-security` (Action Permissions)

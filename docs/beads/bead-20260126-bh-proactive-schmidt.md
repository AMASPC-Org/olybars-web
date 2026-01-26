# Bead: Vibe Management - Proactive Schmidt (Bayesian Coach)

**ID:** `bead-20260126-bh-proactive-schmidt`
**Status:** Open
**Type:** AI/Logic
**Priority:** Medium
**Owner:** Unclaimed

---

## 1. Objective
Transform Schmidt from a static "Briefing" component into a proactive "Coach" that suggests growth actions based on Bayesian Confidence Intervals of the live vibe.

## 2. Background & Reasoning (For Future Self)
Schmidt currently waits for a user prompt. But owners are busy. Schmidt should act as a "Floor Manager," spotting trends the owner might miss.

### The Probability of Nudging
We cannot nudge based on raw headcount, because headcount is noisy/incomplete. We must use the **Confidence Interval** of the Bayesian Model.
*   **Rule**: Only nudge if $P(\text{State} | \text{Data}) > 0.8$ (80% confidence).
*   *Why?*: Nudging an owner to "Boost Traffic" when they are actually busy (but the data is lagging) is annoying and breaks trust.

## 3. Tasks & Implementation

### 3.1 Proactive Monitor Logic
- [ ] **SchmidtManagerBriefing.tsx**: Subscribe to the `currentBuzz.confidence` and `currentBuzz.label`.
- [ ] **Triggers**:
    *   *Context A (Slow Night)*: If $P(\text{Trickle}) > 0.8$ AND `time > 20:00` $\rightarrow$ Suggest "Flash Bounty".
    *   *Context B (Peak)*: If $P(\text{Flooded}) > 0.8$ $\rightarrow$ Suggest "Capture the Vibe" (Photo contest).

### 3.2 Actionable Nudges
- [ ] **Deep Linking**: Nudges must link directly to the skill execution.
    *   "Launch Bounty" button $\rightarrow$ calls `useSchmidtOps('skill_flash_deal')`.

### 3.3 The "Anti-Nag" Protocol
- [ ] **Silence Logic**: If a user dismisses a nudge, store `lastDismissed_{type}` timestamp in local storage.
- [ ] **Rule**: Do not show the same nudge type again for 24 hours.
- [ ] **Sunday Silence**: Disable "Slow Night" nudges on Sundays (industry standard rest day) unless explicitly configured otherwise.

## 4. Considerations
*   **Coach Tone**: Schmidt is terse and professional. "Traffic is low. Boost it?" vs "Oh no! It's quiet!"
*   **Privacy**: Nudge logic runs client-side (Edge) to avoid sending owner usage patterns to the LLM unnecessarily.

## 5. Dependencies
*   `bead-20260126-vibe-integrity` (Data Foundation)
*   `bead-20260126-bh-safety` (Understanding boundaries)

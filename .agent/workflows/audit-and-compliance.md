---
description: Comprehensive pre-flight audit for security, tech drift, and WSLCB compliance.
---

# /audit-and-compliance

This is a mandatory pre-flight check for any change affecting `src/features/` or `server/`.

## 1. WSLCB Compliance (/verify-lcb)

1. **Check-in Logic**: Verify max 2 check-ins per 12h window.
2. **Happy Hour Sorting**: Ensure sorting by `TimeRemaining` (4+ hours at bottom).
3. **Safe Ride**: Ensure links to Red Cab (360-555-0100), Uber, or Lyft appear after 5:30 PM.
4. **Ad Copy**: Use the **Artie Pivot** to sanitize "Bottomless", "Chug", or "Shot Special" (Tasting Flight).

## 2. Infrastructure & Tech Audit

1. **Dependency Check**: Block `axios`, `bootstrap`, `@mui/material`, `@google/generative-ai`.
2. **Lazy Loading**: Verify AI context is loaded lazily (search for `getGemini`).
3. **API Config**: Confirm all frontend calls use centralized `API_BASE_URL`.
4. **Maps Health**:
   - `curl http://localhost:3001/api/config/maps-key`
   - Confirm autocomplete works and "Service Degraded" UI renders on failure.

## 3. Security & Privacy Audit

1. **Secret Detection**: Scan for hardcoded keys. Must use `.env` or Secret Manager.
2. **Data Privacy**: No PII in logs. No client-side Firestore bypasses.
3. **Input Validation**: Check for `dangerouslySetInnerHTML` and proper state validation.

## 4. Report & Blocker Gating

- If ANY audit fails, the task MUST halt. REPORT violations as **Blockers** in the Implementation Plan.

## 5. FinOps & Budget Audit

1. **Region Check**: Run `npm run guardrail:finops` to identify any `us-central1` leakage.
2. **Log Retention**: Verify new Cloud Run services have a 30-day log expiration.
3. **Artifact Hygiene**: Ensure `brain/` artifacts are concise and don't duplicate source code.

## 6. Dependency Bloat Audit

1. **Size Monitoring**: Verify `node_modules` hasn't ballooned (>5% increase) for minor feature adds.
2. **Native Over Build**: If a feature can be built with existing `lucide-react` or `tailwind` without new libs, DO NOT add dependencies.

---
description: Run the Vibe Check propagation audit
---

# Vibe Audit Workflow

1. **Pre-Flight Check**
   - Verify `localhost:3000` is running.
   - Run `npx tsx .agent/skills/full-stack-audit/scripts/preflight.ts` (Proprietary check).

2. **Execute Clock-In Simulation**
   - Run the Browser Agent to:
     - Login as Guest.
     - Go to `/bars/brotherhood-lounge`.
     - Click "Clock In".
     - Verify "Buzz +10" toast appears.

3. **Verify Propagation**
   - **Frontend**: Check `/map` for "Brotherhood" pin color change (Gold/Pink).
   - **Backend**: Check Firestore `venues/brotherhood-lounge` for `buzz > 0`.

4. **Report**
   - Generate `vibe_audit_log.md` with pass/fail status.

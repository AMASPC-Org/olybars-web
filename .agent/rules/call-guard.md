# Terminology Guard: "Drops" Protocol

## Context
OlyBars has rebranded "Points" to **"Drops"**.
"Score" is now **"Vibe Score"**.

## Mandatory Pre-Commit Check
Before finalizing any file edit (`.tsx`, `.ts`, `.md`), the Agent MUST run:
```bash
grep -rE "Points|Score" src/components/ | grep -v "Vibe Score"
```
If output exists: STOP. Replace instances with "Drops" or "Vibe Score" appropriately.

## Exception
Database fields (e.g., `user.points`) may remain for backward compatibility, but ALL frontend labels must say "Drops".

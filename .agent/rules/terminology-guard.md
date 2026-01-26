---
trigger:
  type: glob
  pattern: "src/**/*.{tsx,ts,json}"
---

# Terminology Guardrail

This rule strictly enforces the "OlyBars Language" to prevent brand dilution.

## 1. The "Drops" Mandate
We have rebranded from generic "Points" to proprietary "Drops" (Well Water).
- **Forbidden**: "Points", "Score", "XP".
- **Required**:
  - **Drops**: The currency earned by users (e.g., "+10 Drops").
  - **Well Water**: The thematic name for the currency.
  - **Balance**: The user's current total (e.g., "Your Balance").

### Exceptions
- Internal variable names (e.g., `const calculatePoints = () => ...`) are **PERMITTED** to avoid massive refactors.
- Database field names (e.g., `user.points`) are **PERMITTED**.
- **User-Facing UI Text** must ALWAYS use "Drops".

## 2. The "League" Mandate
- **Forbidden**: "User", "Customer", "Patron".
- **Required**:
  - **Guest**: An unauthenticated or non-league user.
  - **Player**: A registered League Member.
  - **Bar Athlete**: A high-tier League Member.

## 3. Enforcement Regex
If you see these patterns in `JSX` or `UI Strings`, auto-correct them:
- `/\d+ Points/i` -> `X Drops`
- `/Your Score/i` -> `Your Balance`

## 4. The Self-Audit Mandate
Before reporting any UI task as "Complete", you MUST run a global grep for forbidden terms to ensure no leaks were introduced or missed:
- `grep -riE "points|score|xp" src/` (Filter out `node_modules` and `types`)
- If matches are found in user-facing files, you must fix them before finishing.

## 5. System Layer Disambiguation
Refer to [system_glossary.md](file:///.agent/rules/system_glossary.md) for the distinction between Antigravity (Engineering) and OlyBars (Product) terminology.
- **Strict Rule**: Never confuse "Agent Skills" (.agent/skills) with "Persona Skills" (src/skills).

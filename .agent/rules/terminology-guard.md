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

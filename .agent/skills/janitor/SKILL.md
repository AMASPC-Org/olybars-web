---
name: janitor
description: Performs deep maintenance on the OlyBars repo. Use this when the user asks to "optimize the project," "clean up the site," or "find redundant code."
---
# Janitor Skill

## Goals
- Maintain a lean, high-performance us-west1 GCP footprint.
- Ensure the repository remains readable for other agents in the swarm.

## Instructions
1. **Introspection:** Read `ARCHITECTURE.md` and the `package.json` to understand the intended stack.
2. **Analysis:** Traverse the `src/` directory. Use static analysis to find functions with no internal references.
3. **GCP Guardrails:** Verify Cloud Run configurations in `server/` aren't bundling unnecessary folders (e.g., `tests/` or `docs/`) into the production container.
4. **Propose:** Create a "Hygiene Report" artifact with a checklist of suggested deletions.

## Execution
Use the custom script `scripts/janitor.ts` to perform the heavy lifting of static analysis.

```bash
npx tsx scripts/janitor.ts
```

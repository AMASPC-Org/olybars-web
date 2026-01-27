---
description: Run a comprehensive cleanup of the OlyBars repository
---
# Cleanup Workflow

Use this workflow to optimize the repository, remove unused files, and maintain hygiene.

## Steps

1. **Dependency Audit**
   - Run `npm prune` to remove extraneous node_modules.
   - (Manual) Check `package.json` for unused dependencies based on recent refactors.

2. **File Explorer Scrub**
   - Identify "Ghost Files" (temporary logs, .DS_Store, unlinked assets).
   - Use `find . -type f -name '*.DS_Store' -delete` (or Windows equivalent) if safe.

3. **Janitor Skill Execution**
   - Execute the Janitor Skill to find redundant logic and unused exports.
   - // turbo
   - Run the janitor script: `npx tsx scripts/janitor.ts` (Once created)

4. **Artifact Cleanup**
   - Archive old `implementation_plan.md` or `task.md` artifacts from completed beads.

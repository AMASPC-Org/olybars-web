---
trigger: always_on
---

# OlyBars Project Hygiene Rule
**Activation:** Always On

1. **No Redundant Deps:** ALWAYS check `package.json` before suggesting new libraries. Prefer existing utilities in `src/utils/` over new installs.
2. **Minimalist Components:** Before creating a new UI component, search `src/components/` for reusable targets to avoid "Component Bloat."
3. **Dead Code Policy:** If you refactor a file, you MUST identify and propose the deletion of any newly unused exports or helper functions.
4. **Secret Scouting:** Proactively flag any `.env`, `.json`, or `.key` files that appear in the file explorer but are missing from `.gitignore`.
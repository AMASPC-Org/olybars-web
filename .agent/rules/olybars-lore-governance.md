# OlyBars Lore Governance

This rule ensures that the Agent remains aligned with the project's technical and creative "Lore" (The Holy Trinity).

## 1. The Hierarchy of Truth

When you encounter conflicting information, follow this priority:

1.  **Trinity Rules** (Business Plan, System Arch, Artie Persona in `docs/knowledge/core/`)
2.  **Skills** (`.agent/skills/*.md`)
3.  **Knowledge Base** (`server/src/data/knowledgeBase.json`)
4.  **Existing Code** (`src/`, `functions/`)

## 2. The Cross-Referencing Mandate

Before implementing changes to:

- **Points/Gamification**: MUST verify against `system_architecture.md`.
- **Artie Responses**: MUST verify against `knowledgeBase.json` FAQs and `ArtiePersona`.
- **Compliance/Safety**: MUST verify against `business_plan.md` and LCB section of `audit-and-compliance.md`.

## 3. Knowledge Discovery Protocol

- Use the `getLoreContext` tool to retrieve structured facts from the knowledge graph.
- If a fact is not found in the official KB but exists in code comments, flag it for inclusion in the next `/maintenance-and-sync` run.
- Prohibit "Hallucinating" business logic—if the documentation is silent, ask the user.

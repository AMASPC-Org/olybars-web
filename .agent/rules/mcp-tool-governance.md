# MCP & Genkit Tool Governance

This rule ensures that all tools (custom Genkit tools or external MCP servers) are robust, discoverable, and safely typed.

## 1. Tool Identification

- **Custom Tools**: Located in `functions/src/mcp/` or defined within Genkit flows.
- **External Tools**: Provided via Model Context Protocol (MCP) servers.

## 2. Schema Standards (Zod)

- Every tool MUST use a strict **Zod schema** for input validation.
- Descriptions for each field must be human-readable and contextual (e.g., `"The pulse frequency in Hz (0-100)"`).

## 3. Discovery Optimization

- **Tool Name**: Use `camelCase` and be descriptive (e.g., `searchBars` not `find_b`).
- **Tool Description**: Start with a strong action verb. Include return type hints and error conditions if possible.
- **System Prompt Reference**: Tools should be clearly documented in the relevant `.agent/skills/` file so the agent knows when to activate them.

## 4. Safety & Side Effects

- **Read-Only**: Tools that only fetch data should be explicitly marked as safe to run without user confirmation (if the IDE allows).
- **Mutations**: Any tool that writes to Firestore or triggers a Cloud Run deploy MUST require explicit user approval (enforced via `notify_user` or IDE gates).

## 5. Build Integrity

- Any change to `functions/src/mcp/*.ts` requires a full `npm run build` in the `functions` directory to ensure type safety.

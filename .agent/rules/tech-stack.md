# Tech Stack & Execution Protocol

## 1. The "@google/genai" Mandate
- **Constraint**: You must use the official `@google/genai` (Google Gen AI SDK) for all AI interactions.
- **Prohibited**: Do not use `langchain`, `openai`, or other wrappers unless explicitly authorized.

## 2. Sequential Execution Protocol
- **Single-Threaded Focus**: Do not attempt to fix multiple files simultaneously if they share dependency errors.
- **Stop-and-Fix**: If a build or type check fails, stop immediately. Diagnose the root cause before proceeding.
- **No speculative coding**: Do not "guess" imports. Use `grep` or `list_dir` to confirm file paths.
- **Validation First**: Before marking a task as done, run the relevant verification script (e.g., `npm run type-check`).

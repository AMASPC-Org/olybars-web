# OlyBars Command Reference

| Command | Purpose | Usage / Frequency |
| :--- | :--- | :--- |
| `npm run janitor` | Runs the full hygiene audit (unused components + GCP guardrails). | **Daily** / **Automated 3x Daily** |
| `npm run dev` | Starts local development server. | **Daily** for development. |
| `npm run build` | Builds the project for production. | **CI/CD** or pre-deploy. |
| `npm run deploy:dev` | Deploys current code to Dev environment. | **Ad-hoc** when testing cloud features. |
| `npm run deploy:prod` | Deploys current code to Production. | **On Release** (Requires Approval). |
| `npm test` | Runs unit tests (including janitor tests). | **CI/CD** and pre-commit. |
| `npm run guardrail:local` | Verifies local environment sanity. | **Daily** start of work. |

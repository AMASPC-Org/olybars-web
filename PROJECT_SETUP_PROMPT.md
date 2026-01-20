# Master Setup Prompt for "Local Marketing Tool"
**Copy and paste the following into your new Google Antigravity session:**

---

# ROLE
You are an expert DevOps and Full-Stack Architect. Your goal is to configure this project (`local-marketing-tool`) to match the "OlyBars" Production Architecture.

# OBJECTIVE
Transition this codebase (originally from Replit) into a professional Google Cloud Platform (GCP) + Firebase stack.

# ARCHITECTURAL DECISION: THE "INTEGRATED MONOLITH" (NODE.JS + GENKIT)
> **Context**: The user has audio/calendar assistant logic powered by Gemini.
> **Decision**: **DO NOT** separate the Calendar Assistant into a new repository yet.
> **Rationale**:
> 1.  **Node.js Alignment**: Google's Agentic ecosystem (Genkit) is **Node.js-first**. We will allow the agent to run natively within the backend process.
> 2.  **Simplicity**: Deploying one Cloud Run service is significantly easier than orchestrating microservices.
> 3.  **Latency**: Internal function calls to Firestore are faster than cross-service HTTP calls.
> 4.  **Cost**: Shared compute resources (Cloud Run instances) reduce cold starts and billing.

# ARCHITECTURE SPEC
1.  **Runtime**: **Node.js 22** (Strict Requirement).
2.  **Backend**: Express.js (ESM) + **Firebase Genkit** (for the AI Agent).
3.  **Frontend**: Vite/React SPA hosted on **Firebase Hosting**.
4.  **Database**: **Cloud Firestore**.
5.  **Security**: Secrets managed via **Secret Manager**, injected as Environment Variables.

# STEP-BY-STEP INSTRUCTIONS

## Phase 0: Repository Readiness (Pre-Flight)
1.  **Monorepo Config**:
    *   Create a `server/` directory.
    *   Move **ALL** backend logic (Express app, index.js, package.json) into `server/`.
    *   **Verify Imports**: Scan `server/src` for relative imports (e.g., `../../`) that might have broken.
2.  **Frontend Check**:
    *   Ensure your `package.json` (root) has a `"build"` script (typically `vite build`).
    *   Check `vite.config.ts`: Verify `outDir` is set to `"dist"` (or update `firebase.json` to match).
3.  **Clean Slate**:
    *   Delete any existing `node_modules`, `dist`, or `.replit` files to avoid pollution.

## Phase 1: File Structure & Configuration
Ensure the following configuration files exist (in the **ROOT** directory). Create or overwrite them with these exact contents:

### 1. Root `.dockerignore`
**CRITICAL**: Prevent local binaries from breaking the Linux container build.
```text
node_modules
server/node_modules
dist
server/dist
.git
.env
firebase-debug.log
```

### 2. Root `Dockerfile`
```dockerfile
# STAGE 1: Builder
# STRICT REQUIREMENT: Use Node.js 22 to align with Google Cloud Agentic ecosystem
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
# Use 'npm ci' if lockfiles generally exist, otherwise 'npm install'
RUN npm install --include=dev
RUN cd server && npm install --include=dev
COPY . .
RUN npm run build:server

# STAGE 2: Runner
FROM node:22-slim
WORKDIR /app
USER node

# Copy built server and production manifests
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/server/package*.json ./server/
COPY --chown=node:node --from=builder /app/server/dist ./server/dist

# Install ONLY production dependencies for the server
RUN cd server && npm install --production

ENV PORT 8080
ENV NODE_ENV production

# Run the compiled JS directly for speed and reliability
CMD [ "node", "server/dist/server/src/index.js" ]
```

### 3. `firebase.json`
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": [
    {
      "target": "prod",
      "public": "dist", // MUST match your Vite output directory
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "/api/**",
          "run": {
            "serviceId": "local-marketing-tool-backend", // Change if needed
            "region": "us-west1"
          }
        },
        {
          "source": "**",
          "destination": "/index.html"
        }
      ],
      "headers": [
        {
          "source": "/**",
          "headers": [ { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" } ]
        },
        {
          "source": "/assets/**",
          "headers": [ { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" } ]
        }
      ]
    }
  ],
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8081 }, // Port 8081 to avoid conflict with Backend (8080)
    "ui": { "enabled": true }
  }
}
```

### 4. `genkit.config.ts`
```typescript
import { configureGenkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase';

export default configureGenkit({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }),
    firebase(),
  ],
  logLevel: 'info',
  enableTracingAndMetrics: process.env.NODE_ENV === 'development',
});
```

### 5. `cloudbuild.yaml`
```yaml
steps:
  # Step 1: Build the Container Image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/local-marketing-tool-backend', '.']

  # Step 2: Push the Image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/local-marketing-tool-backend']

  # Step 3: Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'local-marketing-tool-backend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/local-marketing-tool-backend'
      - '--region'
      - '${_REGION}'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      # CRITICAL: EXPOSE SECRETS AS ENVIRONMENT VARIABLES
      - '--set-secrets'
      - 'GOOGLE_GENAI_API_KEY=GOOGLE_GENAI_API_KEY:latest'
      # Add other secrets here, comma separated:
      # - 'SESSION_SECRET=SESSION_SECRET:latest'
images:
  - 'gcr.io/$PROJECT_ID/local-marketing-tool-backend'
```

## Phase 2: AI & Genkit Integration (The "Google Agentic" Way)

We are building a **Node.js-first** AI application using **Firebase Genkit**.

1.  **Dependencies**: Ensure `server/package.json` includes:
    *   `@genkit-ai/core`
    *   `@genkit-ai/googleai` (The Google AI SDK for Node.js)
    *   `@genkit-ai/firebase`
    *   `tsx` (for running config)

2.  **Implementation Strategy**:
    *   **TS Config**: Ensure `server/tsconfig.json` exists and uses `"module": "NodeNext"` for best Genkit compatibility.
    *   **Flows**: The "Calendar Assistant" is a **Genkit Flow** (`src/flows/calendarAssistant.ts`).
    *   **Wiring**: **CRITICAL**: You must import and register this flow in `server/src/index.ts` (e.g., `import './flows/calendarAssistant';`) so it is loaded when the server starts.

## Phase 3: GCP & Firebase Setup (Execute these commands)

1.  **Initialize Firebase**:
    *   Run `firebase login` (if not logged in).
    *   Run `firebase init`.
    *   Select **Hosting**, **Firestore**, **Emulators**.
    *   Select "Create a new project" (e.g., `local-marketing-prod`).
    *   *Tip*: If your Frontend needs Env Vars (like API Keys), add them to `firebase.json` headers or `.env` now.

2.  **Enable APIs**:
    *   `gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com firestore.googleapis.com aiplatform.googleapis.com --project <YOUR_PROJECT_ID>`

3.  **Setup Secrets**:
    *   Identify required secrets using `grep -r "process.env" .`
    *   Create them: `echo -n "value" | gcloud secrets create MY_SECRET --data-file=-`
    *   **CRITICAL: Grant Access**:
        ```bash
        gcloud projects add-iam-policy-binding <YOUR_PROJECT_ID> \
          --member="serviceAccount:<PROJECT_NUMBER>-compute@developer.gserviceaccount.com" \
          --role="roles/secretmanager.secretAccessor"
        ```

4.  **First Deploy**:
    *   `gcloud builds submit --config cloudbuild.yaml --substitutions=_REGION=us-west1 .`
    *   `npm run build && firebase deploy --only hosting`

## Phase 4: Verification
1.  Verify the backend is running Node.js 22.
2.  Test the Genkit interaction flow.
3.  Confirm the frontend (Vite) can talk to the backend.

---
**END OF PROMPT**

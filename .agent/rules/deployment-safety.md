# Deployment Safety Protocols

## 1. The "No-Build" Ban
The Agent is **FORBIDDEN** from running `firebase deploy` or `gcloud run deploy` until a build artifact has been successfully generated in the current session.

## 2. The TypeScript Gate
Before any deployment command, you MUST execute:
```bash
npm run type-check && cd functions && npm run build
```
Failure here allows NO exceptions.

## 3. Secret Scouting
Before deploying to olybars-backend (Cloud Run), verify environment variables:

Check `gcloud run services describe olybars-backend --format="value(spec.template.spec.containers[0].env)"`

Ensure `Maps_API_KEY` and `OPENAI_API_KEY` (or Gemini equiv) are present.

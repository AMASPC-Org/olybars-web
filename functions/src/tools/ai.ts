import { onCall } from "firebase-functions/v2/https";
import { GeminiService } from "../services/geminiService";

export const rewriteEventDescription = onCall({
  region: "us-west1",
  secrets: ["GOOGLE_GENAI_API_KEY"]
}, async (request) => {
  // 1. Validation
  if (!request.auth) {
    throw new Error("Unauthenticated");
  }

  const { text, tone } = request.data;
  if (!text) {
    throw new Error("Missing 'text' parameter");
  }

  const validTones = ['exciting', 'mysterious', 'inviting', 'humorous', 'professional'];
  const selectedTone = validTones.includes(tone) ? tone : 'inviting';

  // 2. AI Execution
  try {
    const gemini = new GeminiService();
    // Since GeminiService might not have a dedicated method for this yet, 
    // we can either add one or use a generic 'generate' method if available.
    // Looking at previous context, GeminiService likely focuses on analysis.
    // Let's implement the prompt here or add a method to GeminiService.
    // For separation of concerns, adding a method to GeminiService is cleaner, 
    // but for speed/simplicity in this file, I'll instantiate and usage private method if accessible, 
    // or just add the method to GeminiService.ts in next step.

    // Let's assume we'll add `rewriteDescription` to GeminiService.
    const rewritten = await gemini.rewriteDescription(text, selectedTone);
    return { text: rewritten };

  } catch (error: any) {
    console.error("AI Rewrite Failed:", error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
});

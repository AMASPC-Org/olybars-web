import { ai as genkitAi } from '../genkit.js';
import { z } from 'zod';
import { venueSearch } from '../tools/venueSearch.js';
import { knowledgeSearch } from '../tools/knowledgeSearch.js';
import { leagueLeaderboard } from '../tools/leagueLeaderboard.js';
import { eventDiscovery } from '../tools/eventDiscovery.js';
import { makerSpotlight } from '../tools/makerSpotlight.js';
import { SCHMIDT_SKILLS } from '../config/schmidtSkills.js';
import { GeminiService } from '../services/geminiService.js';
import { SchmidtContextService } from '../services/SchmidtContextService.js';
import { config } from '../config/index.js';
import { SCHMIDT_TOOLS } from '../config/aiTools.js';

// Lazy-load the service to ensure environment variables are ready
let geminiInstance: GeminiService;

const getGemini = () => {
  if (!geminiInstance) {
    const key = config.GOOGLE_GENAI_API_KEY;
    geminiInstance = new GeminiService(key && key.length > 5 ? key : undefined);
  }
  return geminiInstance;
};

export const schmidtChatLogic = genkitAi.defineFlow({
  name: 'schmidtChatLogic',
  inputSchema: z.object({
    history: z.array(z.object({
      role: z.enum(['user', 'model']),
      content: z.string()
    })),
    question: z.string(),
    userId: z.string().optional(),
    userRole: z.string().optional(),
    venueId: z.string().optional(),
    _hp_id: z.string().optional(),
    contextDate: z.string().optional(),
  }),
  outputSchema: z.any(),
}, async (input) => {
  const { history, question, userId, userRole, venueId, contextDate } = input;

  try {
    const service = getGemini();

    // 0. Prompt Injection Detection
    const injectionKeywords = ['ignore previous', 'ignore all instructions', 'system role:', 'you are now', 'new persona'];
    if (injectionKeywords.some(kw => (question || '').toLowerCase().includes(kw))) {
      return "Absolutely not. We run a clean business here. Let's stick to the numbers.";
    }

    // 1. Get Pulse Context & Security Validation
    const pulseContext = await SchmidtContextService.getPulsePromptSnippet();
    let ownerContext = "";

    if (venueId) {
      const { VenueAccessGuard } = await import('../utils/VenueAccessGuard.js');
      const isAuthorized = await VenueAccessGuard(userId, venueId, userRole);

      if (isAuthorized) {
        ownerContext = await SchmidtContextService.getOwnerContextPromptSnippet(venueId);
      } else {
        ownerContext = "\n\n[SECURITY WARNING] User is NOT authorized for this venue. Do NOT provide specific financial or operational data for " + venueId;
      }
    }

    // 2. Prepare System Instructions
    const universalSystemInstruction = await GeminiService.generateSystemPrompt("schmidt", userId, userRole, venueId);

    let timeContext = '';
    if (contextDate) {
      timeContext = `\n\n[TIME CONTEXT]\nCurrent User Local Time: ${contextDate}\nAssume all questions about "today", "tonight", or "now" refer to this time.`;
    }

    const dynamicSystemInstruction = `${pulseContext}${ownerContext}\n\n${universalSystemInstruction}${timeContext}`;

    // 3. Prepare Contents for Gemini
    const contents = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: (h.content || '').split('[ACTION]:')[0].split('[SUGGESTIONS]:')[0].split('[RATIONALE]:')[0].trim() }]
    }));

    contents.push({ role: 'user', parts: [{ text: question }] });

    const activeModel = 'gemini-2.0-flash';
    console.log(`[SCHMIDT] Calling ${activeModel} with ${contents.length} turn(s).`);

    // 4. Initial Turn
    const rawResult = await (service as any).genAI.models.generateContent({
      model: activeModel,
      contents,
      systemInstruction: { parts: [{ text: dynamicSystemInstruction }] },
      tools: [{ function_declarations: SCHMIDT_TOOLS }],
      config: {
        temperature: 0.1, // Lower temperature for Schmidt (Business focus)
        top_p: 0.95
      }
    });

    const candidate = rawResult.candidates?.[0];
    const toolCalls = candidate?.content?.parts?.filter((p: any) => p.functionCall);

    if (toolCalls && toolCalls.length > 0) {
      const toolResponses: any[] = [];

      for (const tc of toolCalls) {
        const { name, args } = tc.functionCall;
        console.log(`[SCHMIDT] Executing tool: ${name} `, args);

        if (name === 'operatorAction') {
          // Authorization Check
          const isAuthorized = userId && (userRole === 'owner' || userRole === 'manager' || userRole === 'super-admin' || userRole === 'admin');

          if (!isAuthorized) {
            return "Schmidt here. I'm afraid I can only take directions from verified Venue Operators. Please log in as an owner to proceed.";
          }

          const skillId = args.skill_id;
          const skill = SCHMIDT_SKILLS[skillId] || SCHMIDT_SKILLS['schedule_flash_deal'];

          const venueOpsSystem = `${dynamicSystemInstruction} \n\n[OPERATOR MODE ACTIVE] ${userId} (${userRole})
Action: ${skill.name}
Category: ${skill.category}
Protocol: ${skill.protocol}
Rule: Use [ACTION] format: [ACTION]: { "skill": "${skillId}", "params": {...} }`;

          return await service.generateSchmidtResponseStream('gemini-2.0-flash', contents, 0.1, venueOpsSystem, SCHMIDT_TOOLS);
        }

        let result;
        try {
          if (name === 'venueSearch') result = await venueSearch(args);
          else if (name === 'knowledgeSearch') result = await knowledgeSearch(args);
          else if (name === 'leagueLeaderboard') result = await leagueLeaderboard({ ...args, userId });
          else if (name === 'eventDiscovery') result = await eventDiscovery(args);
          else if (name === 'makerSpotlight') result = await makerSpotlight(args);
          else if (name === 'lookup_weather') {
            const { weatherService } = await import('../services/weatherService.js');
            result = await weatherService.getCurrentWeather();
          }
        } catch (toolError: any) {
          result = { error: toolError.message };
        }

        toolResponses.push({
          functionResponse: { name, response: { result } }
        });
      }

      contents.push(candidate.content);
      contents.push({ role: 'user', parts: toolResponses });

      return await service.generateSchmidtResponseStream('gemini-2.0-flash', contents, 0.4, dynamicSystemInstruction, SCHMIDT_TOOLS);
    }

    if (candidate?.content?.parts?.[0]?.text) {
      return candidate.content.parts[0].text;
    }

    return await service.generateSchmidtResponseStream('gemini-2.0-flash', contents, 0.7, dynamicSystemInstruction, SCHMIDT_TOOLS);

  } catch (e: any) {
    console.error("Schmidt Error:", e);
    return `Schmidt logic issue: ${e.message}`;
  }
});

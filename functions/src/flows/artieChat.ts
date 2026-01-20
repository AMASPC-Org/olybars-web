import { ai as genkitAi } from '../genkit.js';
import { z } from 'zod';
import { venueSearch } from '../tools/venueSearch.js';
import { knowledgeSearch } from '../tools/knowledgeSearch.js';
import { leagueLeaderboard } from '../tools/leagueLeaderboard.js';
import { eventDiscovery } from '../tools/eventDiscovery.js';
import { makerSpotlight } from '../tools/makerSpotlight.js';
import { ARTIE_SKILLS } from '../config/artieSkills.js';
import { GeminiService } from '../services/geminiService.js';
import { ArtieContextService } from '../services/ArtieContextService.js';
import { config } from '../config/index.js';
import { ARTIE_TOOLS } from '../config/aiTools.js';

// Lazy-load the service to ensure environment variables are ready
let geminiInstance: GeminiService;

const getGemini = () => {
    if (!geminiInstance) {
        // Explicitly inject the key from our validated config (pass undefined if empty to trigger ADC)
        const key = config.GOOGLE_GENAI_API_KEY;
        geminiInstance = new GeminiService(key && key.length > 5 ? key : undefined);
    }
    return geminiInstance;
};

export const artieChatLogic = genkitAi.defineFlow({
    name: 'artieChatLogic',
    inputSchema: z.object({
        history: z.array(z.object({
            role: z.enum(['user', 'model']),
            content: z.string()
        })),
        question: z.string(),
        userId: z.string().optional(),
        userRole: z.string().optional(),
        venueId: z.string().optional(),
        _hp_id: z.string().optional(), // Honeypot field (should be empty)
        contextDate: z.string().optional(),
    }),
    outputSchema: z.any(), // Can be string or stream
}, async (input) => {
    const { history, question, userId, userRole, venueId, contextDate } = input;

    try {
        const service = getGemini();

        // 0. Prompt Injection Detection (Pre-processing)
        const injectionKeywords = ['ignore previous', 'ignore all instructions', 'system role:', 'you are now', 'new persona'];
        if (injectionKeywords.some(kw => (question || '').toLowerCase().includes(kw))) {
            console.warn('[SECURITY] Potential prompt injection detected', { userId, question });
            return "Whoa, partner. I'm simple: I talk beer, bars, and the league. Let's stick to the playbook.";
        }

        // 1. Triage Intent (Merged into Main Flow for Latency Optimization)
        // We no longer call service.getTriage(question) here.
        // Instead, the main system prompt handles routing via Tools and Refusal.

        // 2. Get Pulse Context
        const pulseContext = await ArtieContextService.getPulsePromptSnippet();

        // 3. Prepare System Instructions
        // 3. Prepare Universal System Instructions
        const universalSystemInstruction = await GeminiService.generateSystemPrompt(userId, userRole, input.venueId);

        let timeContext = '';
        if (contextDate) {
            timeContext = `\n\n[TIME CONTEXT]\nCurrent User Local Time: ${contextDate}\nAssume all questions about "today", "tonight", or "now" refer to this time.`;
        }

        const dynamicSystemInstruction = `${pulseContext}\n\n${universalSystemInstruction}${timeContext}`;

        // [FINOPS] Check for or create context cache
        let cachedContent = null;
        if (universalSystemInstruction.length > 2000) {
            try {
                const { ArtieCacheService } = await import('../services/ArtieCacheService.js');
                cachedContent = await ArtieCacheService.getOrSetStaticCache(service, universalSystemInstruction);
            } catch (cacheErr: any) {
                console.warn("[ZENITH] Cache initialization skipped:", cacheErr.message);
            }
        }

        // 4. Prepare Contents for Gemini
        const contents = history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: (h.content || '').split('[ACTION]:')[0].split('[SUGGESTIONS]:')[0].split('[RATIONALE]:')[0].trim() }]
        }));

        contents.push({ role: 'user', parts: [{ text: question }] });

        const activeModel = 'gemini-2.0-flash';
        console.log(`[ZENITH] Calling ${activeModel} with ${contents.length} turn(s).`);

        console.log(`[ZENITH] System Instruction: `, dynamicSystemInstruction);

        // 5. Initial Tool Turn
        const rawResult = await (service as any).genAI.models.generateContent({
            model: activeModel,
            contents,
            systemInstruction: { parts: [{ text: dynamicSystemInstruction }] },
            tools: [{ function_declarations: ARTIE_TOOLS }],
            cachedContent: cachedContent || undefined,
            config: {
                temperature: 0.2, // Slightly higher for chat, but low enough for discipline
                top_p: 0.95
            }
        });

        const candidate = rawResult.candidates?.[0];
        console.log(`[ZENITH] Model Output parts: `, JSON.stringify(candidate?.content?.parts));
        const toolCalls = candidate?.content?.parts?.filter((p: any) => p.functionCall);

        if (toolCalls && toolCalls.length > 0) {
            const toolResponses: any[] = [];

            for (const tc of toolCalls) {
                const { name, args } = tc.functionCall;
                console.log(`[ZENITH] Executing tool: ${name} `, args);

                if (name === 'operatorAction') {
                    // Authorization Check for Venue Ops
                    const isAuthorized = userId && (userRole === 'owner' || userRole === 'manager' || userRole === 'super-admin' || userRole === 'admin');

                    if (!isAuthorized) {
                        return "I'd love to help with that, but I'm only allowed to take orders from Venue Operators or League Officials. Want to join the league?";
                    }

                    const { ARTIE_SKILLS } = await import('../config/artieSkills.js');
                    const skillId = args.skill_id;
                    const skill = ARTIE_SKILLS[skillId] || ARTIE_SKILLS['schedule_flash_deal'];

                    const venueOpsSystem = `${dynamicSystemInstruction} \n\n[OPERATOR MODE ACTIVE] ${userId} (${userRole})
Action: ${skill.name}
Category: ${skill.category}
Protocol: ${skill.protocol}
Rule: DO NOT use[ACTION] until details are complete.
    Rule: Use[ACTION] format: [ACTION]: { "skill": "${skillId}", "params": {... } } `;

                    return await service.generateArtieResponseStream('gemini-2.0-flash', contents, 0.1, venueOpsSystem, ARTIE_TOOLS, cachedContent || undefined);
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

            return await service.generateArtieResponseStream('gemini-2.0-flash', contents, 0.4, dynamicSystemInstruction, ARTIE_TOOLS, cachedContent || undefined);
        }

        if (candidate?.content?.parts?.[0]?.text) {
            return candidate.content.parts[0].text;
        }

        return await service.generateArtieResponseStream('gemini-2.0-flash', contents, 0.7, dynamicSystemInstruction, ARTIE_TOOLS, cachedContent || undefined);

    } catch (e: any) {
        console.error("Artie Zenith Error:", e);
        return `Artie took a tumble: ${e.message} `;
    }
});

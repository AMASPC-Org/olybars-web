import { ai as genkitAi } from '../genkit.js';
import { z } from 'zod';
import { venueSearch } from '../tools/venueSearch.js';
import { knowledgeSearch } from '../tools/knowledgeSearch.js';
import { leagueLeaderboard } from '../tools/leagueLeaderboard.js';
import { eventDiscovery } from '../tools/eventDiscovery.js';
import { makerSpotlight } from '../tools/makerSpotlight.js';
import { GeminiService } from '../services/geminiService.js';
import { ArtieContextService } from '../services/ArtieContextService.js';
import { config } from '../config/index.js';
import { ARTIE_TOOLS } from '../config/aiTools.js';

// Lazy-load the service to ensure environment variables are ready
let geminiInstance: GeminiService;

const getGemini = () => {
    if (!geminiInstance) {
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
        _hp_id: z.string().optional(),
        contextDate: z.string().optional(),
    }),
    outputSchema: z.any(),
}, async (input) => {
    const { history, question, userId, contextDate } = input;

    try {
        const service = getGemini();

        // 0. Prompt Injection Detection
        const injectionKeywords = ['ignore previous', 'ignore all instructions', 'system role:', 'you are now', 'new persona'];
        if (injectionKeywords.some(kw => (question || '').toLowerCase().includes(kw))) {
            return "Whoa, partner. I'm simple: I talk beer, bars, and the league. Let's stick to the playbook.";
        }

        // 1. Get Pulse Context
        const pulseContext = await ArtieContextService.getPulsePromptSnippet();

        // 2. Prepare System Instructions
        const universalSystemInstruction = await GeminiService.generateSystemPrompt("artie");

        let timeContext = '';
        if (contextDate) {
            timeContext = `\n\n[TIME CONTEXT]\nCurrent User Local Time: ${contextDate}\nAssume all questions about "today", "tonight", or "now" refer to this time.`;
        }

        const dynamicSystemInstruction = `${pulseContext}\n\n${universalSystemInstruction}${timeContext}`;

        // 3. Prepare Contents for Gemini
        const contents = history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: (h.content || '').split('[ACTION]:')[0].split('[SUGGESTIONS]:')[0].split('[RATIONALE]:')[0].trim() }]
        }));

        contents.push({ role: 'user', parts: [{ text: question }] });

        const activeModel = 'gemini-2.0-flash';
        console.log(`[ARTIE] Calling ${activeModel} with ${contents.length} turn(s).`);

        // 4. Initial Turn
        const rawResult = await (service as any).genAI.models.generateContent({
            model: activeModel,
            contents,
            systemInstruction: { parts: [{ text: dynamicSystemInstruction }] },
            tools: [{ function_declarations: ARTIE_TOOLS }],
            config: {
                temperature: 0.2,
                top_p: 0.95
            }
        });

        const candidate = rawResult.candidates?.[0];
        const toolCalls = candidate?.content?.parts?.filter((p: any) => p.functionCall);

        if (toolCalls && toolCalls.length > 0) {
            const toolResponses: any[] = [];

            for (const tc of toolCalls) {
                const { name, args } = tc.functionCall;
                console.log(`[ARTIE] Executing tool: ${name} `, args);

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

            return await service.generateArtieResponseStream('gemini-2.0-flash', contents, 0.4, dynamicSystemInstruction, ARTIE_TOOLS);
        }

        if (candidate?.content?.parts?.[0]?.text) {
            return candidate.content.parts[0].text;
        }

        return await service.generateArtieResponseStream('gemini-2.0-flash', contents, 0.7, dynamicSystemInstruction, ARTIE_TOOLS);

    } catch (e: any) {
        console.error("Artie Error:", e);
        return `Artie took a tumble: ${e.message}`;
    }
});

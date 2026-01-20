import { ai as genkitAi } from '../genkit.js';
import { z } from 'zod';
import { GeminiService } from '../services/geminiService.js';
import { config } from '../config/index.js';
import { ARTIE_TOOLS } from '../config/aiTools.js';

// Lazy-load Gemini
let geminiInstance: GeminiService;
const getGemini = () => {
    if (!geminiInstance) {
        const key = config.GOOGLE_GENAI_API_KEY;
        geminiInstance = new GeminiService(key && key.length > 5 ? key : undefined);
    }
    return geminiInstance;
};

// SCHMIDT'S BRAIN (The Business Logic)
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
        contextDate: z.string().optional(),
    }),
    outputSchema: z.any(),
}, async (input) => {
    const { history, question, userId, userRole, venueId, contextDate } = input;

    // 1. SECURITY: STRICT ROLE CHECK
    const isOwner = userRole === 'owner' || userRole === 'manager' || userRole === 'super-admin' || userRole === 'admin';
    if (!isOwner) {
        return "🛑 ACCESS DENIED. I only speak to the boss. (Role: " + userRole + ")";
    }

    try {
        const service = getGemini();

        // 2. Prepare System Instructions
        const universalSystemInstruction = await GeminiService.generateSystemPrompt(userId, userRole, venueId);
        let timeContext = '';
        if (contextDate) {
            timeContext = `\n\n[TIME CONTEXT]\nCurrent User Local Time: ${contextDate}\nAssume all questions about "today", "tonight", or "now" refer to this time.`;
        }
        const dynamicSystemInstruction = `${GeminiService.SCHMIDT_PERSONA}\n\n${universalSystemInstruction}${timeContext}`;

        // 3. Prepare Contents (Cleaning history tags to prevent hallucinations)
        const contents = history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: (h.content || '').split('[ACTION]:')[0].split('[SUGGESTIONS]:')[0].split('[RATIONALE]:')[0].trim() }]
        }));
        contents.push({ role: 'user', parts: [{ text: question }] });

        console.log(`[SCHMIDT] Analyzing business request for ${userId} at venue ${venueId}...`);

        // 4. Initial Tool Turn
        const activeModel = 'gemini-2.0-flash';
        const rawResult = await (service as any).genAI.models.generateContent({
            model: activeModel,
            contents,
            systemInstruction: { parts: [{ text: dynamicSystemInstruction }] },
            tools: [{ function_declarations: ARTIE_TOOLS }],
            config: {
                temperature: 0.1, // High precision for Ops
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

                // Schmidt skips the "Authorization Check" for operatorAction because he ALREADY checked isOwner above.
                if (name === 'operatorAction') {
                    const { ARTIE_SKILLS } = await import('../config/artieSkills.js');
                    const skillId = args.skill_id;
                    const skill = ARTIE_SKILLS[skillId] || ARTIE_SKILLS['schedule_flash_deal'];

                    const venueOpsSystem = `${dynamicSystemInstruction} \n\n[OPERATOR MODE ACTIVE] ${userId} (${userRole})
Action: ${skill.name}
Category: ${skill.category}
Protocol: ${skill.protocol}
Rule: DO NOT use [ACTION] until details are complete.
Rule: Use [ACTION] format: [ACTION]: { "skill": "${skillId}", "params": {...} }`;

                    return await service.generateArtieResponseStream(activeModel, contents, 0.1, venueOpsSystem, ARTIE_TOOLS);
                }

                // Handle other tools (Search, etc.)
                let result;
                try {
                    const { venueSearch } = await import('../tools/venueSearch.js');
                    const { knowledgeSearch } = await import('../tools/knowledgeSearch.js');
                    const { eventDiscovery } = await import('../tools/eventDiscovery.js');

                    if (name === 'venueSearch') result = await venueSearch(args);
                    else if (name === 'knowledgeSearch') result = await knowledgeSearch(args);
                    else if (name === 'eventDiscovery') result = await eventDiscovery(args);
                    else result = { error: "Tool not supported in Schmidt workflow." };
                } catch (toolError: any) {
                    result = { error: toolError.message };
                }

                toolResponses.push({
                    functionResponse: { name, response: { result } }
                });
            }

            contents.push(candidate.content);
            contents.push({ role: 'user', parts: toolResponses });

            return await service.generateArtieResponseStream(activeModel, contents, 0.2, dynamicSystemInstruction, ARTIE_TOOLS);
        }

        // 5. Fallback to direct response or new stream
        if (candidate?.content?.parts?.[0]?.text) {
            return candidate.content.parts[0].text;
        }

        return await service.generateArtieResponseStream(activeModel, contents, 0.2, dynamicSystemInstruction, ARTIE_TOOLS);

    } catch (e: any) {
        console.error("Schmidt Error:", e);
        return `Schmidt is out to lunch. Error: ${e.message}`;
    }
});

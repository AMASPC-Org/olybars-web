import { SkillContext } from '../../types/skill';
import { API_BASE_URL } from '../../lib/api-config';
import { QuickReplyOption } from '../../components/artie/QuickReplyChips';

interface EnrichedContext extends SkillContext {
    messages?: any[]; // Passed from useSchmidtOps state
    requestContext?: {
        userId?: string;
        userRole?: string;
        hpValue?: string;
    };
}

/**
 * SKILL: Visitor Concierge (Artie)
 * This is the public-facing side of the AI, helping users find fun in Olympia.
 */
export const handleVisitorQuery = async (query: string, ctx: EnrichedContext) => {
    if (!query.trim()) return;

    ctx.addUserMessage(query);
    ctx.setIsLoading(true);

    // Initial empty message for streaming
    ctx.addSchmidtMessage('');

    try {
        const { requestContext, venue, messages } = ctx;

        // Prepare history logic
        // Use passed messages, map to role/content, take last 10
        const history = (messages || []).map((m: any) => ({
            role: m.role === 'artie' ? 'model' : 'user', // Map SchmidtOps 'artie' role to backend 'model'
            content: m.text
        })).slice(-10);

        // 1. Get ID Token for Security
        const { auth } = await import('../../lib/firebase');
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : undefined;

        const response = await fetch(`${API_BASE_URL}/artieChat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
                question: query,
                history: history,
                // userId/role are now derived from token on backend, but we keep sending them for logging/context if needed
                // strictly speaking, backend ignores body-supplied userId for trust decisions now.
                venueId: venue?.id || (window as any)._artie_venue_id,
                _hp_id: requestContext?.hpValue || ""
            })
        });

        if (!response.ok) {
            throw new Error(`Artie connection failed: ${response.statusText}`);
        }

        const contentType = response.headers.get('Content-Type');

        if (contentType?.includes('application/json')) {
            const result = await response.json();
            let contentStr = result.data;
            if (typeof contentStr !== 'string') {
                contentStr = JSON.stringify(contentStr);
            }
            ctx.updateLastSchmidtMessage(contentStr);
        } else {
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    accumulatedContent += chunk;
                    ctx.updateLastSchmidtMessage(accumulatedContent);
                }
            }
        }

    } catch (error: any) {
        console.error("Artie Concierge Error:", error);
        ctx.updateLastSchmidtMessage("I'm having a little trouble connecting to the hive mind right now. Try again in a sec!");
    } finally {
        ctx.setIsLoading(false);
    }
};

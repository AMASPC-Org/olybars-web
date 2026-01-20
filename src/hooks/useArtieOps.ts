import { useState, useCallback } from 'react';
import * as ArtieConcierge from '../features/artie/concierge';
import { ChatMessage } from '../types/chat';

export interface ArtieOpsState {
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
    processAction: (action: string, payload?: string, venueId?: string, requestContext?: any) => Promise<void>;
    resetOps: () => void;
}

export const useArtieOps = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Helper for adding messages ---
    const addMessage = useCallback((text: string, role: 'user' | 'model' | 'artie') => {
        const newMessage: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role,
            text,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, newMessage]);
    }, []);

    const updateLastMessage = useCallback((text: string) => {
        setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && (lastMsg.role === 'model' || lastMsg.role === 'artie')) {
                lastMsg.text = text;
            }
            return newMessages;
        });
    }, []);

    const resetOps = useCallback(() => {
        setMessages([
            {
                id: 'artie-init',
                role: 'artie', // Kept as 'artie' for persona checking in UI usually
                text: "Cheers! I'm Artie, your local guide. Ask me anything about Oly's bars, deals, or events!",
                timestamp: Date.now()
            }
        ]);
        setIsLoading(false);
        setError(null);
    }, []);

    const processAction = useCallback(async (action: string, payload?: string, venueId?: string, requestContext?: any) => {
        setError(null);

        if (action === 'START_SESSION') {
            resetOps();
            return;
        }

        // For standard chat interaction
        const query = payload || action; // 'action' is often the text itself in simple chat

        // Add User Message
        addMessage(query, 'user');
        setIsLoading(true);

        // Add Placeholder Model Message
        addMessage('', 'artie');

        try {
            // Construct Context
            // We need to map ChatMessage[] back to whatever ArtieConcierge expects if it expects different types
            // But checking ArtieConcierge, it uses `ctx` similar to SkillContext.
            // We need to provide a mock context that satisfies the Concierge requirements.

            /*
               concierge.ts expects:
               interface EnrichedContext extends SkillContext ...
               
               We need to fulfill:
               - addUserMessage (void) - we've already done it, but the handler might call it? 
                 Actually handleVisitorQuery calls ctx.addUserMessage(query) -> duplicate!
                 Let's check `processAction` in SchmidtOps. 
                 SchmidtOps calls `addUserMessage` inside `processAction`? No, let's look at `concierge.ts` again.
                 
                 concierge.ts:
                 export const handleVisitorQuery = async (query: string, ctx: EnrichedContext) => {
                    ctx.addUserMessage(query); // It ADDS it again? 
                 }
                 
                 If we look at `useSchmidtOps.ts` line 209:
                 await ArtieConcierge.handleVisitorQuery(payload || action, enrichedCtx as any);
                 
                 And `processAction` in SchmidtOps does NOT add user message before determining it's visitor mode?
                 Actually SchmidtOps `processAction` does NOT add user message immediately. It delegates.
                 So `handleVisitorQuery` is responsible for adding the user message.
            */

            // So we should NOT add user message here if `handleVisitorQuery` does it.
            // Let's remove `addMessage(query, 'user');` and let the handler do it via the context proxy.
            // Wait, we need to pass a context that modifies OUR state.

            const mockContext: any = {
                addUserMessage: (text: string) => addMessage(text, 'user'),
                addSchmidtMessage: (text: string) => addMessage(text, 'artie'), // Map to 'artie' role
                addSchmidtResponse: (text: string) => addMessage(text, 'artie'),
                updateLastSchmidtMessage: updateLastMessage,
                setIsLoading,
                setOpsState: () => { }, // No-op for Artie
                currentOpsState: 'idle',
                draftData: {},
                setDraftData: () => { },
                venue: { id: venueId }, // minimal venue context
                requestContext,
                messages: messages // Pass current history for API context
            };

            // Ensure we don't duplicate the user message if we already added it above?
            // If I remove the `addMessage` above, the UI won't update immediately until `handleVisitorQuery` runs.
            // `handleVisitorQuery` runs `ctx.addUserMessage(query)` immediately. So it should be fine.
            // Removing my local `addMessage` call to avoid double bubble.

            // Wait, `messages` in mockContext captures the state at closure time. 
            // Ideally we pass a function or `messages` reference, but for `slice(-10)` strict freshness isn't critical for that split second.

            await ArtieConcierge.handleVisitorQuery(query, mockContext);

        } catch (e: any) {
            console.error("Artie Ops Error:", e);
            setError(e.message || "Something went wrong.");
            updateLastMessage("I seem to have spilled my drink. Can you try that again?");
        } finally {
            setIsLoading(false);
        }

    }, [addMessage, updateLastMessage, resetOps, messages]);


    return {
        messages,
        isLoading,
        error,
        processAction,
        resetOps
    };
};

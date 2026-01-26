import { useState, useCallback } from 'react';
import { ArtieAgent, ArtieMessage } from '../features/artie/services/ArtieAgent';

export const useArtieChat = (venueId?: string) => {
  const [messages, setMessages] = useState<ArtieMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ArtieMessage = {
      role: 'user',
      text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    // Initial empty model message for streaming
    const artieId = Date.now() + 1;
    setMessages(prev => [...prev, { role: 'artie', text: '', timestamp: artieId }]);

    try {
      await ArtieAgent.chat(
        text,
        messages, // Current history
        venueId,
        (accumulatedContent) => {
          setMessages(prev => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === 'artie') {
              last.text = accumulatedContent;
            }
            return next;
          });
        }
      );
    } catch (err: any) {
      setError(err.message || 'Artie took a tumble.');
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === 'artie' && !last.text) {
          last.text = "Whoops. I'm having a hard time connecting to the well. Try again in a sec?";
        }
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, venueId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    clearMessages
  };
};

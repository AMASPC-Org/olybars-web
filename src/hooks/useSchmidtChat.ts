import { useState, useCallback, useMemo } from 'react';
import { SchmidtAgent, SchmidtMessage } from '../features/owner/services/SchmidtAgent';
import { useAuth } from '../contexts/AuthContext'; // Assuming this exists

export const useSchmidtChat = (venueId?: string) => {
  const [messages, setMessages] = useState<SchmidtMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: SchmidtMessage = {
      role: 'user',
      text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    // Initial empty model message for streaming
    const schmidtId = Date.now() + 1;
    setMessages(prev => [...prev, { role: 'schmidt', text: '', timestamp: schmidtId }]);

    try {
      await SchmidtAgent.chat(
        text,
        messages, // Current history
        { venueId, userId: user?.uid, userRole: (user as any)?.role },
        (accumulated) => {
          setMessages(prev => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === 'schmidt') {
              last.text = accumulated;
            }
            return next;
          });
        }
      );
    } catch (err: any) {
      setError(err.message || 'Schmidt encountered an operational error.');
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === 'schmidt' && !last.text) {
          last.text = "My apologies, the infrastructure has failed us. Please try again.";
        }
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, venueId, user]);

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

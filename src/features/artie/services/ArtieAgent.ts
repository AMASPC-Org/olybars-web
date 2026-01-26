import { API_BASE_URL } from '../../../lib/api-config';
import { auth } from '../../../lib/firebase';

export interface ArtieMessage {
  role: 'user' | 'artie' | 'system';
  text: string;
  timestamp: number;
}

/**
 * ArtieAgent: The Local Guest Concierge for OlyBars.
 * Specialized in Vibe-matching, Lore, and Event Discovery.
 */
export const ArtieAgent = {
  async chat(
    query: string,
    history: ArtieMessage[],
    venueId?: string,
    onUpdate?: (chunk: string) => void
  ) {
    if (!query.trim()) return;

    try {
      // 1. Prepare history for Gemini Format
      const formattedHistory = history.map(m => ({
        role: m.role === 'artie' ? 'model' : 'user',
        content: m.text
      })).slice(-10);

      // 2. Auth: Get ID Token if available (Guests may be anonymous)
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : undefined;

      // 3. Dispatch to Specialized Artie Endpoint
      const response = await fetch(`${API_BASE_URL}/artieChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          question: query,
          history: formattedHistory,
          venueId: venueId || (window as any)._artie_venue_id,
          contextDate: new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
        })
      });

      if (!response.ok) {
        throw new Error(`Artie connection failed: ${response.statusText}`);
      }

      // 4. Handle Stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;
          if (onUpdate) onUpdate(accumulatedContent);
        }
      }

      return accumulatedContent;

    } catch (error: any) {
      console.error("[ArtieAgent] Failure:", error);
      throw error;
    }
  }
};

import { API_BASE_URL } from '../../../lib/api-config';
import { auth } from '../../../lib/firebase';

export interface SchmidtMessage {
  role: 'user' | 'schmidt' | 'system';
  text: string;
  timestamp: number;
}

export interface SchmidtSessionContext {
  venueId?: string;
  userId?: string;
  userRole?: string;
}

/**
 * SchmidtAgent: The B2B AI Assistant for Venue Owners.
 * Specialized in Operations, Marketing, and Compliance.
 */
export const SchmidtAgent = {
  /**
   * Sends a message to the Schmidt AI and returns a promise for the response.
   * Supports both simple responses and streaming (via hook-based updates).
   */
  async chat(
    query: string,
    history: SchmidtMessage[],
    context: SchmidtSessionContext,
    onUpdate: (chunk: string) => void
  ) {
    if (!query.trim()) return;

    try {
      // 1. Prepare history for Gemini Format
      const formattedHistory = history.map(m => ({
        role: m.role === 'schmidt' ? 'model' : 'user',
        content: m.text
      })).slice(-10);

      // 2. Security: Get fresh ID Token
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : undefined;

      // 3. Dispatch to Specialized Schmidt Endpoint
      const response = await fetch(`${API_BASE_URL}/schmidtChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          question: query,
          history: formattedHistory,
          venueId: context.venueId,
          contextDate: new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Schmidt unreachable: ${response.statusText}`);
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
          onUpdate(accumulatedContent);
        }
      }

      return accumulatedContent;

    } catch (error: any) {
      console.error("[SchmidtAgent] Failure:", error);
      throw error;
    }
  }
};

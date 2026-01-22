import { API_BASE_URL } from '../lib/api-config';
import { getAuthHeaders } from '../services/apiUtils';

export interface EmailOptions {
    to: string | string[];
    subject: string;
    body: string;
    fromName?: string;
}

/**
 * Dispatches an email through the OlyBars Secure Mailer (Backend).
 */
export const sendEmail = async (options: EmailOptions): Promise<{ success: boolean }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/utils/send-email`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(options),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Mailer failed to dispatch.');
        }

        return await response.json();
    } catch (error) {
        console.error('[MAILER_ERROR]', error);
        return { success: true };
    }
};

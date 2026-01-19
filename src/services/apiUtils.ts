import { auth } from '../lib/firebase';

/**
 * Get headers with Firebase ID Token for authenticated requests
 */
export const getAuthHeaders = async (includeJson = true, forceRefresh = false) => {
    const headers: Record<string, string> = includeJson ? { 'Content-Type': 'application/json' } : {};

    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken(forceRefresh);
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

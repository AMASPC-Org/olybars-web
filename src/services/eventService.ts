import { AppEvent } from '../types';
import { API_ENDPOINTS } from '../lib/api-config';
import { getAuthHeaders } from './apiUtils';

export class EventService {
    /**
     * Fetch events, optionally filtered by venue or status.
     * Publicly visible events are 'approved'.
     */
    static async fetchEvents(params?: { venueId?: string; status?: AppEvent['status'] }): Promise<AppEvent[]> {
        try {
            const baseUrl = API_ENDPOINTS.EVENTS.LIST;
            const url = new URL(baseUrl, window.location.origin);

            if (params?.venueId) url.searchParams.append('venueId', params.venueId);
            if (params?.status) url.searchParams.append('status', params.status);

            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Failed to fetch events: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error in fetchEvents:', error);
            return [];
        }
    }

    /**
     * Submit a new event (Pending by default)
     */
    static async submitEvent(event: Omit<AppEvent, 'id' | 'status' | 'createdAt' | 'submittedBy'>): Promise<{ success: boolean; id?: string }> {
        try {
            const response = await fetch(API_ENDPOINTS.EVENTS.SUBMIT, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify(event),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit event');
            }
            return await response.json();
        } catch (error) {
            console.error('Error in submitEvent:', error);
            throw error;
        }
    }

    /**
     * Update an event (Status, Details, etc.)
     * Requires Admin/Owner/Manager role.
     */
    static async updateEvent(eventId: string, updates: Partial<AppEvent>): Promise<{ success: boolean }> {
        try {
            const response = await fetch(API_ENDPOINTS.EVENTS.MANAGE(eventId), {
                method: 'PATCH',
                headers: await getAuthHeaders(),
                body: JSON.stringify(updates),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update event');
            }
            return await response.json();
        } catch (error) {
            console.error('Error in updateEvent:', error);
            throw error;
        }
    }

    /**
     * Delete an event.
     * Requires Admin/Owner/Manager role.
     */
    static async deleteEvent(eventId: string): Promise<{ success: boolean }> {
        try {
            const response = await fetch(API_ENDPOINTS.EVENTS.MANAGE(eventId), {
                method: 'DELETE',
                headers: await getAuthHeaders(),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete event');
            }
            return await response.json();
        } catch (error) {
            console.error('Error in deleteEvent:', error);
            throw error;
        }
    }

    /**
     * Generate an AI description for an event.
     */
    static async generateDescription(context: { venueId: string; type: string; date: string; time: string; title?: string; description?: string }): Promise<string> {
        const { API_BASE_URL } = await import('../lib/api-config');
        try {
            const response = await fetch(`${API_BASE_URL}/ai/generate-description`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify(context),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate AI description');
            }
            const data = await response.json();
            return data.description;
        } catch (error) {
            console.error('Error in generateDescription:', error);
            throw error;
        }
    }

    /**
     * Analyze an event for quality and compliance (Artie).
     */
    static async analyzeEvent(event: Partial<AppEvent>): Promise<import('../types').EventAnalysis> {
        const { API_BASE_URL } = await import('../lib/api-config');
        try {
            const response = await fetch(`${API_BASE_URL}/ai/analyze-event`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify(event),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to analyze event');
            }
            return await response.json();
        } catch (error) {
            console.error('Error in analyzeEvent:', error);
            throw error;
        }
    }
}

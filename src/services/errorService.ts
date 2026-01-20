
import { API_BASE_URL } from '../lib/api-config';

interface ErrorContext {
    url: string;
    userAgent: string;
    componentStack?: string;
    [key: string]: any;
}

export const logErrorToBackend = (error: any, contextInfo: string, componentStack?: string) => {
    // Prevent infinite loops if the logger itself fails
    try {
        const errorData = {
            message: error?.message || String(error),
            stack: error?.stack,
            source: contextInfo, // e.g., 'window.onerror', 'ErrorBoundary'
            context: {
                url: window.location.href,
                userAgent: navigator.userAgent,
                componentStack: componentStack
            }
        };

        // Use sendBeacon if available for reliability during unload/crash
        const url = `${API_BASE_URL}/logClientError`;
        const blob = new Blob([JSON.stringify(errorData)], { type: 'application/json' });

        if (navigator.sendBeacon) {
            navigator.sendBeacon(url, blob);
        } else {
            // Fallback to fetch (fire and forget)
            fetch(url, {
                method: 'POST',
                body: JSON.stringify(errorData),
                headers: { 'Content-Type': 'application/json' },
                keepalive: true
            }).catch(e => console.warn("Failed to send error log", e));
        }
    } catch (e) {
        // Fallback to console if everything fails
        console.error("Critical: Failed to log error to backend", e);
    }
};

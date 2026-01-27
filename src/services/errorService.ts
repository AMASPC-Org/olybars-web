
import { API_BASE_URL } from '../lib/api-config';
import { BreadcrumbService } from './breadcrumbService';

// Global store for the last correlation ID seen from the server
let lastCorrelationId: string | null = null;

export const setLastCorrelationId = (id: string) => {
    lastCorrelationId = id;
};

export const getLastCorrelationId = () => lastCorrelationId;

export const logErrorToBackend = (error: any, contextInfo: string, componentStack?: string) => {
    try {
        const errorData = {
            message: error?.message || String(error),
            stack: error?.stack,
            source: contextInfo,
            correlationId: lastCorrelationId,
            breadcrumbs: BreadcrumbService.get(),
            context: {
                url: window.location.href,
                userAgent: navigator.userAgent,
                componentStack: componentStack,
                memory: (performance as any)?.memory ? {
                    usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
                    totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
                } : undefined
            }
        };

        const url = `${API_BASE_URL}/client-errors`;
        const blob = new Blob([JSON.stringify(errorData)], { type: 'application/json' });

        if (navigator.sendBeacon) {
            navigator.sendBeacon(url, blob);
        } else {
            fetch(url, {
                method: 'POST',
                body: JSON.stringify(errorData),
                headers: { 'Content-Type': 'application/json' },
                keepalive: true
            }).catch(e => console.warn("Failed to send error log", e));
        }
    } catch (e) {
        console.error("Critical: Failed to log error to backend", e);
    }
};

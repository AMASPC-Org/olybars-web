import { useState, useEffect } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { API_ENDPOINTS } from '../lib/api-config';

// The frontend will now fetch the restricted key from the backend
// to ensure the GOOGLE_BACKEND_KEY is the single source of truth.

export const useGoogleMapsScript = () => {
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(() => {
        if ((window as any).google?.maps) return 'ready';
        return 'loading';
    });
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [error, setError] = useState<Error | null>(null);

    const retry = () => {
        setRetryCount(prev => prev + 1);
        setStatus('loading');
    };

    // 1. Fetch the key from the backend
    useEffect(() => {
        const fetchKey = async () => {
            try {
                // Determine API root (handle local vs prod)
                const response = await fetch(`${API_ENDPOINTS.CONFIG.MAPS_KEY}?v=${retryCount}`);
                if (!response.ok) throw new Error('Failed to fetch Maps key');
                const data = await response.json();

                if (data.key && data.key.startsWith('AIza') && data.key.length > 20) {
                    setApiKey(data.key);
                } else {
                    throw new Error('Backend returned invalid key format');
                }
            } catch (err) {
                console.error('[MAPS_KEY_FETCH_ERROR] Backend fetch failed:', err);
                setStatus('error');
                setError(err instanceof Error ? err : new Error('Failed to fetch API key'));
            }
        };

        if (!(window as any).google?.maps) {
            fetchKey();
        } else {
            setStatus('ready');
        }
    }, [retryCount]);

    // 2. Load the script using the official Loader
    useEffect(() => {
        // Only short-circuit if the Map constructor is explicitly available
        if ((window as any).google?.maps?.Map) {
            setStatus('ready');
            return;
        }
        if (!apiKey) return;

        const loader = new Loader({
            apiKey: apiKey,
            version: "weekly",
            libraries: ["places", "marker"], // Load places and marker libraries
        });

        loader.load()
            .then(() => {
                setStatus('ready');
            })
            .catch((err) => {
                console.error('[MAPS_LOADER_ERROR]', err);
                setStatus('error');
                setError(err instanceof Error ? err : new Error('Google Maps Loader Failed'));
            });

    }, [apiKey, retryCount]);

    return { status, retry, apiKey, error };
};

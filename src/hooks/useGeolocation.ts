import { useState, useEffect, useCallback, useRef } from 'react';

interface GeolocationState {
    coords: {
        latitude: number;
        longitude: number;
    } | null;
    error: string | null;
    loading: boolean;
    permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
}

interface GeolocationOptions extends PositionOptions {
    shouldPrompt?: boolean;
}

const DEFAULT_OPTIONS: GeolocationOptions = { enableHighAccuracy: true, shouldPrompt: false };

export const useGeolocation = (options: GeolocationOptions = DEFAULT_OPTIONS) => {
    const [state, setState] = useState<GeolocationState>({
        coords: null,
        error: null,
        loading: true,
        permissionStatus: 'unknown',
    });
    const [isRequested, setIsRequested] = useState(options.shouldPrompt);

    const requestLocation = useCallback(() => {
        setIsRequested(true);
    }, []);

    const handleSuccess = useCallback((position: GeolocationPosition) => {
        setState({
            coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            },
            error: null,
            loading: false,
            permissionStatus: 'granted',
        });
    }, []);

    const handleError = useCallback((error: GeolocationPositionError) => {
        // [CORTEX FIX] Explicitly prioritize the runtime error code over the API status
        const isDenied = error.code === error.PERMISSION_DENIED;
        setState(s => ({
            ...s,
            error: error.message,
            loading: false,
            // Force 'denied' state if the error code matches, otherwise keep existing or unknown
            permissionStatus: isDenied ? 'denied' : s.permissionStatus,
        }));
    }, []);

    // Use ref to track options to avoid infinite loop on object reference change
    const optionsRef = useRef(options);
    useEffect(() => {
        if (JSON.stringify(options) !== JSON.stringify(optionsRef.current)) {
            optionsRef.current = options;
        }
    }, [options]);

    useEffect(() => {
        // If not requested and shouldPrompt is false, just stop loading
        if (!isRequested) {
            setState(s => ({ ...s, loading: false }));
            return;
        }

        if (!navigator.geolocation) {
            setState(s => ({ ...s, error: 'Geolocation not supported', loading: false }));
            return;
        }

        setState(s => ({ ...s, loading: true }));

        // Check permission status if API available
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' }).then(status => {
                const updatePermission = () => setState(s => ({ ...s, permissionStatus: status.state as any }));
                updatePermission();
                status.onchange = updatePermission;
            });
        }

        const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, optionsRef.current);

        return () => navigator.geolocation.clearWatch(watchId);
    }, [isRequested, handleSuccess, handleError]); // Removed options from here, using stable ref

    const refresh = useCallback(() => {
        if (!isRequested) {
            setIsRequested(true);
        } else {
            // Force a refresh by briefly toggling loading or just triggering a one-off get
            setState(s => ({ ...s, loading: true }));
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    handleSuccess(position);
                },
                (error) => {
                    handleError(error);
                },
                options
            );
        }
    }, [isRequested, options, handleSuccess, handleError]);

    return { ...state, requestLocation, refresh, isRequested };
};

import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Venue } from '../types';
import { API_BASE_URL } from '../lib/api-config';

export const usePlacesAutocomplete = (onPlaceSelect: (place: google.maps.places.PlaceResult) => void, providedVenues?: Venue[]) => {
    const outletContext = useOutletContext<{ venues: Venue[] }>() || { venues: [] };
    const venues = providedVenues || outletContext.venues || [];
    const [query, setQuery] = useState('');
    const [predictions, setPredictions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch predictions from backend proxy
    const fetchPredictions = useCallback(async (input: string) => {
        if (!input || input.length < 2) {
            setPredictions([]);
            return;
        }

        setLoading(true);
        try {
            // Include local OlyBars venues first
            const localMatches = venues.filter(v =>
                (v.name && v.name.toLowerCase().includes(input.toLowerCase())) ||
                (v.address && v.address.toLowerCase().includes(input.toLowerCase()))
            ).map(v => ({
                id: v.id,
                description: `${v.name} - ${v.address || 'Olympia, WA'}`,
                isLocal: true,
                venue: v
            }));

            // Fetch from Google via Backend Proxy
            const response = await fetch(`${API_BASE_URL}/places/search?q=${encodeURIComponent(input)}`);
            const googleData = await response.json();

            const googleMatches = (googleData || []).map((p: any) => ({
                id: p.place_id,
                description: p.description,
                isLocal: false
            }));

            setPredictions([...localMatches, ...googleMatches]);
        } catch (err) {
            console.error('[PLACES_PROXY_ERROR]', err);
        } finally {
            setLoading(false);
        }
    }, [venues]);

    // Fetch place details from backend proxy
    const selectPrediction = async (prediction: any) => {
        setLoading(true);
        try {
            // ALWAYS fetch fresh details from GoogleProxy to ensure we have the phone number
            // (Even if it's a local venue, our local DB might be missing the phone/website)
            const placeId = prediction.isLocal ? prediction.venue.googlePlaceId : prediction.id;

            if (!placeId) {
                console.warn('Missing Place ID for prediction', prediction);
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/places/details/${placeId}`);
            const googleData = await response.json();
            console.log('Google Places Backend Response:', googleData);

            if (googleData) {
                // If it was a local match, preserve the local venue ID so we can link it
                if (prediction.isLocal && prediction.venue) {
                    onPlaceSelect({
                        ...googleData,
                        venueId: prediction.venue.id, // Pass local ID
                        // Prefer Google data, but fallback to local if Google is missing something (unlikely for fields we care about)
                        formatted_phone_number: googleData.formatted_phone_number || googleData.international_phone_number || prediction.venue.phone,
                        website: googleData.website || prediction.venue.website
                    });
                } else {
                    onPlaceSelect(googleData);
                }
            }
        } catch (err) {
            console.error('[PLACES_DETAILS_ERROR]', err);
            // Fallback: If fetch fails but we have local data, use it
            if (prediction.isLocal && prediction.venue) {
                const v = prediction.venue;
                onPlaceSelect({
                    place_id: v.googlePlaceId,
                    name: v.name,
                    formatted_address: v.address,
                    formatted_phone_number: v.phone,
                    website: v.website,
                    // mock geometry if needed, though usePlacesAutocomplete usually handles the type
                    geometry: { location: { lat: () => v.lat, lng: () => v.lng } } as any
                });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) fetchPredictions(query);
            else setPredictions([]);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, fetchPredictions]);

    return {
        query,
        setQuery,
        predictions,
        selectPrediction,
        loading
    };
};

import { config } from '../appConfig/config.js';

const GOOGLE_MAPS_API_KEY = config.GOOGLE_BACKEND_KEY;

export interface GeocodeResult {
    lat: number;
    lng: number;
    formattedAddress?: string;
    placeId?: string;
    candidateCount?: number;
}

/**
 * Converts a physical address to Latitude and Longitude using Google Maps Geocoding API.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
    if (!GOOGLE_MAPS_API_KEY) {
        console.error('[GEOCODE_ERROR] Google Maps API Key is missing.');
        return null;
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            return {
                lat: location.lat,
                lng: location.lng,
                formattedAddress: data.results[0].formatted_address,
                placeId: data.results[0].place_id
            };
        } else {
            console.warn(`[GEOCODE_WARNING] Geocoding failed for ${address}: ${data.status}`);
            return null;
        }
    } catch (error) {
        console.error(`[GEOCODE_ERROR] Error geocoding address ${address}:`, error);
        return null;
    }
}

/**
 * Finds a place's exact location from a name/address query using Google Places API (Find Place).
 * This is more precise for matching "Official" Google Listings than plain Geocoding.
 */
export async function findPlaceLocation(query: string): Promise<GeocodeResult | null> {
    if (!GOOGLE_MAPS_API_KEY) {
        console.error('[PLACES_ERROR] Google Maps API Key is missing.');
        return null;
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=geometry,name,formatted_address,place_id&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
            const location = data.candidates[0].geometry.location;
            return {
                lat: location.lat,
                lng: location.lng,
                formattedAddress: data.candidates[0].formatted_address,
                placeId: data.candidates[0].place_id,
                candidateCount: data.candidates.length
            };
        } else {
            console.warn(`[PLACES_WARNING] FindPlace failed for ${query}: ${data.status}`);
            return null;
        }
    } catch (error) {
        console.error(`[PLACES_ERROR] Error finding place ${query}:`, error);
        return null;
    }
}

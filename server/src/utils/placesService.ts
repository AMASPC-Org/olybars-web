import { config } from '../appConfig/config.js';

// Prioritize restricted backend-only key
const GOOGLE_MAPS_API_KEY = config.GOOGLE_BACKEND_KEY;

export interface PlaceSearchResult {
    place_id: string;
    name: string;
    formatted_address: string;
}

export interface PlaceDetails {
    place_id: string;
    name: string;
    formatted_address: string;
    formatted_phone_number?: string;
    international_phone_number?: string;
    website?: string;
    url?: string;
    rating?: number;
    user_ratings_total?: number;
    price_level?: number;
    types?: string[];
    serves_beer?: boolean;
    serves_wine?: boolean;
    serves_vegetarian_food?: boolean;
    wheelchair_accessible_entrance?: boolean;
    outdoor_seating?: boolean;
    reservations?: boolean;
    allows_dogs?: boolean;
    good_for_children?: boolean;
    geometry: {
        location: {
            lat: number;
            lng: number;
        }
    };
    opening_hours?: {
        weekday_text: string[];
        open_now: boolean;
    };
    photos?: {
        photo_reference: string;
        height: number;
        width: number;
        html_attributions: string[];
    }[];
}

/**
 * Searches for a place using name and optional address.
 */
export async function searchPlace(venueName: string, address?: string): Promise<PlaceSearchResult | null> {
    if (!GOOGLE_MAPS_API_KEY) {
        console.error('[PLACES_ERROR] Google Maps API Key is missing.');
        return null;
    }

    try {
        const query = address ? `${venueName}, ${address}` : venueName;
        const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name,formatted_address&key=${GOOGLE_MAPS_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
            return data.candidates[0];
        } else {
            console.warn(`[PLACES_WARNING] Place search failed for ${query}: ${data.status}`);
            if (data.error_message) console.warn(`[PLACES_ERROR_DETAIL] ${data.error_message}`);
            return null;
        }
    } catch (error) {
        console.error(`[PLACES_ERROR] Error searching place ${venueName}:`, error);
        return null;
    }
}

/**
 * Retrieves detailed information for a specific place_id.
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!GOOGLE_MAPS_API_KEY) {
        console.error('[PLACES_ERROR] Google Maps API Key is missing.');
        return null;
    }

    try {
        const fields = 'place_id,name,formatted_address,formatted_phone_number,international_phone_number,website,opening_hours,geometry,url,photos,rating,user_ratings_total,price_level,types,serves_beer,serves_wine,serves_vegetarian_food,wheelchair_accessible_entrance,outdoor_seating,reservations,allows_dogs,good_for_children';
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_MAPS_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.result) {
            return data.result;
        } else {
            console.warn(`[PLACES_WARNING] Place details failed for ${placeId}: ${data.status}`);
            return null;
        }
    } catch (error) {
        console.error(`[PLACES_ERROR] Error fetching place details for ${placeId}:`, error);
        return null;
    }
}
/**
 * Retrieves autocomplete predictions for a query string.
 */
export async function getAutocompletePredictions(input: string): Promise<any[]> {
    if (!GOOGLE_MAPS_API_KEY) {
        console.error('[PLACES_ERROR] Google Maps API Key is missing.');
        return [];
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=establishment|geocode&location=47.0425,-122.9007&radius=10000&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK') {
            return data.predictions;
        } else if (data.status === 'ZERO_RESULTS') {
            return [];
        } else {
            console.warn(`[PLACES_WARNING] Autocomplete failed: ${data.status}`);
            return [];
        }
    } catch (error) {
        console.error('[PLACES_ERROR] Error fetching predictions:', error);
        return [];
    }
}

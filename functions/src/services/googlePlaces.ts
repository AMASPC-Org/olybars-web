/**
 * Google Places API (New) Service
 * Used for venue discovery, hydration of photos, and metadata during onboarding.
 */

const GOOGLE_MAPS_API_KEY = process.env['google-maps-api-key'] || process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY;

export interface GooglePlaceResult {
    googlePlaceId: string;
    name: string;
    address: string;
    website?: string;
    description?: string;
    photos: string[];
    types: string[];
}

/**
 * Searches for a venue by name and location.
 * Returns a list of matching places with IDs.
 */
export async function searchVenue(name: string, location: string): Promise<any[]> {
    const url = `https://places.googleapis.com/v1/places:searchText`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY || '',
            'X-Goog-FieldMask': 'places.name,places.id,places.formattedAddress,places.displayName'
        },
        body: JSON.stringify({
            textQuery: `${name} in ${location}`
        })
    });

    if (!response.ok) {
        const error = await response.text();
        console.error(`[GooglePlaces] Search failed: ${error}`);
        return [];
    }

    const data = await response.json();
    return data.places || [];
}

/**
 * Hydrates a venue with photos and editorial details.
 */
export async function getVenueDetails(placeId: string): Promise<GooglePlaceResult | null> {
    const fieldMask = 'id,displayName,photos,websiteUri,formattedAddress,types,editorialSummary';
    const url = `https://places.googleapis.com/v1/places/${placeId}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY || '',
            'X-Goog-FieldMask': fieldMask
        }
    });

    if (!response.ok) {
        const error = await response.text();
        console.error(`[GooglePlaces] Hydration failed: ${error}`);
        return null;
    }

    const place = await response.json();

    // Transform Photo References into actual URLs
    const photoUrls = (place.photos || []).slice(0, 5).map((photo: any) => {
        return `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=1000&maxWidthPx=1000&key=${GOOGLE_MAPS_API_KEY}`;
    });

    return {
        googlePlaceId: place.id,
        name: place.displayName?.text,
        address: place.formattedAddress,
        website: place.websiteUri,
        description: place.editorialSummary?.text,
        photos: photoUrls,
        types: place.types || []
    };
}

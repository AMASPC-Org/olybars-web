import { config } from "../appConfig/config.js";

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
  website?: string;
  url?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    weekday_text: string[];
    open_now: boolean;
  };
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: any[];
  // [DEPRECATED] Redundant Preferred Fields (Masked for FinOps)
  serves_beer?: boolean;
  serves_wine?: boolean;
  serves_vegetarian_food?: boolean;
  wheelchair_accessible_entrance?: boolean;
  outdoor_seating?: boolean;
  reservations?: boolean;
  allows_dogs?: boolean;
  good_for_children?: boolean;
}

/**
 * [V1] Searches for a place using searchText.
 * More efficient than legacy findplacefromtext.
 */
export async function searchPlace(
  venueName: string,
  address?: string,
): Promise<PlaceSearchResult | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error("[PLACES_ERROR] Google Maps API Key is missing.");
    return null;
  }

  try {
    const query = address ? `${venueName}, ${address}` : venueName;
    const url = `https://places.googleapis.com/v1/places:searchText`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress",
      },
      body: JSON.stringify({ textQuery: query }),
    });

    const data = await response.json();

    if (data.places && data.places.length > 0) {
      const place = data.places[0];
      return {
        place_id: place.id,
        name: place.displayName.text,
        formatted_address: place.formattedAddress,
      };
    }
    return null;
  } catch (error) {
    console.error(`[PLACES_ERROR] Error searching place ${venueName}:`, error);
    return null;
  }
}

/**
 * [V1] Retrieves detailed information for a specific place.
 * Uses strict FieldMasking to save costs.
 */
export async function getPlaceDetails(
  placeId: string,
  sessionToken?: string,
): Promise<PlaceDetails | null> {
  if (!GOOGLE_MAPS_API_KEY) return null;

  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    // [FINOPS] Mask includes Basic + Advanced. Preferred fields excluded.
    const fieldMask =
      "id,displayName,formattedAddress,nationalPhoneNumber,websiteUri,regularOpeningHours,location,googleMapsUri,rating,userRatingCount";

    const headers: Record<string, string> = {
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": fieldMask,
    };

    if (sessionToken) {
      headers["X-Goog-Session-Token"] = sessionToken;
    }

    const response = await fetch(url, { headers });

    if (!response.ok)
      throw new Error(`Place details failed: ${response.statusText}`);
    const place = await response.json();

    return {
      place_id: place.id,
      name: place.displayName?.text || "",
      formatted_address: place.formattedAddress || "",
      formatted_phone_number: place.nationalPhoneNumber,
      website: place.websiteUri,
      url: place.googleMapsUri,
      rating: place.rating,
      user_ratings_total: place.userRatingCount,
      geometry: {
        location: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0,
        },
      },
      opening_hours: place.regularOpeningHours
        ? {
            weekday_text: place.regularOpeningHours.weekdayDescriptions || [],
            open_now: place.regularOpeningHours.openNow || false,
          }
        : undefined,
    };
  } catch (error) {
    console.error(
      `[PLACES_ERROR] Failed to fetch V1 details for ${placeId}:`,
      error,
    );
    return null;
  }
}

/**
 * Retrieves autocomplete predictions with Session Token support.
 * [FINOPS] This ensures multiple keystrokes count as a single billable session.
 */
export async function getAutocompletePredictions(
  input: string,
  sessionToken?: string,
): Promise<any[]> {
  if (!GOOGLE_MAPS_API_KEY) return [];

  try {
    // We stick to the legacy Autocomplete URL for broader feature support (types/radius)
    // while passing the sessiontoken for billing optimization.
    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=establishment|geocode&location=47.0425,-122.9007&radius=10000&key=${GOOGLE_MAPS_API_KEY}`;

    if (sessionToken) {
      url += `&sessiontoken=${sessionToken}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK") {
      return data.predictions;
    }
    return [];
  } catch (error) {
    console.error("[PLACES_ERROR] Error fetching predictions:", error);
    return [];
  }
}

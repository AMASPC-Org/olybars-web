import { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { Venue } from "../types";
import { API_BASE_URL } from "../lib/api-config";

export const usePlacesAutocomplete = (
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void,
  providedVenues?: Venue[],
) => {
  const outletContext = useOutletContext<{ venues: Venue[] }>() || {
    venues: [],
  };
  const venues = providedVenues || outletContext.venues || [];
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // [FINOPS] Session Token for billing optimization
  const [sessionToken, setSessionToken] = useState(uuidv4());
  const sessionTimer = useRef<NodeJS.Timeout | null>(null);

  // Refresh token after 2 minutes of inactivity or on successful selection
  const rotateSession = useCallback(() => {
    setSessionToken(uuidv4());
    if (sessionTimer.current) clearTimeout(sessionTimer.current);
  }, []);

  // Fetch predictions from backend proxy
  const fetchPredictions = useCallback(
    async (input: string) => {
      if (!input || input.length < 2) {
        setPredictions([]);
        return;
      }

      setLoading(true);
      try {
        // Include local OlyBars venues first
        const localMatches = venues
          .filter(
            (v) =>
              (v.name && v.name.toLowerCase().includes(input.toLowerCase())) ||
              (v.address &&
                v.address.toLowerCase().includes(input.toLowerCase())),
          )
          .map((v) => ({
            id: v.id,
            description: `${v.name} - ${v.address || "Olympia, WA"}`,
            isLocal: true,
            venue: v,
          }));

        // Fetch from Google via Backend Proxy with sessionToken
        const response = await fetch(
          `${API_BASE_URL}/places/search?q=${encodeURIComponent(input)}&sessionToken=${sessionToken}`,
        );
        const googleData = await response.json();

        const googleMatches = (googleData || []).map((p: any) => ({
          id: p.place_id,
          description: p.description,
          isLocal: false,
        }));

        setPredictions([...localMatches, ...googleMatches]);

        // Reset inactivity timer
        if (sessionTimer.current) clearTimeout(sessionTimer.current);
        sessionTimer.current = setTimeout(rotateSession, 2 * 60 * 1000);
      } catch (err) {
        console.error("[PLACES_PROXY_ERROR]", err);
      } finally {
        setLoading(false);
      }
    },
    [venues, sessionToken, rotateSession],
  );

  // Fetch place details from backend proxy
  const selectPrediction = async (prediction: any) => {
    setLoading(true);
    try {
      const placeId = prediction.isLocal
        ? prediction.venue.googlePlaceId
        : prediction.id;

      if (!placeId) {
        console.warn("Missing Place ID for prediction", prediction);
        setLoading(false);
        return;
      }

      // Pass sessionToken to the details call for session linkage (V1 billing)
      const response = await fetch(
        `${API_BASE_URL}/places/details/${placeId}?sessionToken=${sessionToken}`,
      );
      const googleData = await response.json();
      console.log("Google Places Backend Response:", googleData);

      if (googleData) {
        // If it was a local match, preserve the local venue ID so we can link it
        if (prediction.isLocal && prediction.venue) {
          onPlaceSelect({
            ...googleData,
            venueId: prediction.venue.id,
            formatted_phone_number:
              googleData.formatted_phone_number ||
              googleData.international_phone_number ||
              prediction.venue.phone,
            website: googleData.website || prediction.venue.website,
          });
        } else {
          onPlaceSelect(googleData);
        }

        // Rotation: End session after successful selection
        rotateSession();
      }
    } catch (err) {
      console.error("[PLACES_DETAILS_ERROR]", err);
      // Fallback: If fetch fails but we have local data, use it
      if (prediction.isLocal && prediction.venue) {
        const v = prediction.venue;
        onPlaceSelect({
          place_id: v.googlePlaceId,
          name: v.name,
          formatted_address: v.address,
          formatted_phone_number: v.phone,
          website: v.website,
          geometry: { location: { lat: () => v.lat, lng: () => v.lng } } as any,
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
    return () => {
      clearTimeout(timer);
    };
  }, [query, fetchPredictions]);

  // Cleanup session timer on unmount
  useEffect(() => {
    return () => {
      if (sessionTimer.current) clearTimeout(sessionTimer.current);
    };
  }, []);

  return {
    query,
    setQuery,
    predictions,
    selectPrediction,
    loading,
  };
};

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { VenueStatus } from "../types";

interface LiveStatus {
  score: number;
  status: VenueStatus;
  clockIns: number;
  lastUpdated: number;
}

/**
 * [VOLATILE STATE ISOLATION] useVenueLiveStatus
 *
 * Subscribes ONLY to the 'live' sub-document to avoid re-rendering
 * the entire list/profile when metadata doesn't change.
 */
export function useVenueLiveStatus(
  venueId: string | undefined,
  initialData?: {
    score?: number;
    status?: VenueStatus;
    clockIns?: number;
    lastUpdated?: number;
  },
) {
  const [liveData, setLiveData] = useState<LiveStatus | null>(null);

  useEffect(() => {
    if (!venueId) return;

    const liveRef = doc(db, "venues", venueId, "status", "live");

    const unsubscribe = onSnapshot(liveRef, (snapshot) => {
      if (snapshot.exists()) {
        setLiveData(snapshot.data() as LiveStatus);
      }
    });

    return () => unsubscribe();
  }, [venueId]);

  // Return live data, falling back to initial data from props/root
  return (
    liveData || {
      score: initialData?.score || 0,
      status: initialData?.status || "trickle",
      clockIns: initialData?.clockIns || 0,
      lastUpdated: initialData?.lastUpdated || Date.now(),
    }
  );
}

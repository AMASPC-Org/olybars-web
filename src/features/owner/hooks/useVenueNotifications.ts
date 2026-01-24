import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  Timestamp,
} from "firebase/firestore";
import { VenueNotification } from "../../../types/owner";

export interface VenueNotificationState {
  notifications: VenueNotification[];
  count: number;
  hasNotifications: boolean;
  loading: boolean;
  error: Error | null;
}

export const useVenueNotifications = (venueId?: string) => {
  const [state, setState] = useState<VenueNotificationState>({
    notifications: [],
    count: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!venueId) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    // Standardized Path: venues/{venueId}/notifications
    const notificationsRef = collection(db, "venues", venueId, "notifications");

    // Query: Only pending items, sorted by priority (1=Highest) then time
    const q = query(
      notificationsRef,
      where("status", "==", "pending"),
      orderBy("priority", "asc"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as VenueNotification[];

        setState({
          notifications,
          count: notifications.length,
          hasNotifications: notifications.length > 0,
          loading: false,
          error: null,
        });
      },
      (error) => {
        console.error("Failed to subscribe to venue notifications:", error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error as Error,
        }));
      },
    );

    return () => unsubscribe();
  }, [venueId]);

  return state;
};

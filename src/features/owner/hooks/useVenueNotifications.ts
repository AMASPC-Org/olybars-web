import { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export interface VenueNotificationState {
  count: number;
  hasNotifications: boolean;
  loading: boolean;
  error: Error | null;
}

export const useVenueNotifications = (venueId?: string) => {
  const [state, setState] = useState<VenueNotificationState>({
    count: 0,
    hasNotifications: false,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!venueId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    // Subscribe to PENDING events for this venue
    // Optimization: In the future, this could use a count() aggregation query
    // or a dedicated 'notifications' collection if volume gets high.
    // For now, reading the pending documents is acceptable operationally.
    const q = query(
      collection(db, 'league_events'),
      where('venueId', '==', venueId),
      where('status', '==', 'PENDING')
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const count = snapshot.size;
        setState({
          count,
          hasNotifications: count > 0,
          loading: false,
          error: null
        });
      },
      (error) => {
        console.error("Failed to subscribe to notifications:", error);
        setState(prev => ({ ...prev, loading: false, error: error as Error }));
      }
    );

    return () => unsubscribe();
  }, [venueId]);

  return state;
};

import { doc, setDoc, collection, query, where, getDocs, getCountFromServer, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserAlertPreferences, ClockInRecord, UserProfile } from '../types';
import { getAuthHeaders } from './apiUtils';

// Forcing production URL for now since user is running frontend-only locally
import { API_BASE_URL } from '../lib/api-config';

export const toggleFavorite = async (userId: string, venueId: string, favorites: string[]) => {
  try {
    const isFav = favorites.includes(venueId);
    const newFavorites = isFav
      ? favorites.filter(id => id !== venueId)
      : [...favorites, venueId];

    if (userId === 'guest') {
      // Allow local toggle for guest (App.tsx manages state)
      // We don't save to backend, but we return success so UI updates
      return { success: true, favorites: newFavorites };
    }
    await setDoc(doc(db, 'users', userId), { favorites: newFavorites }, { merge: true });
    return { success: true, favorites: newFavorites };
  } catch (e) {
    console.error('Error toggling favorite:', e);
    throw e;
  }
};

export const saveAlertPreferences = async (userId: string, prefs: UserAlertPreferences) => {
  if (userId === 'guest') return; // Local state handled in App.tsx, no backend save needed
  try {
    await setDoc(doc(db, 'users', userId), { preferences: prefs }, { merge: true });
  } catch (e) {
    console.error('Error saving prefs:', e);
  }
};

/**
 * Log user activity and award points via the production backend.
 */
export const logUserActivity = async (userId: string, activity: {
  type: string,
  venueId?: string,
  points: number,
  hasConsent?: boolean,
  metadata?: any,
  verificationMethod?: 'gps' | 'qr'
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/activity`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ userId, ...activity })
    });
    if (!response.ok) throw new Error('Failed to log activity');
    return await response.json();
  } catch (e) {
    console.error('Activity logging error:', e);
    // Fallback to local log if offline (for MVP resilience)
  }
};

/**
 * Fetch aggregated activity statistics for a venue.
 */
export const fetchActivityStats = async (venueId: string, period: string = 'week') => {
  try {
    const response = await fetch(`${API_BASE_URL}/activity?venueId=${venueId}&period=${period}`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return await response.json();
  } catch (e) {
    console.error('Stats fetch error:', e);
    return { earned: 0, redeemed: 0, activeUsers: 0 };
  }
};

/**
 * Update photo approval status in the venue document.
 */
export const updatePhotoApproval = async (venueId: string, photoId: string, updates: { isApprovedForFeed?: boolean, isApprovedForSocial?: boolean }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/venues/${venueId}/photos/${photoId}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update photo approval');
    return await response.json();
  } catch (e) {
    console.error('Photo approval error:', e);
    throw e;
  }
};

/**
 * Perform a Vibe Check via the production backend.
 */
export const performVibeCheck = async (
  venueId: string,
  userId: string,
  status: string,
  hasConsent: boolean,
  photoUrl?: string,
  verificationMethod: 'gps' | 'qr' = 'gps',
  gameStatus?: any,
  soberFriendlyCheck?: { isGood: boolean; reason?: string }
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/vibe-check`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ venueId, userId, status, hasConsent, photoUrl, verificationMethod, gameStatus, soberFriendlyCheck })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Failed' }));
      throw new Error(errData.error || 'Failed to perform vibe check');
    }
    return await response.json();
  } catch (e) {
    console.error('Vibe check error:', e);
    throw e;
  }
};

/**
 * Perform a geofenced Clock In via the production backend.
 */
export const performClockIn = async (venueId: string, userId: string, lat: number, lng: number, verificationMethod: 'gps' | 'qr' = 'gps') => {
  try {
    const response = await fetch(`${API_BASE_URL}/clock-in`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ venueId, userId, lat, lng, verificationMethod })
    });

    if (!response.ok) {
      const error = await response.json();
      const customError: any = new Error(error.error || 'Clock In failed');
      customError.status = response.status;
      throw customError;
    }

    return await response.json();
  } catch (e) {
    console.error('Clock In error:', e);
    throw e;
  }
};

/**
 * Perform an amenity-specific "Play" Clock In.
 */
export const performPlayClockIn = async (venueId: string, userId: string, amenityId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/play/clock-in`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ venueId, userId, amenityId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Play Clock In failed');
    }

    return await response.json();
  } catch (e) {
    console.error('Play Clock In error:', e);
    throw e;
  }
};


export const syncClockIns = async (userId: string, history: ClockInRecord[]) => {
  if (userId === 'guest') return;
  try {
    await setDoc(doc(db, 'users', userId), { clockInHistory: history }, { merge: true });
  } catch (e) {
    console.error('Error syncing Clock Ins:', e);
  }
};

export const setupAdmin = async (email: string, secretKey: string, password?: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/setup-super`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, secretKey, password })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Promotion failed');
    }
    return await response.json();
  } catch (e) {
    console.error('Admin setup error:', e);
    throw e;
  }
};
export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${uid}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Update failed');
    }
    return await response.json();
  } catch (e) {
    console.error('Update profile error:', e);
    throw e;
  }
};

/**
 * Fetch dynamic user rank based on season points.
 * Rank = (Count of users with more points) + 1
 */
export const fetchUserRank = async (points: number): Promise<number> => {
  try {
    const publicRef = collection(db, 'public_profiles');
    // We use the same stats field path as in syncUserProfile function
    const q = query(publicRef, where('league_stats.points', '>', points));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count + 1;
  } catch (e) {
    console.error('Error fetching rank:', e);
    return 0;
  }
};

/**
 * Fetch all users for Admin Dashboard.
 */
export const fetchAllUsers = async (): Promise<any[]> => {
  try {
    const publicRef = collection(db, 'public_profiles');
    // Order by points descending for leaderboard view
    const q = query(publicRef, orderBy('league_stats.points', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  } catch (e) {
    console.error('Error fetching all users:', e);
    return [];
  }
};

/**
 * Fetch System Stats for Admin Dashboard.
 */
export const fetchSystemStats = async () => {
  try {
    const publicRef = collection(db, 'public_profiles');
    const totalUsersSnap = await getCountFromServer(publicRef);
    const totalUsers = totalUsersSnap.data().count;

    return {
      totalUsers,
      activeUsers: 0,
      totalPoints: 0
    };
  } catch (e) {
    console.error('Error fetching system stats:', e);
    return { totalUsers: 0, activeUsers: 0, totalPoints: 0 };
  }
};

export const fetchRecentActivity = async (limit: number = 20) => {
  try {
    const response = await fetch(`${API_BASE_URL}/activity/recent?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch recent activity');
    return await response.json();
  } catch (e) {
    console.error('Error fetching recent activity:', e);
    return [];
  }
};

/**
 * Fetch hourly reporting for a partner venue.
 */
export const fetchPartnerHourlyReport = async (venueId: string, day?: number) => {
  try {
    const url = new URL(`${API_BASE_URL}/partners/reports/hourly`);
    url.searchParams.append('venueId', venueId);
    if (day) url.searchParams.append('day', day.toString());

    const response = await fetch(url.toString(), {
      headers: await getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch partner report');
    return await response.json();
  } catch (e) {
    console.error('Error fetching hourly report:', e);
    throw e;
  }
};

/**
 * Fetch point history (receipts) for the current user.
 */
export const fetchUserPointHistory = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me/history`, {
      headers: await getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch point history');
    return await response.json();
  } catch (e) {
    console.error('Error fetching point history:', e);
    return [];
  }
};

/**
 * Fetch all pending bounty submissions for Admin review.
 */
export const fetchPendingBounties = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/bounties/pending`, {
      headers: await getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch pending bounties');
    return await response.json();
  } catch (e) {
    console.error('Error fetching pending bounties:', e);
    return [];
  }
};

/**
 * Review a bounty submission (Approve/Reject).
 */
export const reviewBountySubmission = async (submissionId: string, status: 'APPROVED' | 'REJECTED') => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/bounties/${submissionId}/review`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Review failed');
    }
    return await response.json();
  } catch (e) {
    console.error('Bounty review error:', e);
    throw e;
  }
};

import { Venue } from "../types";
import { PULSE_CONFIG } from "../config/pulse";
import { getAuthHeaders, checkResponse } from "./apiUtils";
import { API_ENDPOINTS } from "../lib/api-config";

/**
 * Pulse System Integration (Doc 05 Rulebook)
 * The Frontend Service uses the Centralized Pulse Logic Config for consistency.
 */

/**
 * Fetches the list of venues from the backend.
 * Uses PULSE_CONFIG.WINDOWS.STALE_THRESHOLD for background refresh logic.
 */
export const fetchVenues = async (brief = false): Promise<Venue[]> => {
  try {
    const url = brief
      ? `${API_ENDPOINTS.VENUES.LIST}?brief=true`
      : API_ENDPOINTS.VENUES.LIST;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch venues: ${response.statusText}`);
    }
    const venues: Venue[] = await response.json();

    return venues;
  } catch (error) {
    console.error("Error in fetchVenues:", error);
    // Return empty array as fallback to prevent UI crash
    return [];
  }
};

/**
 * Fetch a single venue by ID (Full Data)
 */
export const fetchVenueById = async (id: string): Promise<Venue | null> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.VENUES.LIST}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch venue ${id}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in fetchVenueById:", error);
    return null;
  }
};

/**
 * Updates venue profile details (Listing management)
 * Strictly adheres to Allowed Fields whitelisted in server/src/venueService.ts
 */
export const updateVenueDetails = async (
  venueId: string,
  updates: Partial<Venue>,
  userId?: string,
): Promise<{ success: boolean; updates: any }> => {
  try {
    console.log(
      "[venueService] updateVenueDetails called. User ID:",
      userId?.substring(0, 5) + "...",
    );
    const response = await fetch(`${API_ENDPOINTS.VENUES.LIST}/${venueId}`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ updates, userId }),
    }).then(checkResponse);
    if (!response.ok) {
      throw new Error(`Failed to update venue: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in updateVenueDetails:", error);
    throw error;
  }
};

/**
 * Trigger a backend sync with Google Places API
 */
export const syncVenueWithGoogle = async (
  venueId: string,
  manualPlaceId?: string,
): Promise<{ success: boolean; message: string; updates: any }> => {
  try {
    const response = await fetch(API_ENDPOINTS.VENUES.SYNC(venueId), {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ googlePlaceId: manualPlaceId }),
    }).then(checkResponse);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to sync with Google");
    }
    return await response.json();
  } catch (error: any) {
    console.error("Error in syncVenueWithGoogle:", error);
    throw error;
  }
};

/**
 * Pulse Calculation Helpers (Shared Logic)
 * Ensures frontend display logic matches backend scoring weights.
 */
export const getPulsePoints = () => PULSE_CONFIG.POINTS;
export const getPulseThresholds = () => PULSE_CONFIG.THRESHOLDS;

/**
 * Fetch real-time Pulse score for a venue
 */
export const fetchVenuePulse = async (venueId: string): Promise<number> => {
  try {
    const response = await fetch(API_ENDPOINTS.VENUES.PULSE(venueId));
    if (!response.ok) {
      throw new Error(`Failed to fetch pulse: ${response.statusText}`);
    }
    const data = await response.json();
    return data.pulse;
  } catch (error) {
    console.error("Error in fetchVenuePulse:", error);
    return 0;
  }
};

/**
 * Check if a venue is already claimed by Google Place ID
 */
export const checkVenueClaim = async (
  googlePlaceId: string,
): Promise<{
  isClaimed: boolean;
  exists: boolean;
  venueId?: string;
  name?: string;
}> => {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.VENUES.CHECK_CLAIM}?googlePlaceId=${googlePlaceId}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to check claim status: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in checkVenueClaim:", error);
    return { isClaimed: false, exists: false };
  }
};

/**
 * Claim a venue and sync with Google
 */
export const onboardVenue = async (
  googlePlaceId: string,
): Promise<{ venueId: string; syncResult: any }> => {
  // Force token refresh for critical onboarding action
  const headers = await getAuthHeaders(true, true);
  try {
    const response = await fetch(API_ENDPOINTS.PARTNERS.ONBOARD, {
      method: "POST",
      headers,
      body: JSON.stringify({ googlePlaceId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || `Failed to onboard venue: ${response.statusText}`,
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Error in onboardVenue:", error);
    throw error;
  }
};

/**
 * Fetch all members of a venue
 */
export const fetchVenueMembers = async (venueId: string): Promise<any[]> => {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.VENUES.LIST}/${venueId}/members`,
      {
        headers: await getAuthHeaders(),
      },
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch members: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in fetchVenueMembers:", error);
    return [];
  }
};

/**
 * Add a new member to a venue
 */
export const addVenueMember = async (
  venueId: string,
  email: string,
  role: string,
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.VENUES.LIST}/${venueId}/members`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ email, role }),
      },
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to add member");
    }
    return await response.json();
  } catch (error) {
    console.error("Error in addVenueMember:", error);
    throw error;
  }
};

/**
 * Remove a member from a venue
 */
export const removeVenueMember = async (
  venueId: string,
  memberId: string,
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.VENUES.LIST}/${venueId}/members/${memberId}`,
      {
        method: "DELETE",
        headers: await getAuthHeaders(),
      },
    );
    if (!response.ok) {
      throw new Error(`Failed to remove member: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in removeVenueMember:", error);
    throw error;
  }
};
/**
 * Initiate a phone verification call
 */
export const initiatePhoneVerification = async (
  venueId: string,
  phoneNumber: string,
  venueName: string,
): Promise<{ success: boolean }> => {
  const headers = await getAuthHeaders();
  const response = await fetch(API_ENDPOINTS.PARTNERS.PHONE_CALL, {
    method: "POST",
    headers,
    body: JSON.stringify({ venueId, phoneNumber, venueName }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to initiate verification call");
  }
  return await response.json();
};

/**
 * Admin: Fetch all venues (including archived)
 */
export const fetchAdminVenues = async (): Promise<Venue[]> => {
  try {
    const response = await fetch(API_ENDPOINTS.VENUES.ADMIN_LIST, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch admin venues: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in fetchAdminVenues:", error);
    return [];
  }
};

/**
 * Admin: Delete a venue
 */
export const deleteVenue = async (
  venueId: string,
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(API_ENDPOINTS.VENUES.DELETE(venueId), {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to delete venue: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in deleteVenue:", error);
    throw error;
  }
};

/**
 * Verify the phone code entered by the user
 */
export const verifyPhoneCode = async (
  venueId: string,
  code: string,
): Promise<{ success: boolean }> => {
  const headers = await getAuthHeaders();
  const response = await fetch(API_ENDPOINTS.PARTNERS.PHONE_VERIFY, {
    method: "POST",
    headers,
    body: JSON.stringify({ venueId, code }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Verification failed");
  }
  return await response.json();
};

/**
 * Validate an Invite Token
 * Queries Firestore directly for the invite (Mock Mode)
 */
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
} from "firebase/firestore";
import { VenueInvite } from "../types/venue";

export const validateInvite = async (
  venueId: string,
  token: string,
): Promise<VenueInvite> => {
  try {
    const q = query(
      collection(db, "venues", venueId, "invites"),
      where("token", "==", token),
      where("status", "==", "pending"),
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      throw new Error("Invalid or expired invite.");
    }

    const inviteDoc = snapshot.docs[0];
    const data = inviteDoc.data() as VenueInvite;

    // Check expiration
    const now = new Date();
    const expiresAt = data.expiresAt.toDate();
    if (now > expiresAt) {
      throw new Error("This invite has expired.");
    }

    return { id: inviteDoc.id, ...data };
  } catch (error: any) {
    console.error("Error validating invite:", error);
    throw error;
  }
};

/**
 * Accept an Invite
 * Grants permissions to the user and updates the invite status
 */
export const acceptInvite = async (
  venueId: string,
  inviteId: string,
  userId: string,
  role: "manager" | "staff",
): Promise<void> => {
  try {
    // 1. Update Invite Status
    const inviteRef = doc(db, "venues", venueId, "invites", inviteId);
    await updateDoc(inviteRef, {
      status: "accepted",
      acceptedBy: userId,
      acceptedAt: new Date(),
    });

    // 2. Grant Permissions to User
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User profile not found. Please sign up first.");
    }

    const currentPermissions = userSnap.data().venuePermissions || {};

    await updateDoc(userRef, {
      venuePermissions: {
        ...currentPermissions,
        [venueId]: role,
      },
    });

    // 3. If Manager, add to Venue Manager List (Redundancy)
    if (role === "manager") {
      const venueRef = doc(db, "venues", venueId);
      await updateDoc(venueRef, {
        managerIds: arrayUnion(userId),
      });
    }
  } catch (error: any) {
    console.error("Error accepting invite:", error);
    throw error;
  }
};

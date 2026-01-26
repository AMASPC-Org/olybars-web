import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

/**
 * [SECURITY] Verifies if a UID has authorization for a specific VenueID.
 * Roles: owner, manager, super-admin.
 */
export const VenueAccessGuard = async (uid: string | undefined, venueId: string | undefined, userRole: string | undefined): Promise<boolean> => {
  if (!uid || !venueId) return false;

  // 1. Super-Admins have global bypass
  if (userRole === 'super-admin' || userRole === 'admin') return true;

  try {
    // 2. Check the venue document for the owner/manager list
    const venueDoc = await db.collection('venues').doc(venueId).get();
    if (!venueDoc.exists) return false;

    const data = venueDoc.data();
    const authorizedUids = data?.authorizedUids || [];

    if (authorizedUids.includes(uid)) return true;
    if (data?.ownerUid === uid) return true;

    return false;
  } catch (e) {
    console.error("VenueAccessGuard Error:", e);
    return false;
  }
};

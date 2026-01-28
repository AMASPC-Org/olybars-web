// OlyBars Core Auth Schema
// Defines permissions for Guests, League Admins, Owners, and Staff.

/**
 * Global System Roles
 * - 'guest': Standard app user (Player).
 * - 'admin': OlyBars League HQ (Super User).
 */
export type SystemRole = 'guest' | 'admin';

/**
 * Venue-Specific Roles
 * - 'owner': Full access to specific venue (Edit profile, manage staff, toggle Local Maker).
 * - 'staff': Operational access (Update Vibe, toggle specials).
 */
export type VenueRole = 'owner' | 'manager' | 'staff';

export type AdmissionStatus = 'approved' | 'pending' | 'rejected' | 'banned';

export interface UserAuthProfile {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string; // Artie avatar or user upload

    // Global Permissions (e.g., Ryan / CTO)
    systemRole: SystemRole;

    /**
     * Venue Permissions Map
     * Key: VenueID (e.g., 'brotherhood', 'well80')
     * Value: Role ('owner' | 'staff')
     * * Rationale: Allows a user to be an Owner at one bar 
     * and Staff at another (common in small towns).
     */
    venuePermissions: Record<string, VenueRole>;

    createdAt: string;
    lastLogin: string;
}

// Helper to check if a user has access to a specific venue (Staff or Owner)
export const hasVenueAccess = (user: { systemRole?: SystemRole; venuePermissions?: Record<string, VenueRole> } | null, venueId: string): boolean => {
    if (!user) return false;
    if (user.systemRole === 'admin') return true; // League HQ has master keys
    return !!user.venuePermissions?.[venueId];
};

// Helper to check if user allows sensitive operations (Owner only)
export const isVenueOwner = (user: { systemRole?: SystemRole; venuePermissions?: Record<string, VenueRole> } | null, venueId: string): boolean => {
    if (!user) return false;
    if (user.systemRole === 'admin') return true;
    return user.venuePermissions?.[venueId] === 'owner';
};

/**
 * Helper to check if user has management permissions (Owner or Manager)
 * Used to gate access to team management and settings.
 */
export const isVenueManager = (user: { systemRole?: SystemRole; venuePermissions?: Record<string, VenueRole> } | null, venueId: string): boolean => {
    if (!user) return false;
    if (user.systemRole === 'admin') return true;
    const role = user.venuePermissions?.[venueId];
    return role === 'owner' || role === 'manager';
};
// Helper to check if user is a system admin (League HQ)
export const isSystemAdmin = (user: { systemRole?: SystemRole; role?: string; email?: string } | null | undefined): boolean => {
    if (!user) return false;
    return user.systemRole === 'admin' ||
        user.role === 'admin' ||
        user.role === 'super-admin' ||
        user.email === 'ryan@amaspc.com';
};

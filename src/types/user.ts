import { SystemRole, VenueRole } from './auth_schema.js';

export type UserRole = 'guest' | 'user' | 'manager' | 'owner' | 'admin' | 'super-admin' | 'PLAYER';

export interface NotificationSettings {
    allow_league_intel: boolean;   // Master toggle for gameplay hints/events
    allow_pulse_alerts: boolean;   // Master toggle for "Packed" alerts
    vibe_alive_alerts: boolean;    // "Tell me when the Vibe is Alive"
    favorite_deal_alerts: boolean; // "Alert me when a Favorite drops a Deal"
    quiet_hours_start: string;     // Default "23:00"
    quiet_hours_end: string;       // Default "08:00"
}

export interface UserAlertPreferences {
    nightlyDigest: boolean;
    weeklyDigest: boolean;
    followedVenues: string[];
    interests: string[];
}

export type ClockInRecord = {
    venueId: string;
    timestamp: number;
}

export interface VibeCheckRecord {
    venueId: string;
    timestamp: number;
    status: string;
    points: number;
}

export type PointsReason = 'clockin' | 'photo' | 'share' | 'vibe' | 'redeem' | 'bonus' | 'play' | 'social_share';

export interface ActivityLog {
    id: string;
    userId: string;
    type: string;
    venueId?: string;
    points: number;
    timestamp: number;
    hasConsent?: boolean;
    metadata?: any;
    verificationMethod?: 'gps' | 'qr';
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ActivityLogItem {
    userId: string;
    type: PointsReason;
    venueId?: string;
    points: number;
    timestamp: number;
    metadata?: any;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface UserBadgeProgress {
    badgeId: string;
    progress: number;
    unlocked: boolean;
    unlockedAt?: number;
    completedVenueIds?: string[];
}

export interface UserVoucher {
    id: string;
    userId: string;
    itemId: string;
    venueId: string;
    status: 'active' | 'redeemed' | 'cancelled';
    purchaseDate: number;
    redeemedAt?: number;
    qrToken: string;
}

export interface UserProfile {
    uid: string;
    handle?: string;
    displayName?: string;
    email?: string;
    phone?: string;
    photoURL?: string;
    favoriteDrink?: string; // Legacy
    favoriteDrinks?: string[];
    homeBase?: string;
    role: UserRole;
    lastVibeChecks?: Record<string, number>;
    lastGlobalVibeCheck?: number;
    stats?: {
        seasonPoints: number;
        lifetimeClockins: number;
        currentStreak: number;
        vibeCheckCount: number;
        competitionPoints: number;
    };
    handleLastChanged?: number;
    playerGamePreferences?: string[];
    favorites?: string[];
    weeklyBuzz?: boolean;
    sms_opt_in?: boolean;
    notificationSettings?: NotificationSettings;
    last_notified_at?: Record<string, number>; // venueId -> timestamp
    showMemberSince?: boolean;
    createdAt?: number;
    updatedAt?: number;
    badges?: Record<string, UserBadgeProgress>; // Map of badgeId -> Progress

    // RBAC Fields
    systemRole?: SystemRole;
    venuePermissions?: Record<string, VenueRole>;

    // Maker's Trail
    makersTrailProgress?: number; // 0-5
    hasCompletedMakerSurvey?: boolean;
    vouchers?: UserVoucher[];
    lastDrinkBountyRedemption?: number; // Timestamp of last alcohol-related redemption

    // Onboarding
    pendingVenueName?: string;
}

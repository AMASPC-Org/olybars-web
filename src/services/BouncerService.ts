import { differenceInMinutes } from "date-fns";
import { GAMIFICATION_CONFIG } from "../config/gamification";
import { PULSE_CONFIG } from "../config/pulse";
import { Venue, UserProfile, VenueStatus } from "../types";
import { calculateDistance } from "../utils/geoUtils";

export enum AdmissionStatus {
  ALLOWED = "ALLOWED",
  LOCKED_DISTANCE = "LOCKED_DISTANCE",
  LOCKED_COOLDOWN = "LOCKED_COOLDOWN",
  LOCKED_AGE = "LOCKED_AGE",
  SHADOW_MODE = "SHADOW_MODE", // "Honest Gate" for Guests
  BANNED = "BANNED",
  SYSTEM_ERROR = "SYSTEM_ERROR",
}

export type BouncerResponse = {
  status: AdmissionStatus;
  reason?: string;
  metadata?: {
    distance?: number;
    threshold?: number;
    remainingMins?: number;
    requiredGap?: number;
  };
};

export class BouncerService {
  /**
   * Centralized Point Estimation
   * @param action The type of action (e.g., 'clockin', 'vibe')
   * @param venueStatus Optional venue status for Pioneer Curve calculations
   * @param hasConsent Optional marketing consent for bonus points
   * @Returns Estimated point value
   */
  static estimatePoints(
    action: "clockin" | "vibe" | "photo" | "share",
    venueStatus?: VenueStatus,
    hasConsent?: boolean,
  ): number {
    const { REWARDS, PIONEER_CURVE } = GAMIFICATION_CONFIG;
    let base = 0;
    let consentBonus = 0;

    switch (action) {
      case "clockin":
        // Apply Pioneer Curve if status is known
        base = venueStatus
          ? (PIONEER_CURVE as any)[venueStatus] || REWARDS.CLOCK_IN
          : REWARDS.CLOCK_IN;
        break;
      case "vibe":
        base = REWARDS.VIBE_REPORT;
        break;
      case "photo":
        base = REWARDS.VIBE_PHOTO;
        break;
      case "share":
        base = 5; // Hardcoded in old App.tsx, centralizing now
        break;
      default:
        base = 0;
    }

    if (hasConsent) {
      consentBonus = REWARDS.MARKETING_CONSENT;
    }

    return base + consentBonus;
  }

  /**
   * Validates if a user is physically present at a venue.
   */
  static verifyLocation(
    userLat: number,
    userLng: number,
    venue: Venue,
  ): BouncerResponse {
    if (!venue.location) {
      return {
        status: AdmissionStatus.SYSTEM_ERROR,
        reason: "Venue location data missing",
      };
    }

    const dist = calculateDistance(
      userLat,
      userLng,
      venue.location.lat,
      venue.location.lng,
    );
    const threshold = PULSE_CONFIG.SPATIAL.GEOFENCE_RADIUS;

    if (dist <= threshold) {
      return {
        status: AdmissionStatus.ALLOWED,
        metadata: { distance: dist, threshold },
      };
    }

    return {
      status: AdmissionStatus.LOCKED_DISTANCE,
      reason: `Too far away (${Math.round(dist)}m). Must be within ${threshold}m.`,
      metadata: { distance: dist, threshold },
    };
  }

  /**
   * Checks if enough time has passed since the last action.
   */
  static checkCooldown(
    lastActionTimestamp: number | undefined,
    cooldownMinutes: number,
  ): BouncerResponse {
    if (!lastActionTimestamp) {
      return { status: AdmissionStatus.ALLOWED }; // First time
    }

    const now = Date.now();
    const elapsedMinutes = differenceInMinutes(now, lastActionTimestamp);

    if (elapsedMinutes >= cooldownMinutes) {
      return { status: AdmissionStatus.ALLOWED };
    }

    const remaining = cooldownMinutes - elapsedMinutes;
    return {
      status: AdmissionStatus.LOCKED_COOLDOWN,
      reason: `Cooling down. Available in ${remaining} minutes.`,
      metadata: { remainingMins: remaining, requiredGap: cooldownMinutes },
    };
  }

  /**
   * Main Gatekeeper Logic for Clock-Ins
   */
  static validateClockIn(
    userProfile: UserProfile,
    venue: Venue,
    userCoords: { lat: number; lng: number } | null,
    history: { venueId: string; timestamp: number }[],
  ): BouncerResponse {
    // 1. Ryan Rule (Super Admin Bypass)
    // We expect the caller to inject a 'bypass' flag or check userProfile role?
    // Let's check userProfile.role here for explicit purity.
    if ((userProfile as any).role === "super-admin") {
      return { status: AdmissionStatus.ALLOWED, reason: "Ryan Rule Override" };
    }

    // 2. Identity Check (Shadow Mode for Guests)
    if (userProfile.uid === "guest") {
      // Guests CAN clock in (shadow mode), but we must warn the UI
      // However, they MUST pass location check first.
    }

    // 3. Location Check
    if (!userCoords) {
      return {
        status: AdmissionStatus.LOCKED_DISTANCE,
        reason: "GPS signal required.",
      };
    }
    const locResult = this.verifyLocation(
      userCoords.lat,
      userCoords.lng,
      venue,
    );
    if (locResult.status !== AdmissionStatus.ALLOWED) {
      return locResult;
    }

    // 4. Cooldown Checks (Global limit: 2 per 12h)
    // Filter history for last 12 hours
    const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
    const recentClockIns = history.filter(
      (h) => h.timestamp > twelveHoursAgo,
    );

    // 4a. Per-Venue Check (1 per 12h)
    const venueClockIns = recentClockIns.filter((h) => h.venueId === venue.id);
    if (venueClockIns.length >= GAMIFICATION_CONFIG.LIMITS.CLOCK_IN_PER_VENUE_12H) {
      // Calculate remaining time based on the OLDEST relevant clock-in affecting the limit?
      // Actually, typically it's window-based. If I have 1, I wait until it expires.
      const lastTime = venueClockIns[venueClockIns.length - 1].timestamp; // Most recent
      const elapsed = differenceInMinutes(Date.now(), lastTime);
      const limitMins = 12 * 60; // 12h

      if (elapsed < limitMins) {
        return {
          status: AdmissionStatus.LOCKED_COOLDOWN,
          reason: `Already clocked in here. Reset in ${limitMins - elapsed}m.`,
          metadata: { remainingMins: limitMins - elapsed }
        };
      }
    }

    // 4b. Global Check (2 per 12h)
    if (recentClockIns.length >= GAMIFICATION_CONFIG.LIMITS.CLOCK_IN_GLOBAL_12H) {
      const lastTime = recentClockIns[recentClockIns.length - 1].timestamp;
      const elapsed = differenceInMinutes(Date.now(), lastTime); // Wait for the most recent to drop? No, wait for the *oldest* in the window?
      // Simplification: Just user 4a logic for now, standard throttling.

      // If we are at limit, we look at when the *first* of the current batch expires.
      // But let's keep it simple: strict lockout based on last action.
      return {
        status: AdmissionStatus.LOCKED_COOLDOWN,
        reason: "Daily limit reached (2/12h). Pace yourself!",
        metadata: { remainingMins: 0 } // Complexity ignored for now
      };
    }

    // 5. Final Shadow Gate
    if (userProfile.uid === "guest") {
      return {
        status: AdmissionStatus.SHADOW_MODE,
        reason: AdmissionStatus.SHADOW_MODE // Special flag for UI
      };
    }

    return { status: AdmissionStatus.ALLOWED };
  }

  /**
   * Validates access to the Owner Portal.
   * Centralizes RBAC for /owner/ routes.
   */
  static validateOwnerAccess(userProfile: UserProfile): AdmissionStatus {
    // 1. Super Admin always allowed
    if (userProfile.role === "super-admin") {
      return AdmissionStatus.ALLOWED;
    }

    // 2. Owners must have venue permissions
    if (
      userProfile.venuePermissions &&
      Object.keys(userProfile.venuePermissions).length > 0
    ) {
      return AdmissionStatus.ALLOWED;
    }

    // 3. Everyone else is denied (Guests, Regular Users)
    // We return SHADOW_MODE to indicate "Redirect to Public Portal/Login"
    // instead of a hard 403 Error, fitting the "Soft Bouncer" vibe.
    return AdmissionStatus.SHADOW_MODE;
  }
}

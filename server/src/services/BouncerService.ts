import { db } from "../firebaseAdmin.js";
import { PULSE_CONFIG } from "../../../src/config/pulse.js";
import { GAMIFICATION_CONFIG } from "../../../src/config/gamification.js";
import { logger } from "../utils/logger.js";
import { Venue, Signal } from "../../../src/types.js";

export enum AdmissionStatus {
  ALLOWED = "ALLOWED",
  LOCKED_DISTANCE = "LOCKED_DISTANCE",
  LOCKED_COOLDOWN = "LOCKED_COOLDOWN",
  LOCKED_AGE = "LOCKED_AGE",
  SHADOW_MODE = "SHADOW_MODE", // Guests
  BANNED = "BANNED",
  SYSTEM_ERROR = "SYSTEM_ERROR",
}

export type BouncerResponse = {
  status: AdmissionStatus;
  reason?: string;
  points?: number;
  metadata?: any;
};

export class BouncerService {
  /**
   * Centralized Point Calculation (The Source of Truth)
   */
  static calculatePoints(
    action: "clock_in" | "vibe_report" | "photo" | "play",
    venueData: Venue,
    hasConsent: boolean = false
  ): number {
    const { REWARDS, PIONEER_CURVE } = GAMIFICATION_CONFIG;
    let base = 0;

    switch (action) {
      case "clock_in":
        base = (PIONEER_CURVE as any)[venueData.status || "trickle"] || REWARDS.CLOCK_IN;
        break;
      case "vibe_report":
        base = REWARDS.VIBE_REPORT;
        break;
      case "photo":
        base = REWARDS.VIBE_PHOTO;
        break;
      case "play":
        base = REWARDS.GAME_REPORT_FLAT_BONUS || 5;
        break;
      default:
        base = 0;
    }

    // Local Maker Multiplier (1.5x for clock-ins)
    if (action === "clock_in" && venueData.isLocalMaker) {
      base = Math.round(base * 1.5);
    }

    // Consent Bonus
    if (hasConsent && (action === "vibe_report" || action === "photo")) {
      base += REWARDS.MARKETING_CONSENT;
    }

    return base;
  }

  /**
   * Superman Rule: Anti-Flash-Speeding / Impossible Movement
   */
  static async checkSupermanRule(
    userId: string,
    currentVenueId: string,
    currentVenueLat: number,
    currentVenueLng: number,
    timestamp: number
  ): Promise<{ allowed: boolean; reason?: string; speedMph?: number }> {
    const recentSignals = await db
      .collection("signals")
      .where("userId", "==", userId)
      .where("type", "in", ["clock_in", "vibe_report"])
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    if (recentSignals.empty) return { allowed: true };

    const lastSignal = recentSignals.docs[0].data() as Signal;
    const timeDiffSec = (timestamp - lastSignal.timestamp) / 1000;

    if (lastSignal.venueId === currentVenueId) return { allowed: true };

    // Fetch previous venue location
    const lastVenueDoc = await db.collection("venues").doc(lastSignal.venueId).get();
    const lastVenueData = lastVenueDoc.data() as Venue;

    if (!lastVenueData?.location) return { allowed: true };

    const distMeters = this.calculateDistance(
      lastVenueData.location.lat,
      lastVenueData.location.lng,
      currentVenueLat,
      currentVenueLng
    );

    // Threshold: 100mph (approx 44.7 m/s)
    const speedMps = distMeters / timeDiffSec;
    const speedMph = speedMps * 2.237;

    if (speedMps > 44.7 && timeDiffSec > 60) {
      logger.warn(`[ANTI-CHEAT] Superman Rule Violation`, {
        userId,
        distMeters,
        timeDiffSec,
        speedMph: Math.round(speedMph),
        fromVenue: lastSignal.venueId,
        toVenue: currentVenueId,
      });
      return {
        allowed: false,
        reason: "Impossible Movement detected! Please engage responsibly.",
        speedMph: Math.round(speedMph)
      };
    }

    return { allowed: true };
  }

  /**
   * Camper Rule: Anti-Camping / Same-Venue Cooldown
   */
  static async checkCamperRule(
    userId: string,
    venueId: string,
    type: "clock_in" | "vibe_report",
    timestamp: number
  ): Promise<{ allowed: boolean; reason?: string; remainingMins?: number }> {
    const cooldownMs = type === "clock_in"
      ? PULSE_CONFIG.WINDOWS.SAME_VENUE_THROTTLE
      : GAMIFICATION_CONFIG.LIMITS.VIBE_COOLDOWN_VENUE_MINS * 60 * 1000;

    const recentSignals = await db
      .collection("signals")
      .where("userId", "==", userId)
      .where("venueId", "==", venueId)
      .where("type", "==", type)
      .where("timestamp", ">", timestamp - cooldownMs)
      .limit(1)
      .get();

    if (!recentSignals.empty) {
      const lastSignal = recentSignals.docs[0].data() as Signal;
      const elapsedMs = timestamp - lastSignal.timestamp;
      const remainingMins = Math.ceil((cooldownMs - elapsedMs) / (60 * 1000));

      return {
        allowed: false,
        reason: `Already submitted recently. Reset in ${remainingMins} minutes.`,
        remainingMins
      };
    }

    return { allowed: true };
  }

  /**
   * Nightly Cap Rule: LCB Compliance (2 per 12h)
   */
  static async checkNightlyCap(userId: string, timestamp: number): Promise<{ allowed: boolean; reason?: string }> {
    const today4AM = new Date();
    today4AM.setHours(4, 0, 0, 0);
    const businessDayStart = timestamp < today4AM.getTime()
      ? today4AM.getTime() - 24 * 60 * 60 * 1000
      : today4AM.getTime();

    const lcbWindowAgo = timestamp - PULSE_CONFIG.WINDOWS.LCB_WINDOW;
    const windowStart = Math.min(businessDayStart, lcbWindowAgo);

    const clockinsLastWindow = await db
      .collection("signals")
      .where("userId", "==", userId)
      .where("type", "==", "clock_in")
      .where("timestamp", ">", windowStart)
      .get();

    if (clockinsLastWindow.size >= 2) {
      return {
        allowed: false,
        reason: "Nightly Cap Reached: limit of 2 League clock-ins per window."
      };
    }

    return { allowed: true };
  }

  /**
   * Geofence Validation
   */
  static verifyLocation(
    userLat: number,
    userLng: number,
    venueData: Venue
  ): { allowed: boolean; reason?: string; distance?: number } {
    if (!venueData.location) return { allowed: true }; // Skip if no location set (dev)

    const distance = this.calculateDistance(
      userLat,
      userLng,
      venueData.location.lat,
      venueData.location.lng
    );

    if (distance > PULSE_CONFIG.SPATIAL.GEOFENCE_RADIUS) {
      return {
        allowed: false,
        reason: `Too far away! You are ${Math.round(distance)}m from ${venueData.name}.`,
        distance
      };
    }

    return { allowed: true, distance };
  }

  /**
   * Haversine distance
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

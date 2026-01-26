import { useState, useMemo } from 'react';
import { Venue, UserProfile, AdmissionStatus as UserAdmissionStatus } from '../types';
import { BouncerService, AdmissionStatus, BouncerResponse } from '../services/BouncerService';
import { useGeolocation } from './useGeolocation';

// Extend the Service Enum for UI specific states if needed
export { AdmissionStatus };

/**
 * The "Velvet Rope" Hook.
 * Connects the pure Bouncer Logic (Service) to the React Lifecycle (State/Context).
 */
export const useBouncer = (userProfile: UserProfile, venue?: Venue) => {
  const { coords, loading: geoLoading, requestLocation, refresh, permissionStatus } = useGeolocation();

  // Clock-In History State (Internal or Passed?)
  // Mirrors App.tsx localStorage logic for consistency
  const [clockInHistory] = useState<{ venueId: string; timestamp: number }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("oly_clockins") || "[]");
    } catch {
      return [];
    }
  });

  /**
   * Check if the user can clock in to the provided venue (or hook-level venue).
   */
  const validateClockIn = (targetVenue: Venue = venue!): BouncerResponse => {
    if (!targetVenue) return { status: AdmissionStatus.SYSTEM_ERROR, reason: "No venue specified" };

    // 1. Inject Geolocation
    const userCoords = coords ? { lat: coords.latitude, lng: coords.longitude } : null;

    return BouncerService.validateClockIn(
      userProfile,
      targetVenue,
      userCoords,
      clockInHistory
    );
  };

  /**
   * Estimates points for UI display.
   */
  const estimatePoints = (action: 'clockin' | 'vibe' | 'photo' | 'share'): number => {
    return BouncerService.estimatePoints(action, venue?.status);
  };

  /**
   * Resolves the "Admission Status" (User Role + Bouncer Logic).
   * Used for determining which "Gate" to show (e.g., Guest Wall vs Member Access).
   */
  const admissionStatus = useMemo(() => {
    if (!userProfile) return AdmissionStatus.SHADOW_MODE; // Default to guest
    if ((userProfile as any).role === 'super-admin') return AdmissionStatus.ALLOWED; // VIP
    if (userProfile.uid === 'guest') return AdmissionStatus.SHADOW_MODE;
    // Banned check could go here
    return AdmissionStatus.ALLOWED;
  }, [userProfile]);

  return {
    // State
    location: {
      coords,
      loading: geoLoading,
      permission: permissionStatus,
      requestLocation,
      refresh
    },
    admissionStatus,

    // Methods
    validateClockIn,
    estimatePoints,

    // Convenience (Auto-calc for the bound venue)
    canClockIn: venue ? validateClockIn(venue) : null
  };
};

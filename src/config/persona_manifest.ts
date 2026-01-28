/**
 * @file persona_manifest.ts
 * @description The Single Source of Truth for OlyBars Persona Capabilities.
 * This file acts as the constitutional definition for "Who can do What".
 * 
 * CORE RULES:
 * 1. BASE_ARTIE is the foundational subset.
 * 2. EXTENDED_SCHMIDT is the strict superset.
 * 3. NO capability exists outside this file.
 */

// Basic capabilities available to every Guest connection (Artie)
const BASE_ARTIE = [
  'chat',             // General conversation
  'search_venues',    // Find places
  'clock_in',         // Earn points
  'vibe_check',       // Report status
  'view_menu',        // Read-only menu access
  'view_events'       // Read-only event access
] as const;

// extended capabilities available ONLY to Venue Owners/Staff (Schmidt)
const OWNER_ONLY_OPS = [
  'venue_ops',        // Dashboard access
  'marketing_gen',    // AI social posts
  'analytics',        // View stats/pulse
  'update_venue',     // Edit listing
  'manage_events',    // CRUD events
  'staff_mode'        // Internal tools
] as const;

export const PERMISSIONS = {
  // Guest Persona
  BASE_ARTIE,

  // Owner Persona (Strict Superset)
  EXTENDED_SCHMIDT: [
    ...BASE_ARTIE,
    ...OWNER_ONLY_OPS
  ]
} as const;

// Type Definitions for use in Hooks/Backend
export type ArtieCapability = typeof PERMISSIONS.BASE_ARTIE[number];
export type SchmidtCapability = typeof PERMISSIONS.EXTENDED_SCHMIDT[number];
export type AnyCapability = SchmidtCapability;

export const isOwnerCapability = (cap: string): boolean => {
  return (OWNER_ONLY_OPS as readonly string[]).includes(cap);
};

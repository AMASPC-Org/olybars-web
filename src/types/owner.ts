import { Timestamp } from "firebase/firestore";

// --- TAB [1]: COMMAND CENTER ---

export type VenueNotificationType =
  | "PHOTO_APPROVAL"
  | "SYSTEM_ALERT"
  | "ACTION_LOG"
  | "SECURITY"
  | "EVENT_REVIEW"
  | "OPPORTUNITY"
  | "GUEST_EVENT_PENDING"
  | "HOLIDAY";

export type VenueNotificationStatus = "pending" | "resolved" | "dismissed";

export interface VenueNotification {
  id: string;
  type: VenueNotificationType;
  status: VenueNotificationStatus;
  priority: 1 | 2 | 3; // 1 = Critical (Red Pulse)
  title?: string; // Optional top-level title
  message?: string; // Optional top-level message
  payload: {
    photoUrl?: string; // For PHOTO_APPROVAL
    vibeReportId?: string; // Link to original report
    message?: string; // For SYSTEM_ALERT
    userId?: string; // Triggering user
    actionTaken?: string; // For ACTION_LOG
    eventData?: any; // For EVENT_REVIEW (Legacy/Scraped)
    title?: string; // Optional override
    [key: string]: any;
  };
  expiresAt: Timestamp; // Auto-cleanup after 7 days
  createdAt: Timestamp;
}

// --- TAB [2]: OPERATIONS (THE PULSE) ---

export type VibeStatus = "Trickle" | "Flowing" | "Gushing" | "Flooded"; // LOCKED: DO NOT EDIT

export interface VenueLiveStatus {
  vibeStatus: VibeStatus;
  vibeStatusExpiresAt: Timestamp; // Resets to 'Auto' after 45m
  manualHeadcountBuffer: number; // +/- override
  bufferExpiresAt: Timestamp; // Resets to 0 after 60m
  activeGameFeatures: {
    pool: boolean;
    darts: boolean;
    jukebox: boolean;
    karaoke: boolean;
  };
  lastUserPulse: Timestamp; // Last recorded system-synced headcount
  totalSynthesizedHeadcount: number;
}

// --- TAB [3]: MARKETING (GROWTH) ---

export type FlashBountyStatus = "scheduled" | "active" | "expired";

export interface VenueMarketingBounty {
  id: string;
  status: FlashBountyStatus;
  title: string;
  multiplier: number; // e.g., 2.0 (Double Points)
  startsAt: Timestamp;
  endsAt: Timestamp;
  audience: "all" | "new_members";
  redemptionsCount: number;
  budgetCap: number; // Max points to distribute
}

// --- TAB [4]: EVENTS ---

export interface VenueEvent {
  id: string;
  title: string;
  type: "recurring" | "one_time";
  recurrence?: "weekly" | "daily" | "monthly";
  dayOfWeek?: number; // 0-6
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isSpecial: boolean; // For "Featured" status
  schmidtPolish: boolean; // Has Schmidt AI reviewed this?
  tags: string[]; // ['Karaoke', 'Live Music']
}

// --- TAB [6]: THE MENU ---

export interface VenueMenuItem {
  id: string;
  section: "Draft" | "Cans" | "Cocktails" | "Food";
  name: string;
  description: string;
  price: number | string;
  abv?: number; // For beverages
  isAvailable: boolean; // The "86" toggle
  tags: ("Vegetarian" | "Gluten-Free" | "House Specialty")[];
  updatedAt: Timestamp;
}

// --- TAB [7]: PEOPLE ---

export interface VenueInvite {
  id: string;
  token: string; // Single-use security token
  email: string;
  role: "manager" | "staff";
  status: "pending" | "accepted" | "expired";
  expiresAt: Timestamp; // TTL of 48 hours
}

# The Brew House: Master Specifications

**The Brew House** is the operational Command Center for OlyBars venue partners. It is designed to be a "Zero-Trust" administrative environment that empowers owners and managers to control their digital footprint, engage the League, and monitor real-time venue "Pulse."

## 1. Core Philosophy: The Command Center

The dashboard follows a strict prioritization hierarchy from left-to-right, ensuring that items requiring immediate human intervention are always seen first.

| Position | Tab Name          | Operational Role | Mental Model                               |
| :------- | :---------------- | :--------------- | :----------------------------------------- |
| 1        | **Notifications** | Urgent Action    | "What needs my attention right now?"       |
| 2        | **Operations**    | The Pulse        | "How is my venue performing live?"         |
| 3        | **Marketing**     | Growth Engine    | "How do I get more people in the door?"    |
| 4        | **Events**        | Schedule Manager | "What is happening this week?"             |
| 13       | **The Vault**     | Treasury         | "Do I have enough points for Bounties?"    |
| 5-13     | (Auxiliary)       | Infrastructure   | Maintenance, People, and structural setup. |

---

## 2. Tab Definitions & Sections

### [1] Notifications (The Command Center)

- **Role:** Aggregates all items requiring venue approval or attention.
- **Key Sections:**
  - **Pending Photos:** User-submitted vibe checks requiring venue consent.
  - **Alerts:** Notifications from "Artie" (The Commish) regarding system status.
  - **Action History:** A log of recent administrative decisions.
  - **Guest Submissions:** Events submitted by guest/players awaiting venue approval.
  - **Community Pulse:** Notifications for Holidays, Days of Recognition, and local milestones.

#### Technical Implementation Notes:

- **Firestore Path:** `venues/{venueId}/notifications/{notificationId}`
- **Notification Schema:**
  ```typescript
  interface VenueNotification {
    id: string;
    type:
      | "PHOTO_APPROVAL"
      | "SYSTEM_ALERT"
      | "ACTION_LOG"
      | "SECURITY"
      | "GUEST_EVENT_PENDING"
      | "HOLIDAY";
    status: "pending" | "resolved" | "dismissed";
    priority: 1 | 2 | 3;
    payload: {
      photoUrl?: string;
      vibeReportId?: string;
      message?: string;
      userId?: string;
      actionTaken?: string;
      eventData?: any; // For GUEST_EVENT_PENDING
    };
    expiresAt: Timestamp;
    createdAt: Timestamp;
  }
  ```
- **Logic Constraints:**
  - **Atomic Approval:** Approving a photo/event must trigger a Cloud Function to copy to public feed.
  - **SuperAdmin Notify:** Every time a venue owner adds an event, a notification must be dispatched to the SuperAdmin (ryan@amaspc.com) for awareness.
  - **Real-time Listener:** This tab must use a live snapshot listener (`onSnapshot`).
- **UI Components:** `NotificationBell`, `ApprovalCard`, `IdentityBadge`.

### [2] Operations (The Pulse)

- **Role:** Real-time visibility and manual overrides for the Vibe Engine.
- **Key Sections:**
  - **Live Clock-ins:** Current headcount logic based on active user signals.
  - **Manual Headcount Adjust:** Physical +/- override (60m TTL).
  - **Vibe Status Terminal:** Manual override with 45m expiration.
    - **Levels:** Trickle, Flowing, Gushing, Flooded. [[LOCK: DO NOT EDIT]]
  - **Live Game Status:** Real-time toggles for pool tables, darts, etc.

#### Technical Implementation Notes:

- **Firestore Path:** `venues/{venueId}/status/live` (Singleton Document)
- **Live Status Schema:**
  ```typescript
  interface VenueLiveStatus {
    vibeStatus: "Trickle" | "Flowing" | "Gushing" | "Flooded"; // LOCKED
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
  ```
- **Logic Constraints:**
  - **Ephemeral Overrides:** The frontend must check `now() < expiresAt` before rendering. If expired, ignore the field values and revert to "System Auto" values.
  - **Update Frequency:** Throttled to 1 write per 5 seconds.
- **UI Components:** `VibeSelector`, `TallyCounter`, `GameFeatureToggle`.

### [3] Marketing (Growth Engine)

- **Role:** High-impact engagement tools and "Flash Bounties."
- **Key Sections:**
  - **Schmidt Pro Briefing:** AI-calculated insights (Density physics + local events). [[Note: Schmidt is the Coach for Partners]]
  - **Flash Bounty Scheduler:** Create time-limited point bonuses.
  - **Drops Analysis:** ROI metrics (New vs. Returning barflies).
  - **Approved Gallery:** Management of public-facing vibe photos.

#### Technical Implementation Notes:

- **Firestore Paths:**
  - Bounties: `venues/{venueId}/marketing/bounties/{bountyId}`
  - Analysis: `venues/{venueId}/marketing/stats/overview`
- **Flash Bounty Schema:**
  ```typescript
  interface VenueMarketingBounty {
    id: string;
    status: "scheduled" | "active" | "expired";
    title: string; // e.g., "Trivia Tuesday Booster"
    multiplier: number; // e.g., 2.0 (Double Points)
    startsAt: Timestamp;
    endsAt: Timestamp;
    audience: "all" | "new_members";
    redemptionsCount: number;
    budgetCap: number; // Max points to distribute
  }
  ```
- **Logic Constraints:**
  - **Gallery Sync:** Deleting a photo in this tab must call the global asset manager to set `isVisible: false` on the original content document.
  - **Schmidt Sync:** "Schmidt Pro Briefing" is a read-only Markdown component rendered from a dedicated `briefing` field updated daily by the Gemini Analytics service.
- **UI Components:** `BountyTimeline`, `ROIChart`, `PhotoGridEditor`.

### [4] Events (Schedule Manager)

- **Role:** Management of the venue's temporal footprint.
- **Key Sections:**
  - **Event Calendar:** UI for adding, editing, or deleting recurring events.
  - **One-off Highlights:** Special promotion of high-impact nights.

#### Technical Implementation Notes:

- **Firestore Path:** `venues/{venueId}/events/{eventId}`
- **Event Schema:**
  ```typescript
  interface VenueEvent {
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
  ```
- **Logic Constraints:**
  - **Schmidt Polish:** Every event creation form includes a "Schmidt Polish" button that calls the `/api/ai/polish-event` endpoint (Gemini 3 Flash) to optimize the copy for SEO and social engagement.
  - **Conflict Handling:** Prevent overlapping "Special" events in the same time block.
- **UI Components:** `CalendarStrip`, `SchmidtAIPrompt`, `RecurrenceSelector`.

### [5] Listing (The Digital Storefront)

- **Role:** Maintaining the "Google Listing" synchronization and core data.
- **Key Sections:**
  - **Operating Hours:** Standard and seasonal hours.
  - **Fulfillment Links:** Direct-to-reservation/ordering URLs.
  - **Venue Metadata:** Addresses, Phone Numbers, and Category tags.

#### Technical Implementation Notes:

- **Firestore Path:** `venues/{venueId}` (Core Venue Document)
- **Listing Schema:**
  ```typescript
  interface VenueListing {
    name: string;
    googlePlaceId: string;
    contact: {
      phone: string;
      website: string;
      instagram: string;
    };
    hours: Record<string, string>; // { "mon": "11:00-02:00" }
    fulfillment: {
      doordash?: string;
      opentable?: string;
      toast?: string;
    };
    isLocked: boolean; // If true, prevent Scraper from overwriting manual edits
  }
  ```
- **Logic Constraints:**
  - **Google Lock:** Manual edits to hours or metadata must automatically set `isLocked: true` to prevent the periodic background scraper from "Reverting" changes to the Google default.
  - **Geocoding:** Changing the address triggers a Cloud Function to re-sync coordinates for density physics calculations.
- **UI Components:** `HoursEditor`, `LinkManager`, `SyncStatusIndicator`.

### [6] THE MENU (Menu Management)

- **Role:** Digital menu management for user-facing discovery.
- **Key Sections:**
  - **Draft List:** Real-time beer/beverage updates.
  - **Food Offerings:** Specialty and signature dishes.

#### Technical Implementation Notes:

- **Firestore Path:** `venues/{venueId}/menu/items/{itemId}`
- **Menu Item Schema:**
  ```typescript
  interface VenueMenuItem {
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
  ```
- **Logic Constraints:**
  - **Availability Toggle:** The "86" toggle must be high-priority and visible in the list view. Toggling a draft to `isAvailable: false` must instantly remove it from the public-facing menu.
  - **Bulk Edit:** Support for category-wide "Out of Stock" if the tap system goes down.
- **UI Components:** `DraftListItem`, `InventoryToggle`, `PriceInput`.

### [7] People (Access Control)

- **Role:** User management within the venue's administrative scope.
- **Key Sections:**
  - **Manager Invites:** Granting Brew House access to trusted staff.
  - **Role Hierarchy:** Defining "Owner" vs "Manager" permissions.

#### Technical Implementation Notes:

- **Firestore Path:** `venues/{venueId}/invites/{inviteId}` (Pending) & `users/{uid}` (Active)
- **Invite Schema:**
  ```typescript
  interface VenueInvite {
    id: string;
    token: string; // Single-use security token
    email: string;
    role: "manager" | "staff";
    status: "pending" | "accepted" | "expired";
    expiresAt: Timestamp; // TTL of 48 hours
  }
  ```
- **Logic Constraints:**
  - **Ownership Lock:** There must always be exactly one `owner` role per venue. Owners can only be transferred, not deleted via this UI.
  - **Claim Sync:** Accepting an invite must trigger an update to the user's `venuePermissions` AND the venue's `managerIds` array for redundancy.
- **UI Components:** `InviteForm`, `PermissionList`, `StaffActionHistory`.

### [8] Reports (Data Insights)

- **Role:** Historical analysis of venue performance.
- **Key Sections:**
  - **Hourly Activity Heatmaps:** Visualization of peak engagement times.
  - **Member Growth:** Tracking new vs. returning "Barflies."

#### Technical Implementation Notes:

- **Firestore Path:** `venues/{venueId}/reports/daily_rollup/{YYYY-MM-DD}`
- **Daily Rollup Schema:**
  ```typescript
  interface DailyRollup {
    id: string; // YYYY-MM-DD
    totalEngagement: number; // Sum of points distributed
    uniqueVisitors: number;
    newMemberCount: number;
    hourlyDensity: number[]; // Array of 24 integers (0-23)
    topDrivers: string[]; // Top 3 tags (e.g., "Trivia", "Happy Hour")
  }
  ```
- **Logic Constraints:**
  - **Cold Storage:** Raw logs of vibe reports are moved to cold storage after 90 days. This Reports tab must query only the `daily_rollup` collection for high-performance rendering.
  - **Zero-Latency:** Data is updated via a nightly 3:00 AM Cloud Function (The "Clean Up" Job).
- **UI Components:** `HourlyHeatmap`, `TrendLineChart`, `StatSummaryBox`.

### [9] QR Assets (Physical Verification)

- **Role:** Distribution of physical on-premise verification tools.
- **Key Sections:**
  - **Vibe Check QR:** Downloadable and printable assets for bar placement.
  - **Placement Guide:** Best practices for physical QR deployment.

#### Technical Implementation Notes:

- **Core Link:** `https://olybars.com/check-in?v={venueId}`
- **QR Physics:**
  - **Error Correction:** Level M (15%) to account for bar smudges/lighting.
  - **Format:** High-res PNG & SVG for professional printing.
- **Logic Constraints:**
  - **Verification Lock:** These QRs use a rotating "Salt" in the URL if security is elevated. The Brew House must always provide the _latest_ valid QR.
  - **Download Tracking:** Log when an owner downloads assets to trigger a "Check on QR placement" alert in Artie after 48 hours.
- **UI Components:** `QRCodeDisplay`, `DownloadButtonGroup`, `PhysicalDeploymentGuide`.

### [10] THE MANUAL (Knowledge Base)

- **Role:** Interactive Onboarding and "Coach" Capability Guide.
- **Key Sections:**
  - **Coach vs Manual:** Comparative cards showing how to perform tasks via AI Voice vs Manual UI.
  - **Skill Matrix:** A searchable list of all capabilities Artie/Coach possesses.
  - **League Standards:** A mandatory "Acknowledgement" screen for the 98501 Code of Conduct.

#### Technical Implementation Notes:

- **Content Source:** React components with mapped "Coach" prompts vs "Manual" instructions.
- **Logic Constraints:**
  - **Version Control:** Owners must "Acknowledge" the latest version of the "League Standards" before unlocking "Flash Bounties" (Tab [3]).
  - **Skill Discovery:** The "View Skills List" modal renders the `ARTIE_SKILLS` config.
- **UI Components:** `CoachVsManualCard`, `SkillMatrixModal`, `AcknowledgementBanner`.

### [11] Back Room (Space Rental)

- **Role:** Management of private inventory and rentable spaces.
- **Key Sections:**
  - **Space Inventory:** CRUD for "The Barrel Room", "VIP Booths", etc.
  - **Booking Requests:** Toggle accepting inquiries for specific spaces.
  - **Vibe Integration:** Associating specific vibes with specific rooms.

#### Technical Implementation Notes:

- **Firestore Path:** `venues/{venueId}/spaces/{spaceId}`
- **Space Schema:**
  ```typescript
  interface VenuePrivateSpace {
    id: string;
    name: string; // e.g. "The Barrel Room"
    capacity: number;
    description: string;
    photos: string[]; // URL array
    isAvailable: boolean;
    bookingLink?: string; // External link (Tock/Resy)
    features: { name: string; count: number }[]; // [{ name: "Projector", count: 1 }]
  }
  ```
- **Logic Constraints:**
  - **Capacity Rollup:** These capacities do NOT automatically add to the main venue capacity unless explicitly configured.
- **UI Components:** `SpaceCard`, `AmenityTag`, `AvailabilityToggle`.

### [13] The Vault (Treasury & Points)

- **Role:** Financial command center for the Point Reservoir.
- **Key Sections:**
  - **Point Bank Settings:** Managing the point reservoir.
  - **Transaction Log:** History of Bounty payouts and Refills.
  - **Compliance:** "PIT-Rule" acceptance status.

#### Technical Implementation Notes:

- **Firestore Path:** `venues/{venueId}/treasury/config` (Highest Security Gating)
- **Treasury Schema:**
  ```typescript
  interface VenueTreasuryConfig {
    pointBank: {
      currentReservoir: number;
      refillRate: number; // Points per week
      isAutoRefill: boolean;
      lastRefillAt: Timestamp;
    };
    compliance: {
      pitRuleAccepted: boolean;
      lastSafetyAudit: Timestamp;
    };
    gating: {
      autoPauseThreshold: number; // Default 100
    };
  }
  ```
- **Logic Constraints:**
  - **Hard Gate:** If `pointBank.currentReservoir < 100`, all "Flash Bounties" (Tab [3]) are automatically paused to prevent "Negative Point" state.
  - **Role Enforcement:** This tab's API routes must enforce `owner` role exclusively (Managers cannot see/edit).
- **UI Components:** `PointReservoirGauge`, `AuditHistoryLog`, `RefillSettings`.

### [12] Scrapers (The Automation Layer)

- **Role:** External data synchronization.
- **Key Sections:**
  - **Auto-Sync Logs:** Status of automated social media or website ingestion.
  - **Manual Trigger:** Force a sync of external listing data.

#### Technical Implementation Notes:

- **Firestore Path:** `venues/{venueId}/automation/status`
- **Automation Schema:**
  ```typescript
  interface ScraperStatus {
    lastSyncAt: Timestamp;
    syncStatus: "idle" | "running" | "error";
    activeSources: ("google" | "instagram" | "website")[];
    errorLog?: string;
    nextScheduledSync: Timestamp;
  }
  ```
- **Logic Constraints:**
  - **Trigger Rate-Limit:** The "Manual Trigger" is rate-limited to once per 24 hours per venue to prevent excessive GCP compute/proxy costs.
  - **Sync Conflict:** As defined in Tab [5], scrapers MUST check the `isLocked` flag on the venue document before overwriting metadata.
- **UI Components:** `SyncConsole`, `SourceToggleGrid`, `LogViewer`.

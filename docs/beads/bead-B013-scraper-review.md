# Bead B013: Scraper Review & Approval Flow

> "Trust, but verify. Then polish."

## 1. Context & Objectives
The **Scraper V2** expansion successfully ingests events from Google and Social Media. However, without a review layer, we risk polluting the "Holy Trinity" data with hallucinations or bad formatting.

This Bead introduces the **"Air Traffic Control"** layer for incoming events. It transforms the Scraper from a "Black Box" into a "Co-Pilot" where the Venue Owner remains the final authority.

### Key Goals
1.  **Stripe-Level UX:** A premium, "Inbox Zero" style queue for reviewing events. Smooth animations, bulk actions, and clear empty states.
2.  **Data Integrity:** Fix the "Zombie Pending" bug where re-scrapes overwrite manual approvals.
3.  **Conflict Intelligence:** Proactively warn users if an incoming event clashes with an existing confirmed event.
4.  **Code Hygiene:** Refactor `EventCreateModal` into a shared `EventForm` to prevent component bloat (DRY Principle apply).

## 2. Technical Scope

### A. Backend (`server/src/services`)
- **Fix `ScraperService.saveEvent`:**
    - **Logic:** `IF (doc exists) THEN (Update details but KEEP status) ELSE (Create with status = PENDING)`.
    - **Exception:** If `forceReset` flag is present (for debugging), allow status overwrite.

### B. Frontend (`src/features/owner/components`)
- **Shared Component `EventForm.tsx`:** Extract logic from `EventCreateModal`.
- **New Component `IncomingEventsQueue.tsx`:**
    - **Visuals:** Card-based list with yellow "Pending" badges.
    - **Grouping:** Scraped (Google) vs. Drafts (Social).
    - **Interactions:** Hover reveals "Confirm / Reject".
    - **Quality Indicators:** Warning icon for missing fields (time/description) or low confidence (<0.7).
    - **Quick Polish:** "Sparkles" button on card to auto-generate description without opening modal.
    - **Animation:** `framer-motion` for exit animations (optional, or standard CSS transitions).
- **New Component `EventEditModal.tsx`:**
    - Consumes `EventForm`.
    - Reads from `LeagueEvent` (Pending).
    - Writes to `EventService.updateEvent`.

## 3. Implementation Steps (The Checklist)

### Phase 1: Foundation & Hygiene
- [x] **1.1 Refactor EventForm:** Extract `EventForm.tsx` from `EventCreateModal.tsx`.
    - *Dependency:* existing `EventCreateModal`.
    - *Verification:* Create a new event using the refactored modal.
- [x] **1.2 Create EventEditModal:** Build the wrapper using `EventForm`.
    - *Goal:* Allow editing of existing events (needed for the "Edit" action in the queue).

### Phase 2: Logic Integrity
- [x] **2.1 Fix ScraperService Overwrite:** Modify `saveEvent` to respect existing statuses.
    - *Test:* Manually inject a 'PENDING' event, approve it, then trigger `saveEvent` again using the same ID logic. Confirm it stays 'APPROVED'.

### Phase 3: The "Inbox Zero" UI
- [x] **3.1 Build IncomingEventsQueue:**
    - *Fetch:* Query `league_events` where `status == 'PENDING'`.
    - *Render:* Group by `source`.
    - *Conflict Check:* For each pending event, check if `startTime` overlaps an `APPROVED` event.
    - *Quality Check:* Highlight items with missing `time` or `description`.
- [x] **3.2 Implement Actions:**
    - *Approve:* `EventService.updateEvent(id, { status: 'APPROVED' })`.
    - *Reject:* `EventService.updateEvent(id, { status: 'REJECTED' })`.
    - *Polish:* One-click `EventService.generateDescription` integration.
    - *Bulk:* Add checkbox selection logic.
- [x] **3.3 Integrate into ScraperTab:**
    - Place below "Active Sources".
    - Add "Pending (N)" badge to tab header.

## 4. Considerations & Future Self Notes
- **Ghosting:** Rejected events are kept as `REJECTED` docs to prevent the scraper from re-importing them the next day. This is a "Soft Delete".
- **Source of Truth:** If a user edits a scraped event, the `originalDescription` field is our breadcrumb back to the raw data. Never delete it.
- **Performance:** Conflict checking is currently client-side (`O(n^2)` potential if lists are huge, but likely `O(n)` effectively per venue). Monitor this if queues grow >100 items.

## 5. Artifacts
- `src/features/owner/components/scraper/IncomingEventsQueue.tsx`
- `src/features/owner/components/EventForm.tsx`
- `src/features/owner/components/EventEditModal.tsx`

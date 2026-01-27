# Bead: B011 - Scraper Control Surface (UI Polish)

> **Status**: Open
> **Priority**: Medium
> **Type**: Frontend / UX
> **Dependencies**: B008, B010
> **Estimated Effort**: Medium

## Context
The "Scraper Management" tab in the Brew House dashboard is where venue owners interact with the automation system. Currently, the "Add Source" modal lacks the priority order requested by the user and doesn't clearly show how "Rules" (Instructions) are used to train the AI. To create a "Premium" feels, we must polish this interaction surface.

## Reasoning & Justification
- **Drunk Thumb Mandate:** Large touch targets and clear labels are essential for venue owners who are often multi-tasking on the floor.
- **Immediate Feedback:** By refining the UI, we clarify the relationship between "URL" -> "Target" -> "Rules." This reduces user confusion and support tickets.
- **Trust Building:** Showing a clear "Next Run" and "Last Scraper Result" (Status) builds trust in the automation.

## Goals
1.  **Tab Reordering:** Prioritize the targets as: **Menu, Drinks, Calendar, Website**.
2.  **Instructional Clarity:** Update placeholders in the `extractionNotes` field to match the selected target. Clear examples are essential for training the user to train the AI.
3.  **Visual Hierarchy:** Improve the "Source Card" to clearly show the status and target type.
4.  **Simulated Execution (Preview):** Create a "Scout Preview" button hook that allowsowners to trigger a sample extraction to test their rules immediately.

## Implementation Details

### 1. AddSourceModal Refresh
- [ ] Update `AddSourceModal.tsx`:
    - Reorder the type buttons.
    - Add dynamic `placeholder` text for the instruction field:
        - MENU: "e.g., Only extract the daily burger special."
        - DRINKS: "e.g., Exclude wine and focus on local drafts."
        - CALENDAR: "e.g., Only look for recurring weekly events."
        - WEBSITE: "e.g., Look for updated patio hours."
    - Add a "Test Extraction" button (UI only for now, hook to `server/src/api/scraper/preview`).

### 2. Management Tab Polish
- [ ] Update `ScraperManagementTab.tsx`:
    - Add icons for the new target types (e.g., Beer mug for DRINKS, Calendar icon for CALENDAR).
    - Ensure the "Status" pill reflects errors accurately (e.g., robot.txt block vs extraction failure).

### 3. Verification
- [ ] Verify that adding a source with instructions correctly saves to Firestore.
- [ ] Verify that the buttons meet the 44px touch target mandate.

## Acceptance Criteria
- [ ] Modal displays targets in the correct 4-tab priority.
- [ ] Instructions are persisted and visible in the card view.
- [ ] UI looks premium and handles "Pending" states gracefully.

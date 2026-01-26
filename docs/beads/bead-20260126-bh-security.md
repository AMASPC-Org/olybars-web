# Bead: Vibe Management - Zero-Trust Treasury Security

**ID:** `bead-20260126-bh-security`
**Status:** Open
**Type:** Security
**Priority:** High
**Owner:** Unclaimed

---

## 1. Objective
Enforce strict Role-Based Access Control (RBAC) to ensure only `owner` and `system_admin` users can access the "Treasury" (The Vault) and private B2B data (Margins, Point Bank).

## 2. Background & Reasoning (For Future Self)
The "System Architecture Master" dictates **Least Privilege**. A night-shift manager needs to control the "Pulse" (Operations) to manage the floor, but they do not need to manage the "Treasury" (marketing budgets, refill rates, bank balance).

### The "Security by Obscurity" Fallacy
Hiding the "Vault" button in the UI is insufficient. A savvy manager could inspect the network request, find the `venueId`, and manually `curl` the endpoint. We must gate this at the **Data Access Layer**.

## 3. Tasks & Implementation

### 3.1 Backend API Gating
- [ ] **VenueOpsService.ts**: Modify `getPrivateData` to include a strict Role Check before returning.
    *   *Constraint*: If `userProfile.role !== 'owner'`, return `403 Forbidden`.
- [ ] **Firestore Rules**: Verify `venues/{id}/private_data/main` is not readable by `manager` role in `firestore.rules`.

### 3.2 Frontend "Vault" Isolation
- [ ] **OwnerDashboardScreen.tsx**: Implement a filter on the `navItems` array.
    *   *Logic*: `navItems = navItems.filter(item => item.id !== 'treasury' || user.role === 'owner')`.
- [ ] **Redirect Strategy**: If a user attempts to access `/dashboard/treasury` via URL manipulation or deep link:
    *   Check Role.
    *   If `!owner` $\rightarrow$ `history.replace('/dashboard/pulse')` + Toast: "Restricted: Owner Access Only".
- [ ] **Action Guard**: Ensure `VenueOpsService.updatePrivateData` fails gracefully (User Toast) if called by a non-owner.

## 4. Considerations
*   **Feedback Loop**: Do not show a greyed-out button. Remove it entirely to reduce "UI Value Novelty" (distraction).
*   **Testing**: Must be verified using `npm run audit-auth` to simulate a `manager` token attempting a `curl` on the private endpoint.

## 5. Dependencies
*   `bead-20260126-vibe-integrity` (Correct Role Definitions)

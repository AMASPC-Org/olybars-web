# Bead: Implement Staff Join Flow

**ID:** bead-20260124-bh-join-flow
**Status:** Completed
**Tactic:** Feature Build

## Objective

Build the "Redemption" page for the invite links sent by Owners.

## Context

Owners generate links like `olybars.com/admin/join?token=...`.
We need to:

1. Fix the link generator to include `venueId` (optimization to avoid collection group queries).
2. Build the Landing Page that verifies the token.
3. Implement specific "Accept" logic that grants permissions.

## Execution Plan

1. **Refinement**: Update `InviteStaffModal.tsx` to generate links with `?t={token}&v={venueId}`.
2. **Routing**: Add path `/admin/join` to `src/routes.tsx` or `src/App.tsx`.
3. **UI**: Create `src/features/admin/screens/JoinTeamScreen.tsx`.
   - Loading state (Validating token...).
   - Card: "You have been invited to join **[Venue Name]** as **[Role]**."
   - Action: "Accept Invite".
4. **Logic (`venueService.ts`)**:
   - `validateInvite(venueId, token)`: Query Firestore for the invite. Check expiration.
   - `acceptInvite(venueId, inviteId)`:
     - Update `invites/{id}` status to 'accepted'.
     - Update `users/{uid}` with `venuePermissions: { [venueId]: role }`.
     - (If manager) Update `venues/{venueId}` -> `managerIds` list.
5. **Redirect**:
   - On success, redirect to `/admin`.

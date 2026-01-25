**ID:** bead-20260124-bh-security-invites
**Status:** Completed
**Tactic:** Security Hardening

## Objective

Enforce strict access control on the new `invites` subcollection.

## Context

Currently, we rely on UI hiding. We need backend enforcement.

## Execution Plan

1. **Firestore Rules**: Update `firestore.rules`.
   - Path: `/venues/{venueId}/invites/{inviteId}`.
   - **Create/Delete**: Only `request.auth.uid` who is an Owner of `venueId`.
   - **List**: Only `request.auth.uid` who is an Owner.
   - **Read (Single)**: Allow anyone to read a single invite if they know the ID? No, we index by Token.
   - _Refinement_: For the Join screen, since we query by Token + VenueID, we might need `allow list: if true` (DANGEROUS).
   - _Better Approach_: The Join Screen logic should ideally be a Cloud Function. Since we are in "Mock" mode, we might need a temporary relaxed rule or a specific query index.
   - _Decision_: For this bead, strictly lock down `create/delete`. For `read`, we might need to allow it for now until the Cloud Function replaces the client-side claim logic.

---
status: done
agent: B8Z1
type: bug
priority: high
created: 2026-01-26
---

# Bead: Auth Lifecycle Race Condition

## Context
Users report "instant re-authentication" after logout or "Access Denied" loops. This is fundamentally a race condition between the client-side Firebase session teardown and the browser's page reload.

## Reasoning & Goal
We must enforce a **Strict Sequential Lifecycle** for session destruction.
1.  `await auth.signOut()` - Ensure the server-side session is invalidated.
2.  Clear `UserProfile` state - Ensure the React state is pristine.
3.  `window.location.href = "/"` - Force a hard reload only AFTER the above are confirmed.

This ensures that upon reload, the `onAuthStateChanged` hook sees a null user and doesn't attempt to hydrate from stale local storage.

## Acceptance Criteria
- [ ] **Atomic Logout**: Update `handleLogout` to:
    1.  `await auth.signOut()`
    2.  `setUserProfile({ uid: "guest", role: "guest" })`
    3.  `localStorage.clear()` (or specific keys)
    4.  `await new Promise(resolve => setTimeout(resolve, 500))` - Tiny delay to let Firebase listener settle.
    5.  `window.location.href = "/"`
- [ ] **Profile Hydration Guard**: In `App.tsx`'s `useEffect` for auth, ensure that if `firebaseUser` is null, NO profile is fetched from Firestore and `localStorage` is cleared immediately.
- [ ] **Verification:** Log in as `ryan@amaspc.com`, log out, and verify "The Brew House" is immediately locked and doesn't re-open on reload.

## Dependencies
- None

## Resources
- File: `src/App.tsx`
- Service: `Firebase Auth`

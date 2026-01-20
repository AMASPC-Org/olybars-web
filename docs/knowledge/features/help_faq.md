# The Bar League Playbook

Welcome to the **Bar League Playbook**—Artie's Guide to the PNW Nightlife OS. This guide is built to help you navigate the League and the city of Olympia.

## Feature Manifest

| Feature | Intent | Required State | Action |
| :--- | :--- | :--- | :--- |
| **League HQ** | Your central playbook for standings, prizes, and official rules. | `League Member` status. | Join the League, Check Ranks, Read Rules. |
| **The Wire (Events)** | A chronologically ordered feed of citywide happenings. | Active GPS (Optional) | Add Events, Join Guestlists, Share to Friends. |
| **Vibe Map** | Real-time visual tracking of where the night is "Buzzing". | `VITE_GOOGLE_MAPS_API_KEY` | Get Directions, See Crowds, Find Hidden Spots. |
| **League ID (Profile)** | Manage your digital handle and drink preferences. | Logged In | Update Handle, Toggle Weekly Buzz, Set Home Base. |
| **Artie (AI Assistant)** | Your concierge for local recommendations and trivia. | API Connection | Chat with Artie, Get Drink Recs, Learn Bar History. |

---

## Frequently Asked Questions

### 1. How do I join the League?
Head to the **LEAGUE HQ** tab and look for the "Join the League" CTA. You'll need to create a Handle and set your drink preferences.

### 2. Why can't I check in?
Clock-ins are limited to **2 per 12-hour window** per WA State LCB alignment. Clock-ins also require you to be within 100 meters of the venue (measured via GPS).

### 3. What is "Buzzing"?
When a venue receives multiple Vibe Checks or Clock-ins within a short period, it turns **Gold** on the map, indicating it is currently high-energy.

### 4. How do I change my Handle?
You can update your Handle once every **30 days** in your Profile settings. This ensures League integrity and leaderboard consistency.

### 5. Is my data secure?
OlyBars uses Firebase Auth and Firestore for secure identity management. We only log actions required for points calculation and league standings.

### 6. Where do I find Live Music?
Check the **LIVE** tab (Navigation Bar) for a dedicated gig guide and submission portal for local bands.

---

> [!TIP]
> **Pro Tip:** Enable "Weekly Buzz" in your profile to get a Sunday morning digest of upcoming trivia and game nights.

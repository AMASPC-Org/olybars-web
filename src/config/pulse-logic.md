# OlyBars Pulse Logic (Buzz Algorithm)

> **Source of Truth**: `src/config/pulse.ts` (Code)
> **Goal**: Quantify the "Vibe" of a venue in real-time.

## Core Concepts

The "Pulse" is composed of two distinct metrics that are calculated every time a user interacts with the system (or every 10 minutes in the background).

### 1. The Buzz Score (Heat)
**Formula**: `Sum(Signal * Decay)`

*   **Signals**:
    *   **Clock In**: 10.0 Points (Hard confirmation of presence)
    *   **Vibe Check**: 3.0 Points (Soft qualitative input)
    *   **Marketing Consent (Visual)**: 10.0 Points (Visual proof)
    *   **Verified Bonus**: +15.0 Points (e.g. QR Verify)

*   **Decay (The "Fade")**:
    *   Every **60 minutes**, a signal's value drops by **50%**.
    *   Example: A clock-in is worth 10pts now. In 1 hour, it is worth 5pts. In 2 hours, 2.5pts. In 12 hours, ~0pts.

### 2. Live Headcount (Presence)
**Formula**: `Unique User IDs in Last 90 Minutes`

*   This is a rolling window count.
*   It ignores the "Score" and simply counts specific people.
*   After **90 minutes**, a user is assumed to have left (unless they check in again), and they drop off the count.

## Status Interpretations

The Total Buzz Score determines the color/status shown on the UI:

| Status | Color | Threshold | Meaning |
| :--- | :--- | :--- | :--- |
| **FLOODED** | Red/Danger | **> 85% Saturation** | Maximum depth. Wall to wall. |
| **GUSHING** | Orange/Fire | **> 50% Saturation** | High pressure. Active energy. |
| **FLOWING** | Blue/Water | **> 15% Saturation** | Steady stream. Good vibes. |
| **TRICKLE** | Slate/Grey | **< 15% Saturation** | Quiet & intimate. Easy access. |

## Updating the Logic

To change these values (e.g. make the window 120 mins), edit `src/config/pulse.ts`. The backend and frontend logic will automatically adapt.

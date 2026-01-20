# The Toast: OlyBars Vibe Manual

This document serves as the Technical & Operational Source of Truth for the OlyBars Vibe System.

## 1. The Pioneer Curve (Scoring Philosophy)
The "Pioneer Curve" is an inverted scoring model designed to reward users for distributing themselves across the city, boosting activity in "Mellow" venues and preventing overcrowding.

### Point Allocation (The Bounty)
| Vibe Status | Payout (PTS) | Descriptor |
| :--- | :--- | :--- |
| **Mellow** | 100 PTS | "The best seat is open. Claim it." |
| **Chill** | 50 PTS | "Good flow. Easy conversation." |
| **Buzzing** | 25 PTS | "Energy is high. Grab a round." |
| **Packed** | 10 PTS | "Elbow to elbow. Good luck." |

> [!IMPORTANT]
> Geofence verification (GPS) is MANDATORY for Mellow/Chill payouts to prevent spoofing of high-value bounties.

## 2. Visual Nomenclature (Mug Count)
We use "Mug Counts" to visually communicate capacity and energy levels at a glance.

| Status | Mug Count | Threshold | CSS / Tone |
| :--- | :--- | :--- | :--- |
| **Mellow** | 🍺 (1 Mug) | < 15% Cap | Emerald-400 / Cool |
| **Chill** | 🍻 (2 Mugs) | 15-50% Cap | Amber-400 / Social |
| **Buzzing** | 🍻🍺 (3 Mugs) | 51-90% Cap | Orange-500 / Energy |
| **Packed** | 🍻🍻 (4 Mugs) | > 90% Cap | Red-600 / Peak |

## 3. Legacy Migration (Zombie Data Adapter)
The status `DEAD` is officially deprecated.

- **Frontend**: Components must map `DEAD` -> `MELLOW` for visual display.
- **Backend**: Middleware automatically converts any incoming `DEAD` payload to `MELLOW` before database writes.

## 4. The Brew House (Operator Input)
The Brew House UI uses a 4-card segmented control.
- **Selection**: Large touch targets for rapid, high-frequency updates.
- **Feedback**: "Glass fill" animation correlates selection to physical reality.

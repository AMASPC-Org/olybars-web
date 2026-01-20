# OlyBars.com: The Nightlife Operating System
## Master Business Plan & Source of Truth
**Version:** 3.3 (Scenes & Map Precision)
**Status:** Production Live  
**Date:** 2026-01-08

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Core Personas](#2-product-vision--core-personas)
3. [Business Strategy: Automated Compliance](#3-business-strategy-automated-compliance)
4. [Financial Moat: Zero-Cost Infrastructure](#4-financial-moat-zero-cost-infrastructure)
5. [Security & Trust Architecture](#5-security--trust-architecture)
6. [Brand & Growth Operations](#6-brand--growth-operations)
7. [Technical Advantage: The AI-Native Cloud](#7-technical-advantage-the-ai-native-cloud)
8. [Master Roadmap](#8-master-roadmap)
9. [Appendix A: The League Glossary](#9-appendix-a-the-league-glossary)
10. [Appendix B: Annual Membership Tiers](#10-appendix-b-annual-membership-tiers)
11. [Appendix C: Official Rulebook](#11-appendix-c-official-rulebook)
12. [Appendix D: The OlyBars Taxonomy](#12-appendix-d-the-olybars-taxonomy)
13. [Appendix E: Artie Venue Action Matrix](#13-appendix-e-artie-venue-action-matrix)
14. [Appendix F: OlyBars Sales Playbook](#14-appendix-f-olybars-sales-playbook)
15. [Appendix G: WSLCB Sales Compliance](#15-appendix-g-wslcb-sales-compliance)
16. [Appendix H: Prohibited Terminology](#16-appendix-h-prohibited-terminology)
17. [Appendix I: The Navigation Hierarchy](#17-appendix-i-the-navigation-hierarchy)
18. [Appendix J: Partner Feature Matrix](file:///c:/Users/USER1/olybars/docs/specs/Partner_Feature_Matrix.md)

---

## 1. Executive Summary
OlyBars.com is the **Nightlife Operating System for Downtown Olympia (98501)**. We are a dual-sided marketplace designed to revitalize the post-COVID hospitality economy through gamification and automation.

*   **For the Public (Players & Visitors)**: We provide **Answers**. We answer "What is there to do right now?", "Where is everybody at?", and "What is the vibe?" without requiring users to scroll through stale social media feeds. We turn nightlife into a sport where participation earns status.
*   **For Partners (Venues)**: We sell **Ease**. We eliminate "Marketing Burn" by providing an automated engine that allows them to "Submit Once, Distribute Everywhere," while using gamified incentives (Bounties) to drive traffic and margin without discounting alcohol.

**The Brand Promise**: OlyBars is the digital layer over the physical world. It is not a directory; it is a live view of the city’s pulse, anchored by Artie, the AI "Spirit of the Artesian Well."

---

## 2. Product Vision & Core Personas

### 2.1 The Mission
To differentiate between "being at a bar" and "playing a game." OlyBars creates a digital layer over the physical world that encourages social discovery without inducing irresponsible consumption.

### 2.2 The Audience Matrix
OlyBars operates on a permission-gated hierarchy to ensure data integrity and compliance.

| Persona | Type | Motivation | Product Needs |
| :--- | :--- | :--- | :--- |
| **The Visitor** | Casual / Incognito | "What's happening right now?" | Universal Search. Instant access to Map/List. Can attempt actions (Clock In/Vibe), which trigger the "Honest Gate" conversion modal. |
| **The Guest** | Local / Contributor | Utility & Alerts. | Local State Storage. Can "Favorite" venues (stored locally). Can submit "Shadow Signals" (held until signup). Targeted by "Points Missed" notifications. |
| **The Player** | Local / Regular | Status, Competition, Prizes, Social Connection. | Login Required. Points accumulation, League Standings, Badges, "The Sync". |
| **The Partner** | Venue Owner | Filling slow nights, selling high-margin food, saving time. | The Brew House. "One-Click" marketing, Point Bank management. |
| **Super-Admin** | System Architect | Global Oversight | Admin Dashboard. System health, global overrides. |

> [!NOTE]
> **Super-Admin Access**: `ryan@amaspc.com` maintains master oversight. Use the `/api/admin/setup-super` endpoint with the `MASTER_SETUP_KEY` for manual elevation.

### 2.3 The AI Dual-Core: Artie & Schmidt
The OlyBars platform is powered by two distinct AI agents, separating "Play" from "Work."

#### A. Artie (The Guest Agent)
*   **Persona**: "The Spirit of the Artesian Well." Fun, mysterious, and deeply connected to the city's history.
*   **Role**: **Guest Experience & Discovery**. Artie answers "Where should we go?" and "What is the vibe?"
*   **Capabilities**:
    *   **Vibe Discovery**: Real-time recommendations based on user mood.
    *   **League Concierge**: Explains rules, points, and badges to players.
    *   **Visitor Mode**: A simplified guide for unauthenticated users.
    *   **Guardian Mode**: Detects over-consumption language and pivots to food/water suggestions.
*   **Constraint**: Artie is **Read-Only** regarding business logic. Artie cannot change hours, schedule events, or see profit margins.

#### B. Schmidt (The Owner Agent)
*   **Persona**: "The Operator." Efficient, analytical, helpful, and precise.
*   **Ref**: Named after Olympia's mild-mannered brewmaster history.
*   **Role**: **Venue Operations & Logic**. Schmidt handles the "boring" stuff so owners don't have to.
*   **Capabilities**:
    *   **Schmidup Interface**: The dedicated chat/dashboard for owners.
    *   **Event Scheduling**: Handles the "Add Event" skill and calendar management.
    *   **Marketing Co-Pilot**: Drafts copy, emails, and generates image prompts.
    *   **Listing Management**: `update_hours`, `emergency_closure`, `update_menu`.
    *   **Business Logic**: Suggests Flash Bounties based on inventory and time.

---

### 2.4 Product Surfaces
#### A. OlyBars.com (The Client)
*   **Buzz Clock**: The real-time happy hour scheduler (Upcoming, Current, Soon-to-End).
*   **Vibe Signal**: Real-time energy status (Dead, Chill, Buzzing, Packed).
*   **Star Alerts**: Users "Star" a venue to subscribe to "Packed" pulse alerts (Double-opt-in).
*   **League Passport**: Geolocation Clock Ins as attendance signals.
*   **Artie Chat**: Conversational AI for local discovery and "The Manual" (FAQ).

#### B. The Brew House (The Dashboard)
*   **Venue Profile (SSOT)**: Single source of truth for hours, menus, and local maker rules.
*   **Marketing Center**: Artie-generated social copy and **Flash Bounty** activations.

---

## 3. Business Strategy: The AMA Network Logic

OlyBars.com is the lighthouse site of **The AMA Network** (American Marketing Alliance SPC). As a **Social Purpose Corporation**, our mission is to solve the "Marketing Burn"—the phenomenon where local businesses waste thousands on ineffective ads simply because they lack the time to manage complex marketing funnels.

### 3.1 Submit Once, Distribute Everywhere (The Artie Marketing Suite)
When a Partner updates an event or needs content in The Brew House:
*   **Instant Update**: OlyBars.com Calendar & Buzz Clock.
*   **Newsletter & Email**: Auto-inclusion in "**The Weekly Pulse**" and custom email drafting for subscribers.
*   **External Sync**: Artie formats and emails details to: **ODA**, **Experience Olympia (VCB)**, and **Thurston Talk**.
*   **Multimodal Content Engine**: Artie identifies flyers, generates captions, and drafts image prompts for cross-platform publishing.
*   **Social Distribution**: Real-time sync of Instagram and Facebook feeds for one-tap owner approval.

### 3.2 Automated Compliance (Legal Moat)
Legal compliance is our primary competitive advantage. By enforcing "Law-as-Code," we eliminate human error.
*   **The Smart Gatekeeper**: Players are capped at **2 Clock Ins per 12 hours** globally (**Rule of Two**).
*   **The Bounty Standard**: The system hard-codes WA LCB rules. A venue cannot accidentally create an illegal "2-for-1" because we only allow **Flash Bounties** (Points).
*   **The Honest Gate (Conversion Logic)**: We do not block unauthenticated users from clicking "Clock In" or "Vibe Check." Instead, we allow the interaction to proceed on the frontend, then use the backend authentication requirement to trigger a "Signal Ready" modal. This leverages the Endowment Effect—the user feels they have already "done the work" and must sign up to "save" their contribution.

### 3.3 Fairness Algorithms (Exposure Equity)

To maintain a healthy, competitive ecosystem and prevent "The Drowning Effect" (where large or high-volume venues dominate visibility), OlyBars enforces algorithmic fairness through **Exposure Equity** within the **Buzz Clock** and **Pulse List**.

*   **Global 5-Minute Rotation**: The system applies a time-based "sliding window" to key visibility areas. Every 5 minutes, the internal priority logic for the **Buzz Clock** and the **Pulse List** shifts globally. This ensures that every active partner rotates through top-tier visibility multiple times per hour.
*   **The "Anti-Drowning" Logic**: Within the **Pulse List**, partners are prioritized at the top, but their internal order is shuffled every 5 minutes based on the system rotation. This prevents the same few venues from permanently occupying the top fold of the screen.
*   **Partner Fallback Visibility**: When user filters (e.g., searching for "Trivia") return no results, OlyBars does not show a blank screen. Instead, the **Pulse List** provides a rotating selection of partner venues, giving league members high-intent exposure even when they don't exactly match the current specific search.
*   **Bounty Anti-Spam**: **Flash Bounties** and Happy Hour items are sorted by *urgency* and *relevance*. The rotation ensures all partners get high-intent exposure.

---

## 4. Technology & Infrastructure Strategy
We have engineered a "Zero-Weight" architecture that maximizes performance while minimizing fixed costs. This creates a sustainable specific financial moat that competitors using traditional software cannot match.

> **Note for Tech Teams**: Full engineering specifications are available in [System_Architecture_Master.md](specs/System_Architecture_Master.md).

### 4.1 The "Cloud-Native" Advantage
Instead of renting expensive dedicated servers that sit idle during the day, OlyBars is built on **Serverless Technology (Google Cloud Platform)**.
*   **Scale-to-Zero**: When no one is using the app (e.g., 4 AM on a Tuesday), our infrastructure costs drop to near $0.
*   **Infinite Scale**: When the "Buzz" hits (e.g., Friday night at 10 PM), the system automatically expands to handle thousands of users instantly.

### 4.2 Financial Moat: The $0.00 Operating Model
By leveraging "Free Tier" enterprise quotas, we achieve a cost structure that allows us to be profitable with just a handful of partner venues.
*   **Identity & Security**: SMS/Phone Auth secured for **Free (up to 10k users)**.
*   **Real-Time Engagement**: Push technology for thousands of users at **Zero Cost**.

### 4.3 Signal Integrity (Real-World Accuracy)
Since not everyone has location services enabled, OlyBars cross-references three critical data points (The "Holy Trinity" of Signals) to determine the "Current State":
1.  **Clock Ins**: High-intent attendance verification (The "Gold Standard").
2.  **Vibe Checks**: Manual "Ground Truth" reports from users on the floor.
3.  **Venue Capacity**: The denominator for density. Knowing a venue holds 50 people allows 15 verified Clock Ins to correctly register as "Buzzing" (30%), whereas the same 15 people in a 300-person hall would remain "Chill" (5%).

---

## 5. Security & Trust Architecture
We treat partner strategy and user privacy as sacred. Our "Fort Knox" approach is critical for B2B sales.

### 5.1 The "Venue Confidentiality" Promise (B2B)
We treat partner strategy and user privacy as sacred. Our "Fort Knox" approach is critical for B2B sales.

*   **Zero-Trust Data Segregation**: Sensitive data (e.g., margins, internal tokens, point banks) is physically removed from the public `venues` documents. It is stored in a private sub-collection (`venues/{id}/private_data/main`) that is inaccessible to the public API and protected by strict Firestore rules.
*   **MFA-Enforced Management**: Access to **The Brew House** (Owner Dashboard) is strictly gated. Venue Owners *must* perform a Multi-Factor Authentication (SMS/Phone) verify before the dashboard unlocks.
*   **Encrypted Secrets**: All partner API keys and external integration tokens are stored in **Google Secret Manager**, never in the database or source code.
*   **RBAC Firewall**: Role-Based Access Control is enforced at both the API layer (server-side) and Database layer (Firestore Rules). Owners only ever see *their* specific venue data.

### 5.2 The Compliance Shield (B2C)
*   **Transparent Geofencing**: GPS is used *only* for "Proof of Presence" verification.
*   **Cookie Minimalization**: Only essential state (Login, Age Gate).
*   **In-App Policy Hub**: Accessible `/security`, `/cookies`, `/privacy`.

### 5.3 Operational Resilience
*   **Secrets Management**: All API keys in Google Secret Manager.
*   **Audit Trails**: Immutable logs for all **Flash Bounties** and **Vibe Checks** to resolve disputes.

---

## 6. Brand & Growth Operations

### 6.1 SEO & Discoverability
*   **Metadata Strategy**: "Know before you go." Titles include `Olympia, WA` and `98501`.
*   **Local Maker's Trail**: Highlight venues supporting regional brewers and roasters.
*   **Maker-Funded Bonuses**: Completion bonuses for Maker Trails are funded by the **Maker** (Brewery/Cidery/Distillery) as a direct marketing cost to drive volume at their partner venues.

### 6.2 Prize Governance
We reward with **League Bucks** (Generic Gift Cards), not alcohol.
*   **Legal**: Gift cards are financial instruments, not "free booze."
*   **Brand**: Protects partners from LCB advertising violations. Points are never traded for alcohol.

### 6.3 The Time-State Strategy
**Context**: Users have two distinct modes: Impulse (Where do I go now?) and Planning (Where do we go Friday?).
**Execution**: The UI supports both via the Date Context Control. "Today" prioritizes live "Buzz" signals. Future dates prioritize "Event" data. The Business Plan acknowledges that "Buzz" is irrelevant for future dates, shifting the value proposition to "Calendar Accuracy."

---


## 7. Technical Advantage: The AI-Native Cloud

OlyBars.com is not a traditional web app. It is a **Google Cloud AI-Native** platform, leveraging "Antigravity" architecture to run at near-zero cost while scaling infinitely.

### 7.1 The Stack (Google Cloud Platform)
We bypass traditional server management ("DevOps") by using fully managed, serverless infrastructure.
*   **Compute**: **Google Cloud Run** (Containers that scale to zero when unused).
*   **Database**: **Firebase Firestore** (NoSQL, real-time syncing, offline-capable).
*   **Edge Logic**: **Cloud Functions** (Event-driven triggers for "Vibe Checks" and notifications).
*   **AI Engine**: **Gemini 1.5 Flash** (via Vertex AI) powers "Artie" for RAG-based local knowledge.

### 7.2 Why This Matters for the Business
*   **Reliability**: Google's own global infrastructure handles our uptime. We don't wake up at 3 AM to restart servers.
*   **Speed**: "Edge Caching" ensures the site loads instantly, even in crowded bars with poor signal.
*   **Security**: We inherit Google's banking-grade security model (IAM, Secret Manager, Firewall).

### 7.3 Artie: The Intelligence Layer (V1.2 Status)
Artie is the "Spirit of the Artesian Well," serving as the LLM-powered engine for RAG (Retrieval Augmented Generation) across the platform.

#### Current Skills (Live)
*   **⚡ Flash Bounty Architect**: Automates bounty creation with strict 180-minute lead-time enforcement and WSLCB compliance checks.
*   **📅 Event Secretary**: Converts simple prompts or links into structured calendar events with AI-generated descriptions.
*   **🛡️ Compliance Guardian**: Automatically pivots non-compliant marketing language (e.g., "Flash Deal" -> "Flash Bounty").
*   **🔍 Local RAG**: Real-time awareness of Olympia venues, maker culture, and the Artesian Bar League rulebook.
*   **🌍 World Awareness (MCP)**: Now equipped with real-time **Weather** (for patio vs. indoor recommendations) and **Google Places** (for granular location details and opening hours).
*   **📱 Marketing Co-Pilot**: Multi-channel drafting (Social, Email, Web) and Image Generation Prompts. [NEW]
*   **🔗 Meta Social Engine**: Bi-directional sync for Instagram/Facebook posts and events.

#### Skill Architecture
Artie operates using a **"Skills & Protocols"** framework. Every action (skill) is governed by a protocol that requires specific data validation (params) before an `[ACTION]` tag is produced for the frontend to execute.

---

## 8. The Conversion Strategy: Double Dip & Tiered Access
 
OlyBars uses a "Low Friction, High Value" funnel to maximize both user adoption and partner ROI.
 
### 8.1 Tiered Access (Funnel)
1.  **Phase 1: Anonymous Discovery**: Pass Age Gate -> Discovery Dashboard. No login, no tutorial. Zero friction.
2.  **Phase 2: Contextual Engagement**: Attempt Clock In -> Contextual Location Permission Prompt.
3.  **Phase 3: Progressive Profiling**: Successful Clock In -> Shadow Points Earned. "Join the League to save points" CTA.
 
### 8.2 The "Double Dip" (Partner ROI)
While OlyBars builds a global community, we proactively drive users into the **Partner's own ecosystems**.
*   **Loyalty Handoff (Flow A)**: After a successful OlyBars Clock In, users with a `loyalty_signup_url` are prompted to "Stack your points" by joining the venue's external rewards program (Toast, Square, etc.).
*   **The Margin Nudge (Flow B)**: For venues without digital loyalty, Artie presents an "Insider Tip" (Hero Item) after Clock In, nudging users toward high-margin menu items or signature drinks.

---

## 9. Master Roadmap

### 9.1 Status: **PRODUCTION LIVE** 🚀
*   **Domain**: [olybars.com](https://olybars.com)
*   **Stack**: See [System_Architecture_Master.md](specs/System_Architecture_Master.md)

### 8.2 Completed Milestones
*   ✅ **Core Engine**: Standardized `venues`, `signals`, and `users`.
*   ✅ **The Brew House**: Integrated owner dashboard.
*   ✅ **Geofencing**: Backend-verified Clock Ins.
*   ✅ **Artie Intelligence**: Level 1 RAG (Persona responses).
*   ✅ **Security Framework**: MFA, RBAC, and Policy Docs.
*   ✅ **Meta Integration**: Dual-track venue sync & Facebook auth.

### 8.3 Imminent Objectives (Artie V2.0 Roadmap)
1.  **Phase 6: The League Season 1**: Finalize points-to-prizes logic.
2.  **Phase 7: Artie Pro (The Partner Co-pilot)**: 
    *   ✅ **Holistic Listing Management**: "Artie, update my hours for tonight" or "Add a website link."
    *   ✅ **Menu Intelligence**: High-margin ideation and automated "Margin Play" suggestions.
    *   ✅ **Marketing Suite**: Automated drafting for Email, Social, and Web.
    *   **Voice/Audio Pipeline**: Direct voice-to-action interface for busy bartenders/owners.
3.  **Phase 8: Mobile Native**: Progressive Web App (PWA) "Add to Home Screen" optimization.

---

## 9. Appendix A: The League Glossary

### 9.1 User Taxonomy
*   **User**: Any human interacting with OlyBars.com.
*   **Visitor**: A User who is browsing anonymously (not logged in). Fast load times, accurate status, and the "Unified Pulse" view are prioritized.
*   **Guest**: A User who has authenticated (logged in) but has not yet joined the League.
*   **League Player**: A registered patron (User) who has officially joined the League. Players earn points, track progress, and unlock digital trophies (Badges). (Formerly referred to as Member).
*   **Venue Owner**: The human operator authorized to manage a venue's profile. This is the person who performs the login action to access The Brew House.
*   **Schmidt**: The Venue Operations Agent. Efficient, helpful, and precise. Handles "Add Event," analytics, and venue management.
*   **Schmidup**: The operational dashboard/interface where the Venue Owner interacts with Schmidt to manage their business.
*   **Super-Admin**: The platform lighthouse (typically `ryan@amaspc.com`). Has global authorization to manage any venue, override system settings, and enforce fair play standard across the entire AMA Network.
*   **Listed Venue**: A physical location (bar/pub) that appears on the OlyBars map but has not yet claimed their profile or joined the League as a Partner.
*   **League Partner**: A venue that has claimed their profile and entered into a marketing agreement with the League. Includes all active tiers: Free, DIY, Pro, and Agency.

### 9.2 Economy & Rankings
*   **Player Points**: The points earned by a League Player for real-world interactions (Clock Ins, Vibe Checks). Stored securely in the Player's profile (`users/{uid}/stats/seasonPoints`).
*   **Venue Point Bank**: The dedicated pool of points owned by a League Partner. Venues "spend" these points to attract traffic by offering multipliers or bounties. Stored in the venue's private sub-collection (`venues/{id}/private_data/main/pointBank`) to ensure operational confidentiality.
*   **League Standings**: The city-wide leaderboard showing the current rankings of all League Players based on their Season Points. Computed as a real-time query of the `users` collection.
*   **Time Bounty**: A temporary increase in points awarded for visiting a specific venue, typically used to drive traffic during slow periods. Bounties are deducted from the Venue Point Bank.
*   **Standings Tie-Breaker**: In the event of a point tie, the system ranks players based on: 1. Total Lifetime Clock Ins, 2. Current Streak, 3. Alphabetical Handle.

### 9.3 Key Concepts
*   **Artie**: The Guest Experience Agent. The "Spirit of the Artesian Well." Fun, mysterious, and in-the-know. Strictly read-only/concierge for public users. Does NOT handle business operations.
*   **Current State**: The real-time energy level of a venue (Dead, Chill, Buzzing, Packed).
    *   **Dead**: < 20% Capacity. Quiet, quick service.
    *   **Chill**: 20-60% Capacity. Conversational, date vibes.
    *   **Buzzing**: 60-90% Capacity. Tables full, high energy.
    *   **Packed**: > 90% Capacity. Standing room only. [Triggers SMS to Starred Users].
*   **The Back Room**: A dedicated directory of private spaces, nooks, and rental rooms within OlyBars venues. Used for booking private parties or finding quiet corners. "Get a room."
*   **The Weekly Pulse**: The official Artesian Bar League newsletter.
*   **The Brew House**: The Partner Portal. The dashboard where Venue Owners manage their profile, listings, events, and **Flash Bounty** activations.
*   **Venue Capacity**: A static data point representing the legal or practical occupancy of a venue. This serves as the baseline for determining density and busyness levels.
*   **Vibe Check**: A manual "Ground Truth" report submitted by a user. Essential for accurate data when GPS density is low.
*   **The 60-Second Handover**: The streamlined onboarding process for a Venue Owner to claim a Listed Venue and convert it into a League Partner.
*   **Partner Status**: The active subscription tier of a League Partner: Free (Claimed), DIY Toolkit, Pro League, or Agency Legend.
*   **Local Maker**: Regional producers (Brewers, Roasters) celebrated on the "Local Maker's Trail."
*   **The AMA Network**: Powered by the American Marketing Alliance SPC. A network of event-based sites designed to automate marketing for local businesses.
*   **The Manual**: The official name for the OlyBars app/website ("The Artesian Bar League Manual").

---

## 10. Appendix B: Annual Membership Tiers

| Tier Name | Monthly Cost | Point Bank | Flash Bounties | Key Feature |
| :--- | :--- | :--- | :--- | :--- |
| Tier 1: The Local | $0 | 250 Pts/mo | 1 per Month | Basic Listing, Buzz Clock. |
| **Tier 2: DIY Toolkit** | $99 | 1,500 Pts/mo | 4 per Month | **Press Agent** (Automated Email Dispatch). |
| **Tier 3: Pro League** | $399 | 10,000 Pts/mo | 12 per Month | IG/FB Read/Write Distribution. |
| **Tier 4: Agency Legend** | $799 | UNLIMITED | UNLIMITED | Full Management & Keystone PR. |

---

## 11. Appendix C: Official Rulebook

### 1. Scoring Mechanics
* **Clock In**: 10 Points. Requires location verification + Photo Evidence. (Max 2 per 12h).
* **Vibe Check**: 5 Points. Confirm energy levels (Dead-Packed). (Max 3 per night).
* **Game Vibe Check**: +2 Points. Verify specific amenity status (e.g., "Table 1 is Open").
* **Menu Bounty**: 20-50 Points. Requires photo of specific high-margin item (e.g., Wagyu Burger).
* **Time Bounty**: Multiplier or bonus for specific time windows (e.g., "2x Points on Tuesdays").

### 2. Velocity & Safety (LCB Compliance)
* **Nightly Cap:** You may clock into a maximum of **2 venues** per 12-hour window.
* **Cool-down:** The system prevents rapid-fire point accumulation.
* *Why?* To encourage enjoying the venue, not just sprinting for points. We build for vibes, not over-consumption.

### 3. Disqualification
* Any use of GPS spoofers, emulators, or account sharing results in a Season Ban.
* Harassment of venue staff or other players results in a permanent platform ban.
* Excessive false reporting will result in a point reset.

---

## 12. Appendix D: The OlyBars Taxonomy

### 1. PLAY (Interactive)
*Definition*: Items physically present 24/7 or during open hours.
* **Skill / Barcade (Hardcoded Popularity Order)**: Pool, Pinball, Darts, Arcade, Shuffleboard, Cornhole, Skee-Ball, Board Games, Ping Pong, Foosball, Giant Jenga, Ring Toss.

### 2. FEATURES (The Setup)
*Definition*: Permanent hardware or architectural elements that define the space.
* **Vibe Hardware**: Dance Floor, Stage, DJ Booth, Jukebox, Piano.
* **Comfort**: Patio / Beer Garden, Fireplace, Photo Booth, TV Walls.

### 3.V2 The Intelligence of Scenes (Taxonomy Pillars)
To ensure system integrity, Artie enforces a strict classification between permanent "Scenes" (Dive, Speakeasy) and "Activities" (Clock Ins).

> [!NOTE]
> **Map Purification**: OlyBars employs a "Nuclear Option" map style—a dark canvas that hides all default Google POIs (museums, transit, schools) and non-bar businesses. This ensures the map is a dedicated discovery layer exclusively for the OlyBars network.

> [!TIP]
> **Pin Precision**: Location accuracy is maintained through the **Pin Calibration Tool** in the Admin Dashboard, allowing manual "Doorstep Precision" to override standard geocoding.

| Pillar | Definition | Points | Display |
| :--- | :--- | :--- | :--- |
| **Scene** | Permanent venue identity (Dive, Sports). | N/A | Filter Chip |
| **League Event** | Point-awarding activity (Trivia, Music). | +25 Bonus Pts | Global Calendar |
| **Non-League Event** | Activity that does not award points. | 0 Base Pts | Global Calendar |
| **Happy Hour** | Time-bound window for multi-item deals. | 0 Base Pts | Venue Card |
| **Venue Special** | Recurring theme/item deal (Taco Tuesday). | 0 - 10 Base Pts | Venue Card |
| **Flash Bounty** | Urgent, one-off high-impact offer. | 2x / Bonus Pts | Buzz Clock Focus |

> [!IMPORTANT]
> **Happy Hour vs Special**: Artie distinguishes between *Windows* (price changes across many items) and *Themes* (specific focused deals).

---

## 13. Appendix E: Artie Venue Action Matrix

### 13.1 Executive Summary
This document maps the operational needs of Venue Owners to specific **Artie Capabilities**. It defines the "Intents" Artie must recognize and the "System Actions" (Backend Functions) executed in response. It also establishes the **Vibe Decay Logic**, ensuring real-time data remains accurate without constant manual updates.

### 13.2 Core Listing Management (The "Profile")
*Goal: Remove friction from keeping static data current.*

| Owner Intention ("Hey Artie...") | System Action | Data Impact |
| :--- | :--- | :--- |
| "Update my hours for Saturday." | `updateVenueSchedule(day, hours)` | Updates Firestore `venues/{id}` |
| "Update my website link." | `updateVenueField(field, value)` | Updates Firestore `venues/{id}` |
| "Here is my new Happy Hour menu." | `ingestMenu(image/text)` | OCR/LLM parses text $\rightarrow$ Updates `venues/{id}/menu` |
| "Change my description." | `updateVenueDescription(text)` | Updates `venues/{id}/description` |
| "What do I look like on the app?" | `previewListing()` | Generates a preview link/card |

### 13.3 Marketing & The "Buzz" (Growth)
*Goal: Fill seats during slow periods and leverage the OlyBars network.*

| Owner Intention ("Hey Artie...") | System Action | Data Impact |
| :--- | :--- | :--- |
| "I want to do a Flash Bounty." | `createFlashBounty(offer, duration)` | Creates `events` record, triggers Push Notification |
| "Draft a social post about Trivia." | `generateSocialCopy(topic)` | LLM generation |
| "Draft an email to my regulars." | `draftEmail(venueId, email)` | Saves to `lastArtieDraft` in Firestore |
| "Add this to the city calendar." | `addToCalendar(venueId, entry)` | Saves to `lastArtieDraft` in Firestore |
| "Update my website content." | `updateWebsite(venueId, content)` | Saves to `lastArtieDraft` in Firestore |
| "Generate an image for my IPA." | `generateImage(venueId, prompt)` | Saves to `lastArtieDraft` in Firestore |
| "Show me this week's Weekly Buzz." | `fetchNewsletter(latest)` | Retrieves cached newsletter content |
| "Are there any new bars in town?" | `fetchMarketIntel(new_listings)` | Queries `venues` sorted by `createdAt` |

### 13.4 Operational & Real-Time Vibe (The "Pulse")
*Goal: Accuracy of real-time signals (`vibe_checks`). Requires strict Decay Logic.*

#### A. Owner Overrides
Owners typically intervene to **correct** inaccurate user data.

| Owner Intention ("Hey Artie...") | System Action | Logic / Constraint |
| :--- | :--- | :--- |
| "Nobody is playing pool right now." | `resetAssetStatus('pool_table')` | **Immediate**: Sets `status: available`, clears active Clock Ins. |
| "We are at capacity / There's a line." | `setVenueStatus('packed')` | **Overrides** calculated Buzz Score for set duration (e.g., 2 hrs). |
| "It's dead in here." | `setVenueStatus('chill')` | **Overrides** calculated Buzz Score. |
| "Kitchen is closed early." | `updateServiceStatus('kitchen', 'closed')` | Updates real-time flags, distinct from standard hours. |

#### B. The "Vibe Decay" Logic (Time-To-Live)
To ensure accuracy, every "Active" Vibe Check has a specific TTL (Time To Live) based on the nature of the activity.

| Asset / Activity | Estimated Duration (TTL) | Rationale |
| :--- | :--- | :--- |
| **Vibe Signal** | **60 Minutes** | Buzz decay decreases by 50% every 60 mins. |
| **Pool Table** | **15 Minutes** | Average game time. |
| **Dart Board** | **15 Minutes** | Short turnover time. |
| **Karaoke Queue** | **30 Minutes** | Queue length changes rapidly. |
| **Live Band / Set** | **45 Minutes** | Sets usually last 45m-1h. |
| **Trivia Game** | **90 Minutes** | Long-form event; clock-in remains relevant longer. |
| **"Packed" Crowd** | **60 Minutes** | Crowds disperse; requires re-verification after an hour. |

---

## 14. Appendix F: OlyBars Sales Playbook
**Purpose: Diagnosing venue types and delivering the correct "One-Click" pitch.**

### 14.1 Phase 1: The Diagnosis (The Fork in the Road)
*Visual Cue: Does the venue have a full kitchen?*

*   **IF YES: "THE MARGIN PLAY" (Food Bars/Gastropubs)**
    *   *Target Profile*: Hannah's, Well 80, Spar, Rumors.
    *   *The Pain Point*: "People buy cheap beer, not my high-end food."
    *   *The Pitch*: "We automate your upselling. We attach 'League Bounties' to your high-margin food items. Players buy the burger to get the Badge."
    *   *The Result*: Higher Check Average.

*   **IF NO: "THE TRAFFIC PLAY" (Drink/Dive Bars)**
    *   *Target Profile*: Brotherhood, McCoy's, Eastside, Legends.
    *   *The Pain Point*: "My room is empty on Tuesdays."
    *   *The Pitch*: "We automate your door traffic. We put a '**Time Bounty**' on your venue for Tuesday at 5 PM. Players show up just to collect the points."
    *   *The Result*: Filled Stools (Volume).

### 14.2 Phase 2: Selling the "One-Click" Automation
Owners hate "marketing" because it feels like homework. We offer "Bubbles" on their dashboard: **[Flash Bounty]**, **[Add Event]**, **[Boost Vibe]**.

*   *The Script*: "I know you don't have time to write emails. That's why we built the One-Click system. You see the slow Tuesday, you tap **'Flash Bounty'**. Artie asks 'Food or Time?'. You tap 'Time'. Artie instantly pushes a 'Double Points between 5-7 PM' alert to everyone. You didn't type a thing."

---

## 15. Appendix G: WSLCB Sales Compliance
**Purpose: Keeping the sales pitch legal and protecting the brand.**

1.  **THE "MARGIN PLAY" RULE**: When pitching "Menu Optimization," ALWAYS use food items as examples (Burgers, Apps). NEVER use "Double Points for Double Shots." *Safe Phrase*: "Increase check average through food and merch attachment."
2.  **THE "TRAFFIC PLAY" RULE**: Focus on "Visits" and "Dwell Time." NEVER promise "We will get them to drink more." *Safe Phrase*: "We get them in the door; your service keeps them there."
3.  **NO Flash Deals**: We use **Flash Bounties** (Points). Never imply illegal price discounting on alcohol.

---

## 16. Appendix H: Prohibited Terminology
**Strict compliance is mandatory to protect venue licenses.**

🛑 **NEVER USE**: "Flash Deal" (implies price drop), "Free Beer," "BOGO," "Drink to Win," "Bar Crawl," "Bottomless," "Wasted," "Chug."

✅ **ALWAYS USE**: "Flash Bounty" (points), "Menu Bounty" (food points), "Prizes/Swag," "The Sync," "Earn Status," "Rule of Two," "Safe Ride."

---

| **5** | **Artie Chat** | `ChatWidget` | **The Concierge**: Fixed to the Bottom Right. Branded with `artie-head.png`. No other UI elements (like FABs) may overlap this zone. |

---

## 18. Appendix K: The League Economy (Player Rewards)

### 18.1 The Redemption Menu (The Shop)
*   **What**: A digital catalog where Players trade "Banked Points" for real-world goods.
*   **Who**: All League Players (Tier 2+) with a positive point balance.
*   **Where**: Accessed via `League HQ` > `Prizes` Tab.
*   **Why**: Points must have a "Burn Mechanism" to maintain value and prevent inflation.
*   **How (The Mechanics)**:
    1.  **Purchase**: Player selects an item (e.g., "League Trucker Hat" - 500 Pts).
    2.  **Deduction**: System verifies bank balance and deducts points immediately.
    3.  **Voucher Generation**: A secure QR Code is generated in the **"My Vouchers"** wallet.
    4.  **Fulfillment**: Player visits the designated **Pickup Venue** (e.g., Hannah's). Bartender scans the QR code to mark as "Fulfilled" and hands over the item.

### 18.2 The Secret Menu (The Status Perk)
*   **What**: Unlisted menu items ("Ghost Burgers", "Staff Drinks") available *only* to high-tier players.
*   **Who**: **Residents** (Tier 3) and **Legends** (Tier 4) ONLY.
*   **Why**: Drives "Status Signaling" and FOMO (Fear Of Missing Out). Money cannot buy this; only time/loyalty can.
*   **How (The Mechanics)**:
    1.  **Unlock**: Player reaches Tier 3 (1,000 Pts).
    2.  **Visibility**: A new "Secret Menu" tab appears in `Venue Details` for participating partners.
    3.  **The Ask**: Player orders the specific item code (e.g., "The 98501 Special").
    4.  **Verification**: Bartender asks to see the **Live Badge**. Player flashes their phone showing the animated Tier Badge. No scanning required—visual verification reduces friction.

### 18.3 The Season Championship (The Competition)
*   **The Model**: Seasonal Leagues (Spring, Summer, Fall, Winter) ensuring everyone starts fresh.
*   **The Big Prize**: The #1 Point Leader at 11:59 PM on the Season Finale wins the Grand Prize (Target Value: $500 - $1,500).
    *   *Examples*: Weekend Getaway, Seahawks Tickets, Cash + Tab.
*   **The Playoffs**: The final 2 weeks of any season are "The Playoffs."
    *   **The Surge**: Multipliers increase to 2x/3x to allow for dramatic last-minute upsets.
*   **Milestone Rewards**: Guaranteed prizes for hitting point thresholds, regardless of rank.
    *   *Level 10 (1,000 Pts)*: Official League Sticker.
    *   *Level 20 (2,500 Pts)*: League T-Shirt.
    *   *Level 50 (5,000 Pts)*: Custom Bar Stool Plaque ("Mayor Status").

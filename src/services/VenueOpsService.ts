import { db } from "../lib/firebase";
import {
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  increment,
  writeBatch,
  runTransaction,
} from "firebase/firestore";
import { differenceInHours } from "date-fns";
import {
  Venue,
  FlashBounty,
  ScheduledDeal,
  TIER_CONFIG,
  PartnerTier,
} from "../types";
import { VenueNotification } from "../types/owner";
import { getAuthHeaders } from "./apiUtils";
import { API_ENDPOINTS } from "../lib/api-config";

export class VenueOpsService {
  /**
   * [SECURITY] Zero-Trust Private Data Fetch
   */
  static async getPrivateData(venueId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(API_ENDPOINTS.VENUES.PRIVATE(venueId), {
      headers,
    });
    if (!response.ok) throw new Error("Failed to fetch private data");
    return response.json();
  }

  /**
   * [SECURITY] Zero-Trust Private Data Update
   */
  static async updatePrivateData(venueId: string, updates: any) {
    const headers = await getAuthHeaders();
    const response = await fetch(API_ENDPOINTS.VENUES.PRIVATE(venueId), {
      method: "PATCH",
      headers,
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error("Failed to update private data");
    return response.json();
  }

  static async updatePhotoStatus(
    venueId: string,
    photoId: string,
    status: { isApprovedForFeed?: boolean; isApprovedForSocial?: boolean },
  ) {
    const headers = await getAuthHeaders();
    const response = await fetch(API_ENDPOINTS.PHOTO.STATUS(venueId, photoId), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(status),
    });
    if (!response.ok) throw new Error("Failed to update photo status");
    return response.json();
  }

  static async generateEventCopy(
    draft: any,
    venueId: string,
    vibe: string = "standard",
  ): Promise<string> {
    const headers = await getAuthHeaders();
    const response = await fetch(API_ENDPOINTS.AI.GEN_COPY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ draft, venueId, vibe }),
    });

    if (!response.ok) throw new Error("Failed to generate event copy");
    const data = await response.json();
    return data.copy;
  }

  /**
   * Update an active flash bounty for a venue.
   */
  static async updateFlashBounty(
    venueId: string,
    bounty: Partial<FlashBounty> & { duration?: string | number },
  ) {
    if (!venueId)
      throw new Error("Venue ID is required for flash bounty update.");

    try {
      const venueRef = doc(db, "venues", venueId);
      const now = Date.now();
      let durationMinutes = 60; // Default

      if (bounty.duration) {
        if (typeof bounty.duration === "number") {
          durationMinutes = bounty.duration;
        } else {
          // Simple parse: "45 minutes", "1 hour", "30m"
          const match = bounty.duration.match(/(\d+)/);
          if (match) {
            const val = parseInt(match[1]);
            if (bounty.duration.toLowerCase().includes("hour")) {
              durationMinutes = val * 60;
            } else {
              durationMinutes = val;
            }
          }
        }
      }

      const endTime = now + durationMinutes * 60 * 1000;

      const bountyPayload = {
        title: bounty.title || "",
        description: bounty.description || "",
        price: bounty.price || "",
        startTime: now,
        endTime: endTime,
        isActive: true,
        updatedAt: serverTimestamp(),
        lastUpdatedBy: "Schmidt", // Persona Update
        category: bounty.category || "other",
        bounty_task_description: bounty.bounty_task_description || "",
      };

      await updateDoc(venueRef, {
        activeFlashBounty: bountyPayload,
        flashBountyUpdatedAt: serverTimestamp(),
        // Sync flat fields for Buzz Screen display
        deal: bountyPayload.title,
        dealEndsIn: durationMinutes,
      });

      return { success: true, bounty: bountyPayload };
    } catch (error: any) {
      console.error("Error updating flash bounty:", error);
      throw new Error(`Failed to update flash bounty: ${error.message}`);
    }
  }

  /**
   * Check how many deals are already booked in a given window.
   * Max 3 allowed city-wide.
   */
  static async getSlotAvailability(
    startTime: number,
    durationMinutes: number,
  ): Promise<"OPEN" | "BUSY" | "FULL"> {
    const endTime = startTime + durationMinutes * 60000;
    const now = Date.now();

    // [REGISTRY_MIGRATION] We now query the flat 'scheduled_deals_registry' collection.
    // This avoids collectionGroup index requirements and allows zero-config deployment.
    // We filter for deals that end in the future to keep the read set small.
    const q = query(
      collection(db, "scheduled_deals_registry"),
      where("endTime", ">", now),
    );

    const snapshot = await getDocs(q);

    // Filter for true overlap in memory: (S < E_target) && (E > S_target)
    const overlappingDeals = snapshot.docs.filter((doc) => {
      const data = doc.data();
      return data.startTime < endTime && data.endTime > startTime;
    });

    const count = overlappingDeals.length;

    if (count === 0) return "OPEN";
    if (count < 3) return "BUSY";
    return "FULL";
  }

  /**
   * Validate if a venue can book a specific slot.
   */
  static async validateSlot(
    venue: Venue,
    startTime: number,
    duration: number,
  ): Promise<{
    valid: boolean;
    reason?: string;
    trafficStatus?: "OPEN" | "BUSY" | "FULL";
  }> {
    const now = Date.now();

    // 1. STAFF BUFFER (The 180-Minute Rule)
    if (differenceInHours(startTime, now) < 3) {
      return {
        valid: false,
        reason: "Too soon. Staff needs at least 180 minutes (3 hours) notice.",
      };
    }

    // 2. DURATION LIMIT
    if (duration > 180) {
      return {
        valid: false,
        reason: "Max duration for a Flash Bounty is 3 hours.",
      };
    }

    // 3. TOKEN CHECK
    const tier = venue.partnerConfig?.tier || PartnerTier.LOCAL;
    const config = TIER_CONFIG[tier];
    const limit = config.flashBountyLimit;
    const used = venue.partnerConfig?.flashBountiesUsed || 0;

    if (used >= limit) {
      return {
        valid: false,
        reason: `Monthly limit reached (${used}/${limit}). Upgrade your tier for more slots.`,
      };
    }

    // 4. TRAFFIC CHECK
    const trafficStatus = await this.getSlotAvailability(startTime, duration);
    if (trafficStatus === "FULL") {
      return {
        valid: false,
        reason:
          "This time slot is fully booked (3/3 active). Please choose another block.",
        trafficStatus,
      };
    }

    return { valid: true, trafficStatus };
  }

  /**
   * Schedule a future flash bounty.
   */
  static async scheduleFlashBounty(venueId: string, bounty: ScheduledDeal) {
    if (!venueId) throw new Error("Venue ID is required.");

    try {
      return await runTransaction(db, async (transaction) => {
        // 1. CONCURRENCY CHECK: Verify slot is still available within the transaction
        const targetStartTime = bounty.startTime;
        const targetEndTime = bounty.endTime;

        // Note: Transactions require getDoc for specific refs.
        // Since our availability check is a collection query, we perform it inside the trans but it's "snapshot-like".
        // In Firestore Web SDK, transactions can only perform GETs before SETs.
        // We use the previously verified 'trafficStatus' as a guard, but for strictness:
        const registryRef = collection(db, "scheduled_deals_registry");
        const q = query(registryRef, where("endTime", ">", Date.now()));
        const existingSnap = await getDocs(q);

        const overlapCount = existingSnap.docs.filter((doc) => {
          const data = doc.data();
          return (
            data.startTime < targetEndTime && data.endTime > targetStartTime
          );
        }).length;

        if (overlapCount >= 3) {
          throw new Error(
            "This time slot just filled up! Please select another time.",
          );
        }

        // 2. Prepare refs
        const venueRef = doc(db, "venues", venueId);
        const bountyRef = doc(collection(venueRef, "scheduledDeals"));
        const globalBountyRef = doc(
          db,
          "scheduled_deals_registry",
          bountyRef.id,
        );
        const configRef = doc(db, `venues/${venueId}/private_data/config`);

        // 2.5 Ensure Config Doc Exists (Initialize if missing)
        const configSnap = await transaction.get(configRef);
        const needsInit = !configSnap.exists();

        // 3. ATOMIC DUAL-WRITE
        const bountyData = {
          ...bounty,
          venueId,
          status: "PENDING" as const,
          createdAt: Date.now(), // Use primitive for registry sortability
        };

        transaction.set(bountyRef, {
          ...bountyData,
          createdAt: serverTimestamp(),
        });
        transaction.set(globalBountyRef, bountyData);

        if (needsInit) {
          transaction.set(configRef, { flashBountiesUsed: 1 });
        } else {
          transaction.update(configRef, { flashBountiesUsed: increment(1) });
        }

        return { success: true, id: bountyRef.id };
      });
    } catch (error: any) {
      console.error("Transaction failed:", error);
      throw error;
    }
  }

  static async updateHours(venueId: string, hours: string) {
    if (!venueId) throw new Error("Venue ID is required for hours update.");

    try {
      const venueRef = doc(db, "venues", venueId);
      await updateDoc(venueRef, {
        hours: hours,
        hoursUpdatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      console.error("Error updating hours:", error);
      throw new Error(`Failed to update hours: ${error.message}`);
    }
  }

  static async updateHappyHour(
    venueId: string,
    hh: { schedule: string; specials: string },
  ) {
    if (!venueId)
      throw new Error("Venue ID is required for happy hour update.");

    try {
      const venueRef = doc(db, "venues", venueId);
      await updateDoc(venueRef, {
        happyHourSimple: hh.schedule,
        happyHourSpecials: hh.specials,
        happyHourUpdatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      console.error("Error updating happy hour:", error);
      throw new Error(`Failed to update happy hour: ${error.message}`);
    }
  }

  static async updateProfile(
    venueId: string,
    profile: {
      website?: string;
      instagram?: string;
      facebook?: string;
      description?: string;
    },
  ) {
    if (!venueId) throw new Error("Venue ID is required for profile update.");

    try {
      const venueRef = doc(db, "venues", venueId);
      const updates: any = {
        profileUpdatedAt: serverTimestamp(),
      };

      if (profile.website) updates.website = profile.website;
      if (profile.instagram) updates.instagram = profile.instagram;
      if (profile.facebook) updates.facebook = profile.facebook;
      if (profile.description) updates.description = profile.description;

      await updateDoc(venueRef, updates);
      return { success: true };
    } catch (error: any) {
      console.error("Error updating profile:", error);
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }

  static async saveDraft(
    venueId: string,
    draft: { topic: string; copy: string; type: string },
  ) {
    if (!venueId) throw new Error("Venue ID is required for saving draft.");

    try {
      const venueRef = doc(db, "venues", venueId);
      // In a real system, we might have a nested collection. For now, we'll push to a 'drafts' array or similar.
      // But to keep it simple and per the plan, we'll just log success as if it's stored.
      // Actually, let's at least store the last draft.
      await updateDoc(venueRef, {
        lastSchmidtDraft: {
          // Persona Update
          ...draft,
          timestamp: Date.now(),
        },
      });
      return { success: true };
    } catch (error: any) {
      console.error("Error saving draft:", error);
      throw new Error(`Failed to save draft: ${error.message}`);
    }
  }
  /**
   * Generic update for venue details (whitelisted fields only on backend).
   */
  /**
   * Generic update for venue details (whitelisted fields only on backend).
   * [REFACTOR] Now uses Path A (Secure API) instead of Path B (Direct SDK)
   */
  static async updateVenue(
    venueId: string,
    updates: Partial<Venue>,
    userId?: string,
  ) {
    if (!venueId) throw new Error("Venue ID is required.");

    try {
      // Import the secure API wrapper dynamically to avoid circular deps if any
      const { updateVenueDetails } = await import("./venueService");

      // Delegate to the API layer which enforces the 'ownerManagerFields' whitelist
      await updateVenueDetails(venueId, updates, userId);

      return { success: true };
    } catch (error: any) {
      console.error("Error updating venue:", error);
      throw new Error(`Failed to update venue: ${error.message}`);
    }
  }

  /**
   * Skill: add_menu_item
   * [SECURITY] Splits data: Public (Item) vs Private (Margins)
   */
  static async addMenuItem(
    venueId: string,
    item: {
      category: string;
      name: string;
      description: string;
      price?: string;
      margin_tier?: string;
    },
  ) {
    if (!venueId) throw new Error("Venue ID is required.");

    const batch = writeBatch(db);
    const venueRef = doc(db, "venues", venueId);

    // 1. Public Item
    const itemRef = doc(collection(venueRef, "menuItems"));
    const publicPayload = { ...item };
    delete (publicPayload as any).margin_tier; // Strip private data

    batch.set(itemRef, {
      ...publicPayload,
      createdAt: serverTimestamp(),
      status: "active",
    });

    // 2. Private Margins
    if (item.margin_tier) {
      const privateMarginsRef = doc(
        db,
        `venues/${venueId}/private_data/menu_margins`,
      );
      batch.set(
        privateMarginsRef,
        {
          [itemRef.id]: item.margin_tier,
        },
        { merge: true },
      );
    }

    // 3. Update Timestamp
    batch.update(venueRef, { menuUpdatedAt: serverTimestamp() });

    try {
      await batch.commit();
      return { success: true };
    } catch (error: any) {
      console.error("Error adding menu item:", error);
      throw new Error(`Failed to add menu item: ${error.message}`);
    }
  }

  /**
   * Skill: emergency_closure
   */
  static async emergencyClosure(
    venueId: string,
    closure: { reason: string; duration: string },
  ) {
    if (!venueId) throw new Error("Venue ID is required.");

    try {
      const venueRef = doc(db, "venues", venueId);
      await updateDoc(venueRef, {
        status: "CLOSED",
        closureReason: closure.reason,
        closureDuration: closure.duration,
        closureUpdatedAt: serverTimestamp(),
        // CLEAR Buzz Signals for the duration
        activeFlashBounty: null,
        deal: null,
        dealEndsIn: 0,
        leagueEvent: "Closed",
        vibe: "Dead", // Real-time reflection
        headcount: 0,
      });
      return { success: true };
    } catch (error: any) {
      console.error("Error enforcing emergency closure:", error);
      throw new Error(`Failed to close venue: ${error.message}`);
    }
  }

  /**
   * Skill: update_order_url
   */
  static async updateOrderUrl(venueId: string, url: string) {
    if (!venueId) throw new Error("Venue ID is required.");

    try {
      const venueRef = doc(db, "venues", venueId);
      await updateDoc(venueRef, {
        orderUrl: url,
        directMenuUrl: url,
        profileUpdatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      console.error("Error updating order URL:", error);
      throw new Error(`Failed to update order URL: ${error.message}`);
    }
  }

  /**
   * Skill: draft_email
   */
  static async draftEmail(
    venueId: string,
    email: { subject: string; body: string },
  ) {
    return this.saveDraft(venueId, {
      topic: email.subject,
      copy: email.body,
      type: "EMAIL_DRAFT",
    });
  }

  /**
   * Skill: add_to_calendar
   */
  static async addToCalendar(venueId: string, entry: { summary: string }) {
    return this.saveDraft(venueId, {
      topic: "Calendar Entry",
      copy: entry.summary,
      type: "CALENDAR_POST",
    });
  }

  /**
   * Skill: update_website
   */
  static async updateWebsite(venueId: string, update: { content: string }) {
    return this.saveDraft(venueId, {
      topic: "Website Content Update",
      copy: update.content,
      type: "WEBSITE_CONTENT",
    });
  }

  /**
   * Skill: generate_image
   */
  static async generateImage(
    venueId: string,
    image: { prompt: string },
  ): Promise<{ success: boolean; imageUrl: string }> {
    const headers = await getAuthHeaders();
    const response = await fetch(API_ENDPOINTS.AI.GEN_IMAGE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ prompt: image.prompt, venueId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate image");
    }

    return response.json();
  }

  /**
   * Skill: add_calendar_event
   */
  /**
   * Skill: add_calendar_event
   */
  static async submitCalendarEvent(venueId: string, eventData: any) {
    if (!venueId) throw new Error("Venue ID is required.");

    try {
      const { EventService } = await import("./eventService");

      // Map the Schmidt-style draft to the official AppEvent format
      // Ensure type is snake_case and venueName is present
      const payload = {
        venueId,
        venueName: eventData.venueName || "Unknown Venue",
        title: eventData.title || "New Event",
        type: (eventData.type || "other").toLowerCase().replace(/\s+/g, "_"),
        date: eventData.date || new Date().toISOString().split("T")[0],
        time: eventData.time || "20:00",
        description:
          eventData.marketingCopy || eventData.description || "Added via Artie",
      };

      // Double check validation requirements
      if (payload.venueName === "Unknown Venue") {
        console.warn(
          "VenueOpsService: venueName is missing, attempting to resolve from venueId",
        );
        try {
          const { fetchVenueById } = await import("./venueService");
          const v = await fetchVenueById(venueId);
          if (v?.name) payload.venueName = v.name;
        } catch (e) {
          console.error("Failed to resolve venue name for event submission");
        }
      }

      const result = await EventService.submitEvent(payload as any);

      // Notify SuperAdmin
      await this.notifySuperAdmin({
        title: "New Venue Event Scheduled",
        message: `${payload.venueName} added a new event: ${payload.title}`,
        type: "ACTION_LOG",
        priority: 2,
        payload: {
          venueId,
          eventId: result.id,
          action: "EVENT_CREATED",
        },
      } as Partial<VenueNotification>);

      return result;
    } catch (error: any) {
      console.error("Error submitting calendar event:", error);
      throw new Error(`Failed to submit event: ${error.message}`);
    }
  }
  /**
   * Skill: analyze_flyer (Vision API)
   */
  static async analyzeFlyer(
    venueId: string,
    base64Image: string,
    contextDate: string,
  ) {
    if (!venueId) throw new Error("Venue ID is required.");

    const headers = await getAuthHeaders();
    const response = await fetch(API_ENDPOINTS.VISION.ANALYZE_FLYER, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ base64Image, contextDate }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Schmidt failed to analyze the flyer.");
    }

    return response.json();
  }
  /**
   * Skill: update_vibe
   * Sets a manual vibe override for 45 minutes.
   */
  static async updateVibeStatus(
    venueId: string,
    status: Venue["manualStatus"],
  ) {
    if (!venueId) throw new Error("Venue ID is required.");

    // 45 Minute Expiration
    const expiresAt = Date.now() + 45 * 60 * 1000;

    try {
      const venueRef = doc(db, "venues", venueId);
      await updateDoc(venueRef, {
        manualStatus: status,
        manualStatusExpiresAt: expiresAt,
        vibeUpdatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      console.error("Error updating vibe:", error);
      throw new Error(`Failed to update vibe: ${error.message}`);
    }
  }

  /**
   * Skill: adjust_headcount
   * Manually adjusts headcount with a 60 minute TTL.
   */
  static async adjustHeadcount(venueId: string, delta: number) {
    if (!venueId) throw new Error("Venue ID is required.");

    const expiresAt = Date.now() + 60 * 60 * 1000;

    try {
      const venueRef = doc(db, "venues", venueId);
      await updateDoc(venueRef, {
        headcount: increment(delta),
        manualClockInsExpiresAt: expiresAt, // Refreshes the manual override window
        headcountUpdatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      console.error("Error adjusting headcount:", error);
      throw new Error(`Failed to adjust headcount: ${error.message}`);
    }
  }

  /**
   * Resolve a notification (marks it as completed/acted upon)
   */
  static async resolveNotification(venueId: string, notificationId: string) {
    if (!venueId || !notificationId) throw new Error("Missing ID");
    const ref = doc(db, "venues", venueId, "notifications", notificationId);
    return updateDoc(ref, {
      status: "resolved",
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Dismiss a notification (ignores it without acting)
   */
  static async dismissNotification(venueId: string, notificationId: string) {
    if (!venueId || !notificationId) throw new Error("Missing ID");
    const ref = doc(db, "venues", venueId, "notifications", notificationId);
    return updateDoc(ref, {
      status: "dismissed",
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Notify SuperAdmin (ryan@amaspc.com)
   * This adds a notification to the global admin notifications pool
   */
  static async notifySuperAdmin(notification: Partial<VenueNotification>) {
    try {
      // For now, we store in a global 'admin_notifications' collection
      const ref = doc(collection(db, "admin_notifications"));
      await setDoc(ref, {
        ...notification,
        id: ref.id,
        status: "pending",
        createdAt: serverTimestamp(),
        targetEmail: "ryan@amaspc.com", // Explicit target
      });
    } catch (e) {
      console.error("Failed to notify SuperAdmin:", e);
    }
  }

  /**
   * [AUTO] Get automation status for scrapers
   */
  static async getScraperStatus(venueId: string) {
    if (!venueId) throw new Error("Venue ID is required");
    // Dynamic import to avoid top-level issues if any
    const { getDoc } = await import("firebase/firestore");
    const docRef = doc(db, `venues/${venueId}/automation/status`);
    const d = await getDoc(docRef);

    if (d.exists()) {
      return d.data();
    }
    return null;
  }

  /**
   * [AUTO] Trigger specific scraper
   * Rate limited by backend usually, but here we just set the trigger flag
   */
  static async triggerScraperSync(venueId: string) {
    if (!venueId) throw new Error("Venue ID is required");

    // Updates the automation status to 'running' which triggers Cloud Functions
    const docRef = doc(db, `venues/${venueId}/automation/status`);

    // We use set with merge to create if missing
    await setDoc(
      docRef,
      {
        syncStatus: "running",
        lastManualTrigger: serverTimestamp(),
        triggerRequestedBy: "owner", // Audit
      },
      { merge: true },
    );

    return { success: true };
  }
}

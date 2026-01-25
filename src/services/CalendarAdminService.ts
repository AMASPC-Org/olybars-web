import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { DiscoveredHoliday, CalendarEvent } from "../types/context_system";

export class CalendarAdminService {
  private static DISCOVERY_COLLECTION = "discovered_holidays";
  private static CALENDAR_COLLECTION = "system_calendar";

  static async getPendingHolidays(): Promise<DiscoveredHoliday[]> {
    const q = query(
      collection(db, this.DISCOVERY_COLLECTION),
      where("status", "==", "PENDING"),
      orderBy("date", "asc"),
      limit(50),
    );
    const snap = await getDocs(q);
    return snap.docs.map(
      (d) => ({ ...d.data(), id: d.id }) as DiscoveredHoliday,
    );
  }

  static async ignoreHoliday(id: string): Promise<void> {
    await updateDoc(doc(db, this.DISCOVERY_COLLECTION, id), {
      status: "IGNORED",
    });
  }

  static async promoteHoliday(
    holiday: DiscoveredHoliday,
    finalTags: string[],
    weatherCriteria?: any,
  ): Promise<void> {
    const calendarId = holiday.name.toLowerCase().replace(/[^a-z0-9]/g, "-");

    // 1. Create Live Calendar Event
    const liveEvent: CalendarEvent = {
      id: calendarId,
      name: holiday.name,
      date: holiday.date.substring(5), // Make recurring MM-DD
      description: holiday.description,
      target_tags: finalTags,
      weather_criteria: weatherCriteria || {},
      promotionMetadata: {
        promotedAt: Date.now(),
        originalSource: holiday.source,
      },
    };

    await setDoc(doc(db, this.CALENDAR_COLLECTION, calendarId), liveEvent);

    // 2. Mark as Approved
    await updateDoc(doc(db, this.DISCOVERY_COLLECTION, holiday.id), {
      status: "APPROVED",
    });
  }
}

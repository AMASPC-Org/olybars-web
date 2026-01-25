import { CalendarEvent, WeatherCondition, SystemNotification } from "../types";
import { db } from "./firebase";
import { collection, query, getDocs } from "firebase/firestore";

export class ContextEngine {
  private static lastCheckedDate: string | null = null;
  private static cachedEvents: CalendarEvent[] = [];

  static async getDailyContext(
    date: Date,
    weather: WeatherCondition,
  ): Promise<CalendarEvent[]> {
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    const monthDay = dateStr.slice(5); // MM-DD

    // Basic memoization: cache events for the current day to minimize Firestore reads
    if (this.lastCheckedDate === dateStr && this.cachedEvents.length > 0) {
      return this.filterByWeather(this.cachedEvents, weather);
    }

    try {
      const q = query(collection(db, "system_calendar"));
      const snap = await getDocs(q);
      const allEvents = snap.docs.map(
        (doc) => ({ ...doc.data() }) as CalendarEvent,
      );

      // Filter by date (Exact match or MM-DD match for recurring)
      const dailyEvents = allEvents.filter(
        (ev) => ev.date === dateStr || ev.date === monthDay,
      );

      this.lastCheckedDate = dateStr;
      this.cachedEvents = dailyEvents;

      return this.filterByWeather(dailyEvents, weather);
    } catch (error) {
      console.error("Failed to fetch calendar context:", error);
      // Graceful degradation: return empty but don't crash
      return [];
    }
  }

  static filterByWeather(
    events: CalendarEvent[],
    weather: WeatherCondition,
  ): CalendarEvent[] {
    return events.filter((ev) => {
      const criteria = ev.weather_criteria;
      if (!criteria || Object.keys(criteria).length === 0) return true;

      // Resilience: If weather data is partial, skip those criteria
      if (criteria.minTemp !== undefined && weather.temp_f < criteria.minTemp)
        return false;
      if (criteria.maxTemp !== undefined && weather.temp_f > criteria.maxTemp)
        return false;
      if (
        criteria.isRaining !== undefined &&
        weather.is_raining !== criteria.isRaining
      )
        return false;

      if (
        criteria.requiredConditions &&
        criteria.requiredConditions.length > 0
      ) {
        if (!criteria.requiredConditions.includes(weather.condition_code))
          return false;
      }

      return true;
    });
  }

  static async getUpcomingContext(
    startDate: Date,
    windowDays: number,
  ): Promise<CalendarEvent[]> {
    try {
      // For upcoming, we just want to grab the doc logic again but filter for the window
      // Optimization: We could reuse the same query if we cache properly, but for now specific query
      const q = query(collection(db, "system_calendar"));
      const snap = await getDocs(q);
      const allEvents = snap.docs.map(
        (doc) => ({ ...doc.data() }) as CalendarEvent,
      );

      const eventsInWindow: CalendarEvent[] = [];
      const start = new Date(startDate);
      const end = new Date(startDate);
      end.setDate(end.getDate() + windowDays);

      const startStr = dateToSlug(start);
      const endStr = dateToSlug(end);

      // Naive date string comparison for YYYY-MM-DD
      // Better: Convert all event dates to real Dates for comparison
      // Supporting recurring events (MM-DD) vs One-offs (YYYY-MM-DD)

      allEvents.forEach((ev) => {
        let evDateStr = ev.date; // Could be "2023-12-25" or "12-25"
        let evDate: Date;

        if (evDateStr.length === 5) {
          // Recurring MM-DD, append current year
          const currentYear = start.getFullYear();
          evDateStr = `${currentYear}-${evDateStr}`;
        }

        evDate = new Date(evDateStr);

        // Handle year rollover for recurring events if window crosses year
        if (ev.date.length === 5 && evDate < start) {
          evDate.setFullYear(start.getFullYear() + 1);
        }

        if (evDate > start && evDate <= end) {
          // "Upcoming" means strictly after today
          eventsInWindow.push(ev);
        }
      });

      return eventsInWindow.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error("Failed to fetch upcoming context:", error);
      return [];
    }
  }

  static generateOwnerNotifications(
    events: CalendarEvent[],
    venueTags: string[],
    type: "opportunity" | "upcoming_holiday" = "opportunity",
  ): SystemNotification[] {
    return events
      .filter((ev) => {
        // Venue-Aware Filtering: Only show if there's a tag overlap
        if (!ev.target_tags || ev.target_tags.length === 0) return true;
        return ev.target_tags.some((tag) => venueTags?.includes(tag));
      })
      .map((ev) => {
        const priority = this.determinePriority(ev);
        return {
          id: `context-${ev.id}-${dateToSlug(new Date())}-${type}`,
          type: type,
          title: ev.name,
          message: this.generateMarketingHook(ev),
          action_label:
            type === "upcoming_holiday" ? "Plan Ahead" : "Ask Schmidt",
          action_context: {
            topic: ev.name,
            intent:
              type === "upcoming_holiday" ? "PLANNING" : "MARKETING_PROMO",
            target_tags: ev.target_tags,
            constraints: ["WSLCB_SAFE"],
            eventDate: ev.date,
          },
          priority,
          createdAt: Date.now(),
        };
      });
  }

  private static determinePriority(
    ev: CalendarEvent,
  ): "high" | "medium" | "low" {
    const highPriorityKeywords = ["tequila", "national", "stout", "patio"];
    if (
      ev.target_tags?.some((tag) =>
        highPriorityKeywords.includes(tag.toLowerCase()),
      )
    )
      return "high";
    return "medium";
  }

  private static generateMarketingHook(ev: CalendarEvent): string {
    // Dynamic hooks based on event type
    const hooks: Record<string, string> = {
      "National Tequila Day":
        "It's National Tequila Day! Perfect time to showcase your agave selection.",
      "Oly Patio Day":
        "Blue skies ahead! It's a great day to invite guests to your patio.",
      "Cozy Stout Day":
        "Cozy vibes only. Promote your dark beers and fireplace tonight.",
    };

    // WSLCB-safe fallback: focus on "selection" and "vibe" rather than pricing or consumption
    return (
      hooks[ev.name] ||
      `It's ${ev.name}! Perfect day to highlight your venue's unique selection.`
    );
  }
}

function dateToSlug(date: Date): string {
  return date.toISOString().split("T")[0];
}

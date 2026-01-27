import { z } from "zod";

// --- Enums / Constants ---

export const ScraperType = z.enum([
  "EVENTS",
  "MENU",
  "NEWSLETTER",
  "CUSTOM",
]);

export const ScraperFrequency = z.enum([
  "ON_DEMAND",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
]);

export const ScraperStatus = z.enum([
  "ACTIVE",
  "PAUSED",
  "BLOCKED", // Robots.txt or Admin block
  "ERROR",
]);

export const RunStatus = z.enum([
  "QUEUED",
  "Running", // Using "Running" to match some legacy or standard cloud task states if needed, but usually uppercase. specific "STARTED" is better.
  "STARTED",
  "SUCCESS",
  "NO_CHANGE", // Optimization: Content hash matched previous
  "FAILED",
  "BLOCKED", // Quota exceeded or robots
]);

// --- Purpose Configurations ---

export const EventsPurposeSchema = z.object({
  keywords: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.string().optional(), // ISO
    end: z.string().optional()
  }).optional()
});

export const MenuPurposeSchema = z.object({
  extractImages: z.boolean().default(false),
  extractModifiers: z.boolean().default(false)
});

// --- Core Scraper Model ---

export const ScraperSchema = z.object({
  id: z.string(),
  venueId: z.string(), // aka partner_id
  url: z.string().url(),
  type: ScraperType,
  name: z.string().min(1),
  description: z.string().optional(),

  extractionInstructions: z.string().optional(),
  purposeConfig: z.union([EventsPurposeSchema, MenuPurposeSchema, z.record(z.any())]).optional(),

  schedule: z.object({
    frequency: ScraperFrequency,
    isEnabled: z.boolean(),
    nextRunAt: z.number().nullable(), // Timestamp
    lastRunAt: z.number().nullable(),
  }),

  // System status
  status: ScraperStatus,
  robotsStatus: z.object({
    allowed: z.boolean(),
    lastCheckedAt: z.number(),
    reason: z.string().optional()
  }).optional(),

  errorCount: z.number().default(0),
  deleted: z.boolean().default(false),

  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Scraper = z.infer<typeof ScraperSchema>;

// --- Run History Model ---

export const ScraperRunSchema = z.object({
  id: z.string(),
  scraperId: z.string(),
  venueId: z.string(),
  status: RunStatus,
  trigger: z.enum(["SCHEDULED", "MANUAL", "RETRY"]),

  startedAt: z.number().optional(),
  completedAt: z.number().optional(),

  stats: z.object({
    pagescanned: z.number().default(0),
    itemsExtracted: z.number().default(0),
    newItems: z.number().default(0),
    aiTokensUsed: z.number().default(0),
    durationMs: z.number().default(0)
  }).optional(),

  error: z.string().optional(),

  // Hash for change detection
  contentHash: z.string().optional(),

  createdAt: z.number(),
});

export type ScraperRun = z.infer<typeof ScraperRunSchema>;

// --- Extracted Data Models ---

export const ScrapedEventSchema = z.object({
  title: z.string(),
  startDateTime: z.string(), // ISO
  endDateTime: z.string().nullable().optional(),
  description: z.string().optional(),
  venueName: z.string().optional(),
  location: z.string().optional(),
  ticketUrl: z.string().url().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  tags: z.array(z.string()).optional(),
  sourceUrl: z.string().url(),
});

export type ScrapedEvent = z.infer<typeof ScrapedEventSchema>;

export const ScrapedMenuSchema = z.object({
  categories: z.array(z.object({
    name: z.string(),
    items: z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
      price: z.string().optional(), // String to handle "$10", "10.00", "Market Price"
      dietaryTags: z.array(z.string()).optional(),
      imageUrl: z.string().optional()
    }))
  }))
});

export type ScrapedMenu = z.infer<typeof ScrapedMenuSchema>;

console.log("🔄 [DEBUG] Server process starting...");
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { rateLimit } from "express-rate-limit";
import { config } from "./appConfig/config.js";
import { fetchVenues, clockIn, getVenueById } from "./venueService.js";
import { isAiBot, getBotName } from "./utils/botDetector.js";
import {
  verifyToken,
  requireRole,
  requireVenueAccess,
  verifyAppCheck,
  identifyUser,
} from "./middleware/authMiddleware.js";
import { vibeNormalizer } from "./middleware/vibeNormalizer.js";
import { RequestContext } from "./utils/context.js";
import { logger } from "./utils/logger.js";
import { ScraperService } from "./services/ScraperService.js";
import { WorkerService } from "./services/workerService.js";
import { SchedulerService } from "./services/schedulerService.js";
import { enqueueScraperRun } from "./utils/cloudTasks.js";

import {
  ClockInSchema,
  PlayClockInSchema,
  AdminRequestSchema,
  UserUpdateSchema,
  VenueUpdateSchema,
  VenueOnboardSchema,
  AppEventSchema,
  GenerateImageSchema,
  BountyReviewSchema,
} from "./utils/validation.js";

const app = express();
app.set("trust proxy", 1); // Trust first proxy (Cloud Run load balancer)
const port = config.PORT;

// [SECURITY] Standard headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        // Re-apply defaults but relax for dev & google APIs
        "default-src": ["'self'"],
        "connect-src": [
          "'self'",
          "http://localhost:*",
          "ws://localhost:*",
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com",
          "https://firestore.googleapis.com",
          "https://*.firebaseio.com",
          "https://*.cloudfunctions.net",
          "https://maps.googleapis.com",
          "https://stats.g.doubleclick.net", // Analytics often needs this
        ],
        "script-src": [
          "'self'",
          "'unsafe-inline'", // Needed for some google maps callbacks / dev tools
          "'unsafe-eval'", // Often needed for dev source maps
          "https://maps.googleapis.com",
          "https://*.googleapis.com",
        ],
        "style-src": [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
        ],
        "img-src": [
          "'self'",
          "data:",
          "blob:",
          "https://maps.gstatic.com",
          "https://maps.googleapis.com",
          "https://*.googleusercontent.com",
          "https://firebasestorage.googleapis.com",
        ],
        "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
        "frame-src": ["'self'", "https://*.firebaseapp.com"],
        "object-src": ["'none'"],
        "upgrade-insecure-requests": null, // Disable auto-upgrade for localhost dev
      },
    },
  }),
);
app.use(compression());

/**
 * Global Rate Limiter
 * 100 requests per 15 minutes per IP.
 */
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

/**
 * Artie Chat Rate Limiter (Removed - Deprecated in favor of Cloud Gateway)
 */
// artieRateLimiter was here

const v1Router = express.Router();
const v2Router = express.Router();

/**
 * Versioned Rate Limiters
 */
v1Router.use(globalRateLimiter);
v2Router.use(globalRateLimiter);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "https://ama-ecosystem-dev-9ceda.web.app",
  "https://olybars-dev.web.app",
  "https://olybars.web.app",
  "https://olybars.com",
  "https://www.olybars.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * Honeypot Middleware
 * Rejects requests with non-empty honeypot field.
 */
const verifyHoneypot = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  if (req.body._hp_id) {
    log("WARNING", "[HONEYPOT_TRIGGERED] Potential bot submission blocked.", {
      ip: req.ip,
    });
    return res.status(403).json({ error: "Beep boop. Request denied." });
  }
  next();
};

/**
 * Aggressive Bot Blocker Middleware
 * Identifies and blocks high-aggression/low-value bots on sensitive routes.
 */
const blockAggressiveBots = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const userAgent = req.get("user-agent") || "";
  if (isAiBot(userAgent)) {
    const botName = getBotName(userAgent);
    const AGGRESSIVE_BOTS = [
      "GPTBOT",
      "CCBOT",
      "BYTESPIDER",
      "PETALBOT",
      "DIFFBOT",
    ];

    if (AGGRESSIVE_BOTS.includes(botName)) {
      log("WARNING", `[ABUSE_PREVENTED] Blocked aggressive bot: ${botName}`, {
        url: req.url,
      });
      return res
        .status(403)
        .json({ error: "This resource is reserved for humans. Cheers!" });
    }
  }
  next();
};

/**
 * Structured Logging Helper for Google Cloud
 */
const log = (severity: string, message: string, payload: any = {}) => {
  logger.log(severity as any, message, { payload });
};

app.use((req, res, next) => {
  const start = Date.now();
  const correlationId =
    req.header("x-correlation-id") ||
    `req-${Math.random().toString(36).substring(2, 11)}`;
  const userAgent = req.get("user-agent") || "";

  // [SUPPORT] Inject Correlation ID into Response Headers
  res.setHeader("x-correlation-id", correlationId);

  RequestContext.run(
    {
      correlationId,
      method: req.method,
      path: req.url,
      clientIp: req.ip || req.header("x-forwarded-for") || "unknown",
    },
    () => {
      // AI Bot Tracking
      if (isAiBot(userAgent)) {
        const botName = getBotName(userAgent);
        const resource = req.url;
        const clientIp = RequestContext.get()?.clientIp;

        // Non-blocking log to Firestore
        (async () => {
          try {
            const { db } = await import("./firebaseAdmin.js");
            await db.collection("ai_access_logs").add({
              botName,
              userAgent,
              resource,
              timestamp: new Date().toISOString(),
              method: req.method,
              ip: clientIp,
            });
            logger.info(`[AI_BOT_DETECTED] ${botName} accessed ${resource}`);
          } catch (err) {
            logger.error("[AI_ERROR] Failed to log bot access", err);
          }
        })();
      }

      res.on("finish", () => {
        const latencyMs = Date.now() - start;

        // [FINOPS] Sampling for successful high-frequency routes
        let samplingRate = 1.0;
        if (res.statusCode === 200) {
          if (req.url === "/health" || req.url === "/api/health") samplingRate = 0;
          else if (req.url.startsWith("/api/venues")) samplingRate = 0.1;
        }

        logger.info(`${req.method} ${req.url} - ${res.statusCode}`, {
          route: req.route?.path || req.url,
          status: res.statusCode,
          latencyMs,
          userAgent,
        }, samplingRate);
      });

      next();
    }
  );
});

/**
 * @route GET /
 * @desc Welcome message
 */
app.get("/", (req, res) => {
  res.send(`
    <body style="background: #0f172a; color: #fbbf24; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0;">
      <h1 style="font-size: 3rem; margin-bottom: 0;">OLYBARS BACKEND</h1>
      <p style="color: #94a3b8; font-size: 1.2rem;">Artie Relay is Online! 🍺</p>
      <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}" style="margin-top: 2rem; padding: 1rem 2rem; background: #fbbf24; color: #000; text-decoration: none; font-weight: bold; border-radius: 0.5rem;">Launch Frontend</a>
    </body>
  `);
});

/**
 * @route GET /health
 * @desc API Health check
 */
app.get("/health", (req, res) => {
  res.json({
    status: "popping",
    timestamp: Date.now(),
    env: config.NODE_ENV,
    version: "1.0.0-hardened",
  });
});

/**
 * @route GET /api/health/artie
 * @desc Artie Health Check (Authenticated)
 */
v1Router.get("/health", (req, res) => {
  res.json({
    status: "popping",
    timestamp: Date.now(),
    env: config.NODE_ENV,
    version: "1.0.0-hardened",
    router: "v1",
  });
});

v1Router.get("/health/artie", async (req, res) => {
  const internalToken = req.header("X-Internal-Token");
  const expectedToken = config.INTERNAL_HEALTH_TOKEN;

  if (!internalToken || internalToken !== expectedToken) {
    return res.status(403).json({
      error: "Artie says: Access Denied. Proper credentials required.",
    });
  }

  try {
    const { GeminiService } = await import("./services/geminiService.js");
    const gemini = new GeminiService();
    // Minimal ping call (triage is cheap)
    const triage = await gemini.getTriage("Health Check Ping");
    res.json({
      status: "healthy",
      artieBrain: "connected",
      triageResult: triage,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    log("ERROR", "Artie Health Check Failed", { error: error.message });
    res.status(500).json({ status: "unhealthy", error: error.message });
  }
});

/**
 * @route GET /api/venues
 * @desc Fetch sorted venues from Firestore
 */
v1Router.get("/venues", async (req, res) => {
  try {
    const brief = req.query.brief === "true";
    const venues = await fetchVenues(brief);
    // Optimize for CDN: 30s fresh, 60s stale-while-revalidate for instant loads
    res.setHeader(
      "Cache-Control",
      "public, max-age=30, s-maxage=60, stale-while-revalidate=60",
    );
    res.json(venues);
  } catch (error: any) {
    log("ERROR", "CRITICAL ERROR fetching venues", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @route GET /api/venues/:id
 * @desc Fetch a single venue by ID (Full Data)
 */
v1Router.get("/venues/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const venue = await getVenueById(id);
    if (!venue) return res.status(404).json({ error: "Venue not found" });
    res.json(venue);
  } catch (error: any) {
    log("ERROR", "Error fetching single venue", {
      venueId: id,
      error: error.message,
    });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @route GET /api/admin/venues
 * @desc Fetch ALL venues for Admin Dashboard (includes archived)
 */
v1Router.get(
  "/admin/venues",
  verifyToken,
  requireRole(["admin", "super-admin"]),
  async (req, res) => {
    try {
      const { fetchAllVenuesAdmin } = await import("./venueService.js");
      const venues = await fetchAllVenuesAdmin();
      res.json(venues);
    } catch (error: any) {
      log("ERROR", "Failed to fetch admin venues", { error: error.message });
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

/**
 * @route DELETE /api/venues/:id
 * @desc Delete a venue (Super Admin only)
 */
v1Router.delete(
  "/venues/:id",
  verifyToken,
  requireRole(["super-admin"]),
  async (req, res) => {
    const { id } = req.params;
    try {
      const { deleteVenue } = await import("./venueService.js");
      await deleteVenue(id);
      log("INFO", `Venue deleted by super-admin`, {
        venueId: id,
        adminId: (req as any).user.uid,
      });
      res.json({ success: true, message: "Venue deleted" });
    } catch (error: any) {
      log("ERROR", "Failed to delete venue", {
        venueId: id,
        error: error.message,
      });
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

/**
 * @route POST /api/clock-in
 * @desc Verify location and log a clock-in signal
 */
v1Router.post("/clock-in", verifyAppCheck, verifyToken, async (req, res) => {
  const validation = ClockInSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: "Invalid clock-in data",
      details: validation.error.format(),
    });
  }
  const { venueId, lat, lng, verificationMethod } = validation.data;
  const userId = (req as any).user.uid;

  try {
    const result = await clockIn(venueId, userId, lat, lng, verificationMethod);
    res.json(result);
  } catch (error: any) {
    log("WARNING", "Clock-in failed", {
      venueId,
      userId,
      error: error.message,
    });
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route POST /api/vibe-check
 * @desc Submit a vibe check (Signal + Points)
 */
v1Router.post("/vibe-check", verifyToken, vibeNormalizer, async (req, res) => {
  const { VibeCheckSchema } = await import("./utils/validation.js"); // Dynamic import to ensure schema is loaded
  const validation = VibeCheckSchema.safeParse(req.body);

  if (!validation.success) {
    return res
      .status(400)
      .json({ error: "Invalid vibe data", details: validation.error.format() });
  }

  const {
    venueId,
    status,
    hasConsent,
    photoUrl,
    verificationMethod,
    gameStatus,
  } = validation.data;
  const userId = (req as any).user.uid;

  try {
    const { performVibeCheck } = await import("./venueService.js");
    // Cast gameStatus to any to match strict type expectation if needed, or ensure validation schema matches exactly
    const result = await performVibeCheck(
      venueId,
      userId,
      status as any,
      hasConsent,
      photoUrl,
      verificationMethod as any,
      gameStatus as any,
    );
    res.json(result);
  } catch (error: any) {
    log("WARNING", "Vibe check failed", {
      venueId,
      userId,
      error: error.message,
    });
    res.status(400).json({ error: error.message });
  }
});

v1Router.post("/play/clock-in", verifyToken, async (req, res) => {
  const validation = PlayClockInSchema.safeParse(req.body);
  if (!validation.success) {
    return res
      .status(400)
      .json({ error: "Invalid play data", details: validation.error.format() });
  }
  const { venueId, featureId } = validation.data;
  const userId = (req as any).user.uid;

  try {
    const { clockInGameFeature } = await import("./venueService.js");
    const result = await clockInGameFeature(venueId, userId, featureId);
    res.json(result);
  } catch (error: any) {
    log("WARNING", "Play clock-in failed", {
      venueId,
      userId,
      featureId,
      error: error.message,
    });
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route POST /api/requests
 * @desc Handle Admin Requests (Contact, League, Maker)
 * @params type, payload, contactEmail
 */
v1Router.post(
  "/requests",
  verifyAppCheck,
  verifyHoneypot,
  blockAggressiveBots,
  async (req: express.Request, res: express.Response) => {
    const validation = AdminRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: validation.error.format(),
      });
    }
    const { type, payload, contactEmail } = validation.data;

    try {
      const requestData = {
        type,
        payload,
        contactEmail: contactEmail || "anonymous",
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };

      log("INFO", `[ADMIN_REQUEST] received: ${type}`, requestData);

      // Simulate Email Notification
      console.log(`\nðŸ“¨ --- EMAIL SIMULATION ---`);
      console.log(`To: ryan@amaspc.com`);
      console.log(`Subject: New ${type} Request`);
      console.log(`From: Artie (System)`);
      console.log(`Body:`, JSON.stringify(requestData, null, 2));
      console.log(`---------------------------\n`);

      res.json({ success: true, message: "Request received and logged." });
    } catch (error: any) {
      log("ERROR", "Failed to process request", { error: error.message });
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

/**
 * @route POST /api/activity
 * @desc Log user activity and award points
 */
v1Router.post("/activity", verifyToken, async (req, res) => {
  const userId = (req as any).user.uid;
  const { type, venueId, points, hasConsent, metadata } = req.body;

  if (!userId || !type || points === undefined) {
    return res.status(400).json({ error: "Missing required activity data" });
  }

  try {
    const { logUserActivity } = await import("./venueService.js");
    const result = await logUserActivity({
      userId,
      type,
      venueId,
      points,
      hasConsent,
      metadata,
    });
    res.json(result);
  } catch (error: any) {
    log("ERROR", "Failed to log activity", { error: error.message });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @route GET /api/activity
 * @desc Fetch aggregated activity stats for a venue
 */
v1Router.get("/activity", async (req, res) => {
  const { venueId, period } = req.query;

  if (!venueId) {
    return res.status(400).json({ error: "venueId is required" });
  }

  try {
    const { getActivityStats } = await import("./venueService.js");
    const stats = await getActivityStats(
      venueId as string,
      (period as string) || "week",
    );
    res.json(stats);
  } catch (error: any) {
    log("ERROR", "Failed to fetch activity stats", { error: error.message });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @route GET /api/partners/reports/hourly
 * @desc Fetch hourly activity reports for a venue
 */
v1Router.get(
  "/partners/reports/hourly",
  verifyToken,
  requireVenueAccess("manager"),
  async (req, res) => {
    const { venueId, day } = req.query;
    if (!venueId) return res.status(400).json({ error: "venueId is required" });

    try {
      const { getPartnerHourlyReport } = await import("./venueService.js");
      const report = await getPartnerHourlyReport(
        venueId as string,
        day ? parseInt(day as string) : undefined,
      );
      res.json(report);
    } catch (error: any) {
      log("ERROR", "Failed to fetch hourly report", { error: error.message });
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

/**
 * @route GET /api/users/me/history
 * @desc Fetch point history for the authenticated user
 */
v1Router.get("/users/me/history", verifyToken, async (req, res) => {
  const userId = (req as any).user.uid;
  try {
    const { getUserPointHistory } = await import("./venueService.js");
    const history = await getUserPointHistory(userId);
    res.json(history);
  } catch (error: any) {
    log("ERROR", "Failed to fetch user history", { error: error.message });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @route PATCH /api/venues/:id
 * @desc Update general venue information (Listing management)
 */
v1Router.patch(
  "/venues/:id",
  verifyToken,
  requireVenueAccess("manager"),
  vibeNormalizer,
  async (req, res) => {
    const { id } = req.params;
    const validation = VenueUpdateSchema.safeParse(req.body.updates);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid updates data",
        details: validation.error.format(),
      });
    }
    const updates = validation.data as any;
    const requestingUserId = (req as any).user.uid;

    try {
      const { updateVenue } = await import("./venueService.js");
      const result = await updateVenue(id, updates, requestingUserId);
      res.json(result);
    } catch (error: any) {
      log("ERROR", "Failed to update venue listing", {
        venueId: id,
        error: error.message,
      });
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  },
);

/**
 * @route POST /api/venues/:id/sync-google
 * @desc Sync venue details with Google Places API
 */
v1Router.post(
  "/venues/:id/sync-google",
  verifyToken,
  requireVenueAccess("manager"),
  async (req, res) => {
    const { id } = req.params;
    const { googlePlaceId } = req.body;
    try {
      const { syncVenueWithGoogle } = await import("./venueService.js");
      const result = await syncVenueWithGoogle(id, googlePlaceId);
      res.json(result);
    } catch (error: any) {
      log("ERROR", "Failed to sync venue with Google", {
        venueId: id,
        error: error.message,
      });
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  },
);

/**
 * @route GET /api/venues/check-claim
 * @desc Check if a venue is already claimed by Google Place ID
 */
v1Router.get("/venues/check-claim", async (req, res) => {
  const { googlePlaceId } = req.query;
  if (!googlePlaceId) {
    return res.status(400).json({ error: "Missing googlePlaceId parameter" });
  }
  try {
    const { checkVenueClaimStatus } = await import("./venueService.js");
    const status = await checkVenueClaimStatus(googlePlaceId as string);
    res.json(status);
  } catch (error: any) {
    log("ERROR", "Check Claim Failed", { error: error.message });
    res.status(500).json({ error: "Failed to check claim status" });
  }
});

/**
 * @route GET /api/venues/:id/pulse
 * @desc Get real-time pulse score
 */
v1Router.get("/venues/:id/pulse", async (req, res) => {
  const { id } = req.params;
  try {
    const { getVenuePulse } = await import("./venueService.js");
    const pulse = await getVenuePulse(id);
    res.json({ pulse });
  } catch (error: any) {
    log("ERROR", "Failed to fetch venue pulse", {
      venueId: id,
      error: error.message,
    });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @route GET /api/venues/:id/insights
 * @desc Fetch proactive AI insights for a venue
 */
v1Router.get(
  "/venues/:id/insights",
  verifyToken,
  requireVenueAccess("manager"),
  async (req, res) => {
    const { id } = req.params;
    try {
      const { generateVenueInsights } = await import("./venueService.js");
      const insights = await generateVenueInsights(id);
      res.json(insights);
    } catch (error: any) {
      log("ERROR", "Failed to fetch venue insights", {
        venueId: id,
        error: error.message,
      });
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

/**
 * [SECURITY] Zero-Trust Private Data Endpoints
 */

/**
 * @route GET /api/venues/:id/private
 * @desc Fetch sensitive partner data (Margins, Strategy)
 */
v1Router.get(
  "/venues/:id/private",
  verifyToken,
  requireVenueAccess("manager"),
  async (req, res) => {
    const { id } = req.params;
    try {
      const { getVenuePrivateData } = await import("./venueService.js");
      const data = await getVenuePrivateData(id);
      res.json(data);
    } catch (error: any) {
      log("ERROR", "Failed to fetch venue private data", {
        venueId: id,
        error: error.message,
      });
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

/**
 * @route PATCH /api/venues/:id/private
 * @desc Update sensitive partner data
 */
v1Router.patch(
  "/venues/:id/private",
  verifyToken,
  requireVenueAccess("manager"),
  async (req, res) => {
    const { id } = req.params;
    try {
      const { updateVenuePrivateData } = await import("./venueService.js");
      const result = await updateVenuePrivateData(id, req.body);
      res.json(result);
    } catch (error: any) {
      log("ERROR", "Failed to update venue private data", {
        venueId: id,
        error: error.message,
      });
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

/**
 * @route POST /api/partners/onboard
 * @desc Claim a venue and sync with Google
 */
v1Router.post("/partners/onboard", verifyToken, async (req: any, res) => {
  const validation = VenueOnboardSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: "Invalid onboarding data",
      details: validation.error.format(),
    });
  }
  const { googlePlaceId } = validation.data;

  try {
    const { onboardVenue } = await import("./venueService.js");
    const result = await onboardVenue(
      googlePlaceId,
      req.user.uid,
      req.user.role,
    );
    res.json(result);
  } catch (error: any) {
    log("ERROR", "Failed to onboard partner venue", {
      googlePlaceId,
      userId: req.user.uid,
      role: req.user.role,
      error: error.message,
    });
    res.status(400).json({ error: error.message || "Internal Server Error" });
  }
});

/**
 * @route POST /api/partners/verify/phone/call
 * @desc Initiate a verification call
 */
v1Router.post(
  "/partners/verify/phone/call",
  verifyToken,
  async (req: any, res) => {
    const { venueId, phoneNumber, venueName } = req.body;
    if (!venueId || !phoneNumber || !venueName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const { VoiceService } = await import("./services/VoiceService.js");
      await VoiceService.initiateVerificationCall(
        venueId,
        phoneNumber,
        venueName,
      );
      res.json({ success: true, message: "Call initiated" });
    } catch (error: any) {
      log("ERROR", "Phone verification call failed", {
        venueId,
        error: error.message,
      });
      res.status(500).json({ error: "Failed to initiate call" });
    }
  },
);

/**
 * @route POST /api/partners/verify/phone/verify
 * @desc Verify the 4-digit code
 */
v1Router.post(
  "/partners/verify/phone/verify",
  verifyToken,
  async (req: any, res) => {
    const { venueId, code } = req.body;
    if (!venueId || !code) {
      return res.status(400).json({ error: "Missing venueId or code" });
    }

    try {
      const { VoiceService } = await import("./services/VoiceService.js");
      const isValid = await VoiceService.verifyPhoneCode(venueId, code);
      res.json({ success: isValid });
    } catch (error: any) {
      log("ERROR", "Phone code verification failed", {
        venueId,
        error: error.message,
      });
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

/**
 * @route POST /api/venue/auth/meta/exchange
 * @desc Exchange Meta OAuth code for long-lived tokens
 */
v1Router.post(
  "/venue/auth/meta/exchange",
  verifyToken,
  (req, res, next) => {
    // Map venueId from body to params for requireVenueAccess middleware
    if (req.body.venueId) req.params.id = req.body.venueId;
    next();
  },
  requireVenueAccess("owner"),
  async (req, res) => {
    const { code, venueId } = req.body;

    if (!code || !venueId) {
      return res.status(400).json({ error: "Code and venueId are required." });
    }

    try {
      const { MetaAuthService } = await import("./services/MetaAuthService.js");
      const result = await MetaAuthService.exchangeCode(code, venueId);
      res.json(result);
    } catch (error: any) {
      log("ERROR", "Meta OAuth Exchange Failed", {
        error: error.message,
        venueId,
      });
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  },
);

/**
 * @route PATCH /api/venues/:id/photos/:photoId
 * @desc Update photo approval status
 */
v1Router.patch(
  "/venues/:id/photos/:photoId",
  verifyToken,
  requireRole(["admin", "super-admin"]),
  async (req, res) => {
    const { id: venueId, photoId } = req.params;
    const { isApprovedForFeed, isApprovedForSocial } = req.body;

    try {
      const { updatePhotoStatus } = await import("./venueService.js");
      const result = await updatePhotoStatus(venueId, photoId, {
        isApprovedForFeed,
        isApprovedForSocial,
      });
      res.json(result);
    } catch (error: any) {
      log("ERROR", "Failed to update photo status", { error: error.message });
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

/**
 * @route GET /api/admin/bounties/pending
 * @desc Fetch all pending bounty submissions for review
 */
v1Router.get(
  "/admin/bounties/pending",
  verifyToken,
  requireRole(["admin", "super-admin"]),
  async (req, res) => {
    try {
      const { getPendingBounties } = await import("./venueService.js");
      const bounties = await getPendingBounties();
      res.json(bounties);
    } catch (error: any) {
      log("ERROR", "Failed to fetch pending bounties", {
        error: error.message,
      });
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

/**
 * @route POST /api/admin/bounties/:id/review
 * @desc Approve or reject a bounty submission
 */
v1Router.post(
  "/admin/bounties/:id/review",
  verifyToken,
  requireRole(["admin", "super-admin"]),
  async (req, res) => {
    const { id } = req.params;
    const validation = BountyReviewSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid review data",
        details: validation.error.format(),
      });
    }
    const { status } = validation.data;
    const reviewerId = (req as any).user.uid;

    try {
      const { reviewBounty } = await import("./venueService.js");
      const result = await reviewBounty(
        id,
        status as "APPROVED" | "REJECTED",
        reviewerId,
      );
      res.json(result);
    } catch (error: any) {
      log("ERROR", "Bounty review failed", {
        submissionId: id,
        error: error.message,
      });
      res.status(400).json({ error: error.message || "Internal Server Error" });
    }
  },
);

/**
 * @route GET /api/venues/:id/members
 * @desc Fetch all members of a venue
 */
v1Router.get(
  "/venues/:id/members",
  verifyToken,
  requireVenueAccess("manager"),
  async (req, res) => {
    const { id } = req.params;
    try {
      const { getVenueMembers } = await import("./venueService.js");
      const members = await getVenueMembers(id);
      res.json(members);
    } catch (error: any) {
      log("ERROR", "Failed to fetch venue members", {
        venueId: id,
        error: error.message,
      });
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

/**
 * @route POST /api/venues/:id/members
 * @desc Add a new member to a venue
 */
v1Router.post(
  "/venues/:id/members",
  verifyToken,
  requireVenueAccess("manager"),
  async (req, res) => {
    const { id } = req.params;
    const { email, role } = req.body;
    const requestingUserId = (req as any).user.uid;

    if (!email || !role) {
      return res.status(400).json({ error: "Missing email or role" });
    }

    try {
      const { addVenueMember } = await import("./venueService.js");
      const result = await addVenueMember(id, email, role, requestingUserId);
      res.json(result);
    } catch (error: any) {
      log("ERROR", "Failed to add venue member", {
        venueId: id,
        email,
        error: error.message,
      });
      res.status(400).json({ error: error.message });
    }
  },
);

/**
 * @route DELETE /api/venues/:id/members/:memberId
 * @desc Remove a member from a venue
 */
v1Router.delete(
  "/venues/:id/members/:memberId",
  verifyToken,
  requireVenueAccess("manager"),
  async (req, res) => {
    const { id: venueId, memberId } = req.params;
    const requestingUserId = (req as any).user.uid;

    try {
      const { removeVenueMember } = await import("./venueService.js");
      const result = await removeVenueMember(
        venueId,
        memberId,
        requestingUserId,
      );
      res.json(result);
    } catch (error: any) {
      log("ERROR", "Failed to remove venue member", {
        venueId,
        memberId,
        error: error.message,
      });
      res.status(400).json({ error: error.message });
    }
  },
);

/**
 * @route POST /api/client-errors
 * @desc Receive and log client-side errors
 */
v1Router.post("/client-errors", (req, res) => {
  const payload = req.body;
  log("ERROR", `CLIENT ERROR: ${payload.message}`, {
    ...payload,
    source: "client-collector",
  });
  res.status(204).send();
});

/**
 * @route GET /api/config/maps-key
 * @desc Get the restricted Google Maps BROWSER key for the frontend
 */
v1Router.get("/config/maps-key", (req, res) => {
  // Only return the browser key (public/restricted)
  const key = config.VITE_GOOGLE_BROWSER_KEY;

  if (!key)
    return res.status(500).json({ error: "Maps Browser Key not configured" });

  res.json({ key });
});

/**
 * @route GET /api/places/search
 * @desc Proxy for Google Places Autocomplete
 */
v1Router.get("/places/search", async (req, res) => {
  const { q, sessionToken } = req.query;
  if (!q) return res.json([]);
  try {
    const { getAutocompletePredictions } =
      await import("./utils/placesService.js");
    const predictions = await getAutocompletePredictions(
      q as string,
      sessionToken as string,
    );
    res.json(predictions);
  } catch (error: any) {
    logger.error("Places search failed", error);
    res.status(500).json({ error: "Places search failed" });
  }
});

/**
 * @route GET /api/places/details/:placeId
 * @desc Proxy for Google Places Details
 */
v1Router.get("/places/details/:placeId", async (req, res) => {
  const { placeId } = req.params;
  const { sessionToken } = req.query;
  try {
    const { getPlaceDetails } = await import("./utils/placesService.js");
    const details = await getPlaceDetails(placeId, sessionToken as string);
    if (!details) return res.status(404).json({ error: "Place not found" });
    res.json(details);
  } catch (error: any) {
    logger.error("Place details failed", error);
    res.status(500).json({ error: "Place details failed" });
  }
});

/**
 * @route PATCH /api/users/:uid
 * @desc Update user profile data with business logic (e.g. handle cooldown)
 */
v1Router.patch("/users/:uid", verifyToken, async (req, res) => {
  const { uid } = req.params;
  const requestingUser = (req as any).user;

  // Check if user is updating their own profile or is an admin
  if (
    requestingUser.uid !== uid &&
    requestingUser.role !== "super-admin" &&
    requestingUser.role !== "admin"
  ) {
    return res
      .status(403)
      .json({ error: "Forbidden: You can only update your own profile." });
  }

  const validation = UserUpdateSchema.safeParse(req.body);
  if (!validation.success) {
    log("WARNING", "[SYNC_DEBUG] Validation failed", {
      uid,
      errors: validation.error.format(),
      receivedBody: req.body,
    });
    return res.status(400).json({
      error: "Invalid update data",
      details: validation.error.format(),
    });
  }

  log("INFO", "[SYNC_DEBUG] Received valid update request", {
    uid,
    updates: validation.data,
  });

  const {
    handle,
    email,
    phone,
    favoriteDrink,
    favoriteDrinks,
    homeBase,
    playerGamePreferences,
    hasCompletedMakerSurvey,
    role,
    weeklyBuzz,
    showMemberSince,
  } = validation.data;

  try {
    const { db } = await import("./firebaseAdmin.js");
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (phone !== undefined) updates.phone = phone;
    if (favoriteDrink !== undefined) updates.favoriteDrink = favoriteDrink;
    if (favoriteDrinks !== undefined) updates.favoriteDrinks = favoriteDrinks;
    if (homeBase !== undefined) updates.homeBase = homeBase;
    if (playerGamePreferences !== undefined)
      updates.playerGamePreferences = playerGamePreferences;
    if (email !== undefined) updates.email = email;
    if (hasCompletedMakerSurvey !== undefined)
      updates.hasCompletedMakerSurvey = hasCompletedMakerSurvey;
    if (weeklyBuzz !== undefined) updates.weeklyBuzz = weeklyBuzz;
    if (showMemberSince !== undefined)
      updates.showMemberSince = showMemberSince;

    // [SECURITY REMEDIATION L-01] Role change lockdown
    if (role !== undefined) {
      if (
        requestingUser.role !== "super-admin" &&
        requestingUser.role !== "admin"
      ) {
        return res
          .status(403)
          .json({ error: "Forbidden: You cannot change your own role." });
      }
      updates.role = role;
    }

    // Handle cooldown logic
    if (handle !== undefined && handle !== userData?.handle) {
      const lastChanged = userData?.handleLastChanged || 0;
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      // Super-admins/Admin bypass
      const isPrivileged = userData?.role === "super-admin";

      if (now - lastChanged < thirtyDaysInMs && !isPrivileged) {
        const daysLeft = Math.ceil(
          (thirtyDaysInMs - (now - lastChanged)) / (24 * 60 * 60 * 1000),
        );
        return res
          .status(429)
          .json({ error: `Handle lock active. Wait ${daysLeft} days.` });
      }

      // [SECURITY] Reserve TheCommish handle
      if (handle.toLowerCase() === "@thecommish" && !isPrivileged) {
        return res.status(403).json({
          error: "This handle is reserved for League Administration.",
        });
      }

      updates.handle = handle;
      updates.handleLastChanged = now;
    }

    await userRef.update(updates);
    log("INFO", "User profile updated", { uid, updates });
    res.json({ success: true, updates });
  } catch (error: any) {
    log("ERROR", "Failed to update user profile", {
      uid,
      error: error.message,
    });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @route POST /api/admin/setup-super
 * @desc Promote a user to Super-Admin role (Secure established)
 */
v1Router.post("/admin/setup-super", async (req, res) => {
  const { email, secretKey, password } = req.body;
  const MASTER_KEY = process.env.MASTER_SETUP_KEY;

  if (!MASTER_KEY || secretKey !== MASTER_KEY) {
    log("WARNING", "[SECURITY] Invalid master setup attempt", {
      email,
      ip: req.ip,
    });
    return res.status(403).json({ error: "Invalid master setup key" });
  }

  try {
    const { db, auth } = await import("./firebaseAdmin.js");
    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch (error: any) {
      logger.error(`User ${email} not found in Auth`, error);
      return res
        .status(404)
        .json({ error: `User ${email} not found in Auth.` });
    }

    const uid = user.uid;

    // 1. Update Auth (Password if provided)
    if (password) {
      await auth.updateUser(uid, { password });
    }

    // 2. Update Firestore
    await db.collection("users").doc(uid).set(
      {
        role: "super-admin", // Legacy
        systemRole: "admin", // New RBAC
        isAdmin: true,
        status: "active",
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    log("INFO", "User promoted to Super-Admin", { uid, email });
    res.json({ success: true, message: `User ${email} is now a SUPER-ADMIN.` });
  } catch (error: any) {
    log("ERROR", "Super-Admin promotion failed", { error: error.message });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

v1Router.get("/activity/recent", async (req, res) => {
  try {
    const { db } = await import("./firebaseAdmin.js"); // Import db here
    const limit = parseInt(req.query.limit as string) || 20;
    const snapshot = await db
      .collection("activity_logs")
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(logs);
  } catch (error: any) {
    logger.error("Failed to fetch activity logs", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/events
 * @desc Fetch events (approved or user's own)
 */
v1Router.get("/events", async (req, res) => {
  const { venueId, status, includePast } = req.query;
  try {
    const { db } = await import("./firebaseAdmin.js");
    let query: any = db.collection("events");

    // To avoid composite index requirement, we'll do basic sorting here
    // and filter in memory since the dataset size is small.
    const snapshot = await query.orderBy("createdAt", "desc").limit(500).get();
    let events = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Memory Filtering
    if (venueId) {
      events = events.filter((e: any) => e.venueId === venueId);
    }
    if (status) {
      events = events.filter((e: any) => e.status === status);
    } else if (!venueId) {
      // Default public view: only approved
      events = events.filter((e: any) => e.status === "approved");
    }

    // Filtering out past events unless requested
    if (includePast !== "true" && !venueId) {
      const today = new Date().toISOString().split("T")[0];
      events = events.filter((e: any) => e.date >= today);
    }

    res.json(events);
  } catch (error: any) {
    logger.error("Failed to fetch events", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @route POST /api/events
 * @desc Submit an event (Public or Authenticated)
 */
v1Router.post("/events", identifyUser, verifyHoneypot, async (req, res) => {
  const validation = AppEventSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: "Invalid event data",
      details: validation.error.format(),
    });
  }

  try {
    const { db } = await import("./firebaseAdmin.js");
    const user = (req as any).user;

    // More robust auto-approval: Admin or Venue Manager
    const isTrusted =
      user &&
      (["admin", "super-admin"].includes(user.role) ||
        (["owner", "manager"].includes(user.role) &&
          (user.homeBase === validation.data.venueId ||
            (user.venueIds &&
              user.venueIds.includes(validation.data.venueId)))));

    const eventData = {
      ...validation.data,
      status: isTrusted ? "approved" : "pending",
      submittedBy: user?.uid || "guest",
      createdAt: Date.now(),
    };

    const docRef = await db.collection("events").add(eventData);
    log(
      "INFO",
      `[EVENT_SUBMITTED] Event ${docRef.id} received. Status: ${eventData.status}`,
    );
    res.json({ success: true, id: docRef.id });
  } catch (error: any) {
    log("ERROR", "Failed to submit event", { error: error.message });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @route PATCH /api/events/:id
 * @desc Manage event status or details
 */
v1Router.patch(
  "/events/:id",
  verifyToken,
  requireRole(["admin", "super-admin", "owner", "manager"]),
  async (req, res) => {
    const { id } = req.params;
    const { status, title, type, date, time, description } = req.body;

    try {
      const { db } = await import("./firebaseAdmin.js");
      const eventRef = db.collection("events").doc(id);
      const eventDoc = await eventRef.get();

      if (!eventDoc.exists) {
        return res.status(404).json({ error: "Event not found" });
      }

      const eventData = eventDoc.data();
      const user = (req as any).user;

      // AUTH CHECK: Must be admin or owner/manager of the venue
      if (user.role !== "admin" && user.role !== "super-admin") {
        const venueDoc = await db
          .collection("venues")
          .doc(eventData?.venueId)
          .get();
        const venue = venueDoc.data();
        if (
          venue?.ownerId !== user.uid &&
          !venue?.managerIds?.includes(user.uid)
        ) {
          return res.status(403).json({
            error:
              "Forbidden: You do not have permission to manage this venue's events.",
          });
        }
      }

      const updates: any = { updatedAt: Date.now() };
      if (status) updates.status = status;
      if (title) updates.title = title;
      if (type) updates.type = type;
      if (date) updates.date = date;
      if (time) updates.time = time;
      if (description) updates.description = description;

      await eventRef.update(updates);
      log("INFO", `[EVENT_UPDATED] Event ${id} updated status: ${status}`);

      // Trigger Media Distribution if status is 'approved' and it's a league event
      if (
        status === "approved" &&
        (updates.isLeagueEvent || eventData?.isLeagueEvent) &&
        (updates.distributeToMedia || eventData?.distributeToMedia)
      ) {
        try {
          const { MediaDistributionService } =
            await import("./services/MediaDistributionService.js");
          const fullEvent = { ...eventData, ...updates } as any;
          await MediaDistributionService.dispatchEvent(
            eventData?.venueId,
            fullEvent,
          );
          log("INFO", `[MEDIA_SYNC] Triggered distribution for event ${id}`);
        } catch (err: any) {
          log(
            "ERROR",
            "[MEDIA_SYNC_FAILED] Failed to dispatch event to media",
            { eventId: id, error: err.message },
          );
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      log("ERROR", "Failed to update event", {
        eventId: id,
        error: error.message,
      });
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

/**
 * @route DELETE /api/events/:id
 * @desc Remove an event
 */
v1Router.delete(
  "/events/:id",
  verifyToken,
  requireRole(["admin", "super-admin", "owner", "manager"]),
  async (req, res) => {
    const { id } = req.params;

    try {
      const { db } = await import("./firebaseAdmin.js");
      const eventRef = db.collection("events").doc(id);
      const eventDoc = await eventRef.get();

      if (!eventDoc.exists) {
        return res.status(404).json({ error: "Event not found" });
      }

      const eventData = eventDoc.data();
      const user = (req as any).user;

      // AUTH CHECK
      if (user.role !== "admin" && user.role !== "super-admin") {
        const venueDoc = await db
          .collection("venues")
          .doc(eventData?.venueId)
          .get();
        const venue = venueDoc.data();
        if (
          venue?.ownerId !== user.uid &&
          !venue?.managerIds?.includes(user.uid)
        ) {
          return res.status(403).json({
            error:
              "Forbidden: You do not have permission to delete this venue's events.",
          });
        }
      }

      await eventRef.delete();
      log("INFO", `[EVENT_DELETED] Event ${id} removed.`);
      res.json({ success: true });
    } catch (error: any) {
      log("ERROR", "Failed to delete event", {
        eventId: id,
        error: error.message,
      });
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

// --- ARTIE AI CHAT GATEWAY ---

/**
 * @route GET /api/ai/access-logs
 * @desc Fetch recent AI bot activity
 */
v1Router.get(
  "/ai/access-logs",
  verifyToken,
  requireRole(["admin", "super-admin"]),
  async (req, res) => {
    try {
      const { db } = await import("./firebaseAdmin.js");
      const snapshot = await db
        .collection("ai_access_logs")
        .orderBy("timestamp", "desc")
        .limit(50)
        .get();

      const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.json(logs);
    } catch (error: any) {
      log("ERROR", "Failed to fetch AI access logs", { error: error.message });
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

/**
 * @route GET /api/venues/:id/semantic
 * @desc Get Gemini-enriched semantic metadata for a venue
 */
v1Router.get("/venues/:id/semantic", async (req, res) => {
  const { id } = req.params;
  try {
    const { db } = await import("./firebaseAdmin.js");
    const venueDoc = await db.collection("venues").doc(id).get();
    if (!venueDoc.exists) {
      return res.status(404).json({ error: "Venue not found" });
    }
    const venue = venueDoc.data()!;

    // Dynamically import Gemini Service
    const { GeminiService } = await import("./services/geminiService.js");
    const gemini = new GeminiService(config.GOOGLE_GENAI_API_KEY);

    const prompt = `You are an SEO & AI Authority specialist for OlyBars.
        Analyze this venue and produce a structured semantic profile for AI agents.
        Venue: ${venue.name}
        Type: ${venue.venueType}
        Vibe: ${venue.vibe}
        Lore: ${venue.originStory}
        Insider: ${venue.insiderVibe}
        
        Output ONLY a JSON object with:
        "keywords": [top 5 niche keywords],
        "mood": [3 mood descriptors],
        "era": [dominant historical era signature],
        "botContext": [1-sentence summary for LLM ingestion]`;

    const response = await gemini.generateArtieResponse(
      "gemini-2.0-flash",
      [{ role: "user", parts: [{ text: prompt }] }],
      0.3,
    );

    const semanticData = JSON.parse(response || "{}");
    res.json(semanticData);
  } catch (error: any) {
    log("ERROR", "Semantic Enrichment Failed", {
      venueId: id,
      error: error.message,
    });
    res.status(500).json({ error: "Failed to enrich venue context." });
  }
});

/**
 * @route POST /api/ai/generate-description
 * @desc Generate an AI event description based on context
 */
v1Router.post("/ai/generate-description", async (req, res) => {
  const {
    venueId,
    type,
    date,
    time,
    title,
    description: existingDescription,
  } = req.body;

  if (!venueId || !type || !date || !time) {
    return res.status(400).json({
      error: "Missing required context fields (venueId, type, date, time).",
    });
  }

  try {
    const { db } = await import("./firebaseAdmin.js");
    const { KnowledgeService } = await import("./services/knowledgeService.js");
    const { GeminiService } = await import("./services/geminiService.js");

    // 1. Fetch Venue Data
    const venueDoc = await db.collection("venues").doc(venueId).get();
    if (!venueDoc.exists) {
      return res.status(404).json({ error: "Venue not found" });
    }
    const venue = venueDoc.data()!;

    // 2. Fetch Relevant Deals (Happy Hour/Flash Bountys)
    const deals = venue?.flashBounties || [];

    // 3. Get Knowledge Context (Holidays/Weather)
    let context;
    let foodAlignment = null;
    try {
      context = KnowledgeService.getEventContext(date);
      foodAlignment = KnowledgeService.getFoodOrHolidayAlignment(
        venue.venueType || "",
        date,
      );
    } catch (e) {
      log("WARNING", "Knowledge context failure", {
        date,
        error: (e as any).message,
      });
      context = {
        weatherOutlook: "Standard Olympia vibes.",
        isMajorHoliday: false,
      };
    }

    // 3.5 Extract City for Multi-City Support
    let city = "Olympia, WA";
    if (venue?.address) {
      try {
        // Robust Regex: Matches "City, ST" or "City, State"
        const cityMatch = venue.address.match(/,\s*([^,]+),\s*([A-Z]{2})/);
        if (cityMatch) {
          city = `${cityMatch[1].trim()}, ${cityMatch[2].trim()}`;
        } else {
          // Fallback to simpler split if regex fails
          const parts = venue.address.split(",");
          if (parts.length >= 3) {
            city = `${parts[1].trim()}, ${parts[2].trim().split(" ")[0]}`;
          }
        }
      } catch (error: any) {
        logger.warn("Address parsing failed", { address: venue.address, error: error.message });
      }
    }

    // 4. Generate with Artie (Schmidt Persona actually now)
    const gemini = new GeminiService(config.GOOGLE_GENAI_API_KEY);
    const description = await gemini.generateEventDescription({
      venueName: venue.name,
      venueType: venue.venueType,
      eventType: type,
      eventTitle: title,
      date,
      time,
      city,
      weather: context.weatherOutlook,
      holiday: context.holiday
        ? `${context.holiday}${foodAlignment ? ` (${foodAlignment})` : ""}`
        : foodAlignment || undefined,
      deals,
      originalDescription: existingDescription,
      venueLore: venue.insiderVibe || venue.description || venue.originStory,
      triviaHost: venue.triviaHost,
      triviaPrizes: venue.triviaPrizes,
      triviaSpecials: venue.triviaSpecials,
    });

    res.json({ description });
  } catch (error: any) {
    log("ERROR", "AI Description Generation Failed", {
      venueId,
      type,
      date,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: "Failed to generate description." });
  }
});

/**
 * @route POST /api/ai/analyze-event
 * @desc Analyze an event for quality and compliance
 */
v1Router.post("/ai/analyze-event", verifyToken, async (req, res) => {
  const event = req.body;

  if (!event || !event.title || !event.date) {
    return res
      .status(400)
      .json({ error: "Missing required event fields for analysis." });
  }

  try {
    const { GeminiService } = await import("./services/geminiService.js");
    const gemini = new GeminiService(config.GOOGLE_GENAI_API_KEY);

    const analysis = await gemini.analyzeEvent(event);
    res.json(analysis);
  } catch (error: any) {
    log("ERROR", "Event Analysis Failed", { error: error.message });
    res.status(500).json({ error: "Failed to analyze event." });
  }
});

/**
 * @route POST /api/vision/analyze-flyer
 * @desc Extract event details from an architectural image/flyer
 */
v1Router.post("/vision/analyze-flyer", verifyToken, async (req, res) => {
  const { base64Image, contextDate } = req.body;

  if (!base64Image) {
    return res.status(400).json({ error: "Missing base64Image payload." });
  }

  try {
    const { GeminiService } = await import("./services/geminiService.js");
    const gemini = new GeminiService();

    // Convert base64 to Buffer
    const buffer = Buffer.from(base64Image, "base64");

    const result = await gemini.parseFlyerContent(
      buffer,
      contextDate || new Date().toISOString(),
    );
    res.json(result);
  } catch (error: any) {
    log("ERROR", "Vision Flyer Analysis Failed", { error: error.message });
    res.status(500).json({ error: "Schmidt failed to read the flyer." });
  }
});

/**
 * @route POST /api/ai/generate-press-release
 * @desc Generate a professional press release for media distribution
 */
v1Router.post("/ai/generate-press-release", verifyToken, async (req, res) => {
  const { venueId, eventTitle, eventDate, eventTime, eventDescription } =
    req.body;

  if (!venueId || !eventTitle) {
    return res
      .status(400)
      .json({ error: "Venue information and Event Title are required." });
  }

  try {
    const { db } = await import("./firebaseAdmin.js");
    const { GeminiService } = await import("./services/geminiService.js");

    const venueDoc = await db.collection("venues").doc(venueId).get();
    const venueData = venueDoc.data() || { name: "Local Venue" };

    const gemini = new GeminiService();
    const prompt = `You are Artie, the Press Agent for OlyBars.
        Draft a professional, AP-style press release for the following event:
        Venue: ${venueData.name} (${venueData.address || "Olympia, WA"})
        Event: ${eventTitle}
        Date: ${eventDate}
        Time: ${eventTime}
        Description: ${eventDescription}
        
        Guidelines:
        - Include "FOR IMMEDIATE RELEASE" at the top.
        - Use a compelling headline.
        - Ensure a professional tone suitable for local news outlets.
        - Mention OlyBars.com as the source.
        
        Output ONLY the text of the press release.`;

    const pressRelease = await gemini.generateArtieResponse(
      "gemini-2.0-flash",
      [{ role: "user", parts: [{ text: prompt }] }],
      0.4,
    );

    res.json({ pressRelease });
  } catch (error: any) {
    log("ERROR", "Press Release Generation Failed", { error: error.message });
    res.status(500).json({ error: "Failed to draft press release." });
  }
});

/**
 * @route POST /api/ai/generate-event-copy
 * @desc Generate creative marketing copy for an event
 */
v1Router.post("/ai/generate-event-copy", verifyToken, async (req, res) => {
  const { draft, venueId, vibe } = req.body;

  if (!draft || !venueId) {
    return res.status(400).json({ error: "Draft and VenueId are required." });
  }

  try {
    const { db } = await import("./firebaseAdmin.js");
    const { GeminiService } = await import("./services/geminiService.js");

    const venueDoc = await db.collection("venues").doc(venueId).get();
    const venueData = venueDoc.data() || { name: "Local Venue" };

    const gemini = new GeminiService();
    const copy = await gemini.generateEventCopy(draft, venueData, vibe);

    res.json({ copy });
  } catch (error: any) {
    log("ERROR", "Creative Copy Generation Failed", { error: error.message });
    res.status(500).json({ error: "Failed to generate creative copy." });
  }
});

/**
 * @route POST /api/utils/send-email
 * @desc Dispatch an email (Internal Utility)
 */
v1Router.post("/utils/send-email", verifyToken, async (req, res) => {
  const { to, subject, body, fromName } = req.body;

  if (!to || !subject || !body) {
    return res
      .status(400)
      .json({ error: "Recipients, Subject, and Body are required." });
  }

  try {
    // Log the dispatch (Simulating real mailer)
    console.log(`\n📧 --- BACKEND EMAIL DISPATCH ---`);
    console.log(`From: ${fromName || "OlyBars Admin"}`);
    console.log(`To: ${Array.isArray(to) ? to.join(", ") : to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${body}`);
    console.log(`----------------------------------\n`);

    // Real implementation would use SendGrid or similar here
    res.json({ success: true, message: "Email dispatched successfully." });
  } catch (error: any) {
    log("ERROR", "Email Dispatch Failed", { error: error.message });
    res.status(500).json({ error: "Failed to send email." });
  }
});

// --- PARTNERS SCRAPER API ---
const partnersRouter = express.Router();
v1Router.use("/partners", partnersRouter);

partnersRouter.get("/scrapers", verifyToken, requireVenueAccess("manager"), async (req, res) => {
  const venueId = req.query.venueId as string;
  if (!venueId) return res.status(400).json({ error: "venueId required" });
  try {
    const scrapers = await ScraperService.listScrapers(venueId);
    res.json(scrapers);
  } catch (e: any) {
    log("ERROR", "Failed to list scrapers", { error: e?.message });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

partnersRouter.post("/scrapers", verifyToken, requireVenueAccess("manager"), async (req, res) => {
  const { venueId, ...data } = req.body;
  if (!venueId) return res.status(400).json({ error: "venueId required" });
  try {
    const id = await ScraperService.createScraper({ ...data, venueId });
    res.json({ id });
  } catch (e: any) {
    log("ERROR", "Failed to create scraper", { error: e?.message });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

partnersRouter.put("/scrapers/:id", verifyToken, requireVenueAccess("manager"), async (req, res) => {
  const { id } = req.params;
  const { venueId, ...updates } = req.body;
  if (!venueId) return res.status(400).json({ error: "venueId required" });
  try {
    await ScraperService.updateScraper(venueId, id, updates);
    res.json({ success: true });
  } catch (e: any) {
    log("ERROR", "Failed to update scraper", { error: e?.message });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

partnersRouter.delete("/scrapers/:id", verifyToken, requireVenueAccess("manager"), async (req, res) => {
  const { id } = req.params;
  const { venueId } = req.body; // or query param if DELETE body not supported effectively?
  // DELETE requests should ideally have venueId in query param or body. Axios supports body.
  // If not, use query.
  const vId = venueId || req.query.venueId as string;

  if (!vId) return res.status(400).json({ error: "venueId required" });
  try {
    await ScraperService.deleteScraper(vId, id);
    res.json({ success: true });
  } catch (e: any) {
    log("ERROR", "Failed to delete scraper", { error: e?.message });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

partnersRouter.post("/scrapers/:id/run", verifyToken, requireVenueAccess("manager"), async (req, res) => {
  const { id } = req.params;
  const { venueId } = req.body;
  if (!venueId) return res.status(400).json({ error: "venueId required" });
  try {
    const result = await ScraperService.reserveQuotaAndCreateRun(venueId, id, "MANUAL");
    if (!result.allowed) {
      return res.status(402).json({ error: result.reason || "Quota Exceeded" });
    }
    await enqueueScraperRun(result.runId);
    res.json(result);
  } catch (e: any) {
    log("ERROR", "Failed to run scraper", { error: e?.message });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- INTERNAL SERVICES (Worker / Scheduler) ---
const internalRouter = express.Router();
internalRouter.use(express.json());

// [SECURITY] Lock down internal routes to OIDC-authenticated service accounts only
import { verifyInternalOidc } from "./middleware/verifyInternalOidc.js";
internalRouter.use(verifyInternalOidc);

// 1. Cloud Scheduler Tick (Every 15 min)
internalRouter.get("/scheduler/tick", async (req, res) => {
  try {
    await SchedulerService.tick();
    res.json({ success: true });
  } catch (e: any) {
    log("ERROR", "Scheduler Tick Failed", { error: e?.message });
    res.status(500).json({ error: e?.message });
  }
});

// 2. Cloud Task Worker (Scraper Run Execution)
internalRouter.post("/tasks/run", async (req, res) => {
  const { runId } = req.body;
  const retryCount = parseInt((req.headers["x-cloudtasks-taskretrycount"] as string) || "0");

  try {
    if (!runId) return res.status(400).json({ error: "Missing runId" });

    const result = await WorkerService.executeRun(runId, retryCount);

    if (result.status === "SUCCESS") {
      res.json({ success: true });
    } else if (result.status === "RETRYABLE_ERROR") {
      // Signal Cloud Tasks to retry (HTTP 429 or 503)
      // We can also check retryAfter logic if we want to enforce backoff, 
      // but Cloud Tasks queue config handles basic backoff.
      log("WARN", "Worker Retryable Error", { runId, reason: result.reason });
      res.status(429).json({ error: result.reason, retry: true });
    } else {
      // Terminal Error - Acknowledge task to stop retries
      log("ERROR", "Worker Terminal Error", { runId, reason: result.reason });
      res.status(200).json({ success: false, error: result.reason }); // 200 to ACK and stop retry
    }
  } catch (e: any) {
    log("ERROR", "Worker Uncaught Failed", { error: e?.message });
    // If it's an unexpected crash, return 500 so Cloud Tasks retries it as a 'system failure'
    res.status(500).json({ error: e?.message });
  }
});

internalRouter.get("/scheduler/tick", async (req, res) => {
  try {
    await SchedulerService.tick();
    res.json({ success: true });
  } catch (e: any) {
    log("ERROR", "Scheduler Tick Failed", { error: e?.message });
    res.status(500).json({ error: e?.message });
  }
});

// --- MOUNT ROUTERS ---
app.use("/api/v1", v1Router);
app.use("/api/v2", v2Router);
app.use("/api", v1Router); // Fallback for legacy frontend

// Flash Bounty Activator (Lazy Cron)
setInterval(async () => {
  try {
    const { syncFlashBounties } = await import("./venueService.js");
    await syncFlashBounties();
  } catch (e) {
    console.error("[ACTIVATOR] Failed to sync Flash Bountys:", e);
  }
}, 60000); // Check every minute

/**
 * @route POST /api/ai/generate-copy
 * @desc Generate creative copy for events
 */
v1Router.post("/ai/generate-copy", verifyToken, async (req, res) => {
  // ... existing implementation if any or placeholder
  // The plan didn't specify modifying this, but checking consistency.
  // Actually, VenueOpsService.generateEventCopy calls /api/ai/generate-event-copy
  // Let's stick to the plan: Add /api/ai/generate-image
  res.status(501).json({ error: "Not implemented yet" });
});

/**
 * @route POST /api/ai/generate-image
 * @desc Generate an image using Vertex AI Imagen 3
 */
v1Router.post(
  "/ai/generate-image",
  verifyToken,
  requireVenueAccess("manager"),
  async (req, res) => {
    const validation = GenerateImageSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid generation data",
        details: validation.error.format(),
      });
    }
    const { prompt, venueId } = validation.data;

    try {
      const { GeminiService } = await import("./services/geminiService.js");
      const gemini = new GeminiService();
      const imageUrl = await gemini.generateImage(prompt, venueId);

      log("INFO", "Image Generated Successfully", {
        venueId,
        promptLength: prompt.length,
      });
      res.json({ success: true, imageUrl });
    } catch (error: any) {
      log("ERROR", "Image Generation Failed", {
        venueId,
        error: error.message,
      });
      res
        .status(500)
        .json({ error: "Image generation failed. Please try again." });
    }
  },
);

app.listen(Number(port), "0.0.0.0", () => {
  const isCloudRun = !!process.env.K_SERVICE;
  console.log(`\n🚀 OLYBARS BACKEND LISTENING ON PORT ${port}`);
  console.log(`🌍 Environment: ${config.NODE_ENV}`);
  console.log(
    `☁️ Platform: ${isCloudRun ? "Cloud Run (Production)" : "Local"}`,
  );
  console.log(`🛡️ Rate Limiting: Active`);
  console.log(`🎯 Target Project: ${config.GOOGLE_CLOUD_PROJECT}`);
  console.log(
    `🗺️ Maps Key Configured: ${config.VITE_GOOGLE_BROWSER_KEY ? "YES ✅" : "NO ❌"}`,
  );
});

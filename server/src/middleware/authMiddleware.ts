import { Request, Response, NextFunction } from "express";
import { auth, db, appCheck } from "../firebaseAdmin.js";
import { config } from "../appConfig/config.js";
import { RequestContext } from "../utils/context.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
    systemRole?: string;
    isAdmin?: boolean;
    homeBase?: string;
    venuePermissions?: Record<string, string>;
  };
  appCheck?: any;
}

/**
 * Middleware to verify Firebase App Check token
 */
export const verifyAppCheck = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const appCheckToken = req.header("X-Firebase-AppCheck");

  if (!appCheckToken && process.env.NODE_ENV === "production") {
    return res
      .status(401)
      .json({ error: "Unauthorized: Missing App Check token" });
  }

  if (!appCheckToken) {
    return next(); // Skip in development if no token
  }

  try {
    await appCheck.verifyToken(appCheckToken);
    next();
  } catch (error) {
    console.error("App Check verification failed:", error);
    return res
      .status(401)
      .json({ error: "Unauthorized: Invalid App Check token" });
  }
};

/**
 * Middleware to verify Firebase ID Token and attach user info to request
 */
export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn(`[AUTH] 401: No token provided in header. URL: ${req.url}`);
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    console.log(
      `[AUTH] Verifying token (First 10 chars: ${idToken.substring(0, 10)}...)`,
    );
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email, role: claimRole, isAdmin: claimIsAdmin } = decodedToken;

    console.log(
      `[AUTH] Token verified for ${email} (${uid}). Role claim: ${claimRole}`,
    );

    // [HARDENED] Validate Audience to prevent Cross-Project/Emulator Drift
    // Note: verifyIdToken does this, but we enforce it against our specific config source of truth.
    // [FIX] In emulator mode, 'aud' might match the firebase project id instead of the GCP project id
    const isEmulator = !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
    if (!isEmulator && decodedToken.aud !== config.GOOGLE_CLOUD_PROJECT) {
      console.error(
        `[AUTH_CRITICAL] Project ID Mismatch! Token aud: ${decodedToken.aud}, Config: ${config.GOOGLE_CLOUD_PROJECT}`,
      );
      return res
        .status(401)
        .json({ error: "Unauthorized: Project ID Mismatch" });
    }

    if (!uid || !email) {
      console.error("[AUTH_DEBUG] Missing UID or Email in decoded token:", {
        uid,
        email,
      });
      return res.status(401).json({ error: "Unauthorized: Invalid payload" });
    }

    // Priority 1 - Custom Claims
    if (claimRole) {
      console.log(
        `[AUTH] Using custom claims for ${email}. Global Role: ${claimRole}`,
      );
      // Even with claims, we might need venuePermissions from Firestore if not present in claims
      // (Claims have a 1000 byte limit, so venuePermissions are often stored in Firestore)
      const userDoc = await db.collection("users").doc(uid).get();
      const userData = userDoc.data();

      req.user = {
        uid,
        email,
        role: (claimRole as string) || userData?.role || "user",
        isAdmin: !!claimIsAdmin || !!userData?.isAdmin,
        venuePermissions: userData?.venuePermissions || {},
      };

      // [OBSERVABILITY] Propagate to context
      RequestContext.update({ userId: uid });

      return next();
    }

    // Priority 2 - Fallback to Firestore (Transition Period)
    console.warn(
      `[Auth] Fallback to Firestore for ${email} (Missing Custom Claims)`,
    );
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      console.warn(`[AUTH_DEBUG] User document for ${uid} DOES NOT EXIST.`);
    }

    const userData = userDoc.data();

    req.user = {
      uid,
      email,
      role: userData?.role || "user",
      systemRole: userData?.systemRole || "user",
      isAdmin: !!userData?.isAdmin,
      venuePermissions: userData?.venuePermissions || {},
    };

    console.log(`[AUTH_DEBUG] Final Request User:`, req.user);

    next();
  } catch (error: any) {
    console.error("[Auth] Error verifying token:", {
      error: error.message,
      code: error.code,
      projectId: config.GOOGLE_CLOUD_PROJECT,
      hasEmulator: !!process.env.FIREBASE_AUTH_EMULATOR_HOST,
      emulatorHost: process.env.FIREBASE_AUTH_EMULATOR_HOST,
    });
    return res
      .status(401)
      .json({ error: "Unauthorized: Invalid token", details: error.message });
  }
};

/**
 * Middleware to identify user if token is provided (non-blocking)
 */
export const identifyUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email, role: claimRole, isAdmin: claimIsAdmin } = decodedToken;

    if (claimRole) {
      req.user = {
        uid,
        email,
        role: claimRole as string,
        isAdmin: !!claimIsAdmin,
      };

      // [OBSERVABILITY] Propagate to context
      RequestContext.update({ userId: uid });

      return next();
    }

    // Fallback for identification
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();

    req.user = {
      uid,
      email,
      role: userData?.role || "user",
      systemRole: userData?.systemRole || "user",
      isAdmin: !!userData?.isAdmin,
      homeBase: userData?.homeBase,
    };
  } catch {
    // Silently fail to continue as guest
  }
  next();
};

/**
 * Middleware to restrict access based on venue-specific permissions
 * Checks:
 * 1. Admin/Super-Admin status (Master Key)
 * 2. venuePermissions on the User document
 * 3. venueId matching in query or params
 */
export const requireVenueAccess = (
  minRole: "owner" | "manager" | "staff" = "staff",
) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    const user = req.user;
    if (!user) {
      console.warn(
        `[AUTH] requireVenueAccess(${minRole}) failed: No user on request for ${req.method} ${req.url}. Ensure verifyToken is in the middleware chain.`,
      );
      return res
        .status(401)
        .json({ error: "Unauthorized: Auth session missing" });
    }

    // Admin Bypass (Enhanced for System Admin)
    if (
      user.role === "admin" ||
      user.role === "super-admin" ||
      user.systemRole === "admin" ||
      user.isAdmin
    )
      return next();

    // Detect venueId from request
    const venueId = (req.params.id ||
      req.params.venueId ||
      req.query.venueId) as string;
    if (!venueId) {
      console.warn(
        "[AUTH] requireVenueAccess failed: venueId missing from request",
      );
      return res.status(400).json({ error: "venueId is required" });
    }

    // Check user document's venuePermissions
    const userRole = user.venuePermissions?.[venueId];

    const roleHierarchy = { owner: 3, manager: 2, staff: 1 };
    const userScore = userRole
      ? roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
      : 0;
    const requiredScore = roleHierarchy[minRole];

    if (userScore >= requiredScore) return next();

    // Fallback: Check the Venue document itself (for legacy ownerId/managerIds)
    try {
      const venueDoc = await db.collection("venues").doc(venueId).get();
      if (!venueDoc.exists)
        return res.status(404).json({ error: "Venue not found" });

      const venueData = venueDoc.data();
      const isOwner = venueData?.ownerId === user.uid;
      const isManager = venueData?.managerIds?.includes(user.uid);

      console.log(
        `[AUTH] Checking legacy permissions for ${user.uid} on ${venueId}: owner=${isOwner}, manager=${isManager}`,
      );

      if (minRole === "staff" && (isOwner || isManager)) return next();
      if (minRole === "manager" && (isOwner || isManager)) return next();
      if (minRole === "owner" && isOwner) return next();
    } catch (e) {
      console.error("Venue access check failed:", e);
    }

    console.warn(
      `[AUTH] requireVenueAccess denied: ${user.uid} lacks ${minRole} for ${venueId}. Has role: ${userRole}`,
    );
    return res.status(403).json({
      error: `Forbidden: Insufficient permissions for venue ${venueId}`,
    });
  };
};

/**
 * Middleware to restrict access to specific roles
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (
      !req.user ||
      (!roles.includes(req.user.role || "") &&
        !roles.includes(req.user.systemRole || ""))
    ) {
      return res
        .status(403)
        .json({ error: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};

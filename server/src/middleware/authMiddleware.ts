import { Request, Response, NextFunction } from 'express';
import { auth, db, appCheck } from '../firebaseAdmin.js';

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
export const verifyAppCheck = async (req: Request, res: Response, next: NextFunction) => {
    const appCheckToken = req.header('X-Firebase-AppCheck');

    if (!appCheckToken && process.env.NODE_ENV === 'production') {
        return res.status(401).json({ error: 'Unauthorized: Missing App Check token' });
    }

    if (!appCheckToken) {
        return next(); // Skip in development if no token
    }

    try {
        await appCheck.verifyToken(appCheckToken);
        next();
    } catch (error) {
        console.error('App Check verification failed:', error);
        return res.status(401).json({ error: 'Unauthorized: Invalid App Check token' });
    }
};

/**
 * Middleware to verify Firebase ID Token and attach user info to request
 */
export const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        const { uid, email, role: claimRole, isAdmin: claimIsAdmin } = decodedToken;

        // Optimization: Priority 1 - Custom Claims (No Read)
        if (claimRole) {
            req.user = {
                uid,
                email,
                role: (claimRole as string),
                isAdmin: !!claimIsAdmin,
                venuePermissions: {} // Will be hydrated if needed by requireVenueAccess
            };
            return next();
        }

        // Priority 2 - Fallback to Firestore (Transition Period)
        console.warn(`[Auth] Fallback to Firestore for ${email} (Missing Custom Claims)`);
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.data();

        req.user = {
            uid,
            email,
            role: userData?.role || 'user',
            systemRole: userData?.systemRole || 'user',
            isAdmin: !!userData?.isAdmin,
            venuePermissions: userData?.venuePermissions || {}
        };

        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

/**
 * Middleware to identify user if token is provided (non-blocking)
 */
export const identifyUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        const { uid, email, role: claimRole, isAdmin: claimIsAdmin } = decodedToken;

        if (claimRole) {
            req.user = {
                uid,
                email,
                role: (claimRole as string),
                isAdmin: !!claimIsAdmin
            };
            return next();
        }

        // Fallback for identification
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.data();

        req.user = {
            uid,
            email,
            role: userData?.role || 'user',
            systemRole: userData?.systemRole || 'user',
            isAdmin: !!userData?.isAdmin,
            homeBase: userData?.homeBase
        };
    } catch (error) {
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
export const requireVenueAccess = (minRole: 'owner' | 'manager' | 'staff' = 'staff') => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const user = req.user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        // Admin Bypass (Enhanced for System Admin)
        if (user.role === 'admin' || user.role === 'super-admin' || user.systemRole === 'admin' || user.isAdmin) return next();

        // Detect venueId from request
        const venueId = (req.params.id || req.params.venueId || req.query.venueId) as string;
        if (!venueId) return res.status(400).json({ error: 'venueId is required' });

        // Check user document's venuePermissions
        const userRole = user.venuePermissions?.[venueId];

        const roleHierarchy = { 'owner': 3, 'manager': 2, 'staff': 1 };
        const userScore = userRole ? (roleHierarchy[userRole as keyof typeof roleHierarchy] || 0) : 0;
        const requiredScore = roleHierarchy[minRole];

        if (userScore >= requiredScore) return next();

        // Fallback: Check the Venue document itself (for legacy ownerId/managerIds)
        try {
            const venueDoc = await db.collection('venues').doc(venueId).get();
            if (!venueDoc.exists) return res.status(404).json({ error: 'Venue not found' });

            const venueData = venueDoc.data();
            const isOwner = venueData?.ownerId === user.uid;
            const isManager = venueData?.managerIds?.includes(user.uid);

            if (minRole === 'staff' && (isOwner || isManager)) return next();
            if (minRole === 'manager' && (isOwner || isManager)) return next();
            if (minRole === 'owner' && isOwner) return next();

        } catch (e) {
            console.error('Venue access check failed:', e);
        }

        return res.status(403).json({ error: `Forbidden: Insufficient permissions for venue ${venueId}` });
    };
};

/**
 * Middleware to restrict access to specific roles
 */
export const requireRole = (roles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user || (!roles.includes(req.user.role || '') && !roles.includes(req.user.systemRole || ''))) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};


import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { Request, Response, NextFunction } from 'express';

// Initialize admin if not already (it might be in index.ts, but safe to check)
if (admin.apps.length === 0) {
    admin.initializeApp();
}

/**
 * Middleware to validate Firebase ID Token.
 * - Extracts token from 'Authorization: Bearer <token>'
 * - Decodes token to get uid and custom claims (role)
 * - Attaches user data to req.user
 */
export const validateFirebaseIdToken = async (req: Request, res: Response, next: NextFunction) => {
    logger.log('Check if request is authorized with Firebase ID token');

    if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
        !(req.cookies && req.cookies.__session)) {
        logger.info('No ID token found. Proceeding as Guest.');
        (req as any).user = { uid: null, role: 'guest' };
        next();
        return;
    }

    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        // Read the ID Token from the Authorization header.
        idToken = req.headers.authorization.split('Bearer ')[1];
    } else if (req.cookies) {
        // Read the ID Token from cookie.
        idToken = req.cookies.__session;
    } else {
        // Fallback (redundant safe guard)
        (req as any).user = { uid: null, role: 'guest' };
        next();
        return;
    }

    try {
        const decodedIdToken = await admin.auth().verifyIdToken(idToken);
        // Attach user to request
        (req as any).user = decodedIdToken;
        next();
    } catch (error) {
        logger.error('Error while verifying Firebase ID token:', error);
        // If token is invalid (expired/bad), we deny access rather than fallback to guest
        // to prevent spoofing attempts or confusion.
        res.status(403).send('Unauthorized');
        return;
    }
};

/**
 * Helper to get Role from decoded token.
 * Defaults to 'guest' if not set.
 */
export const getUserRole = (decodedToken: admin.auth.DecodedIdToken): string => {
    return (decodedToken.role as string) || 'guest';
};

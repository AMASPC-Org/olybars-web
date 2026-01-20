import { Request, Response, NextFunction } from 'express';

/**
 * vibeNormalizer: Middleware to handle legacy 'DEAD' vibe signals.
 * "Project Toast" deprecates 'dead' in favor of 'mellow'.
 * This middleware ensures backward compatibility for older clients.
 */
export const vibeNormalizer = (req: Request, res: Response, next: NextFunction) => {
    // 1. Handle Vibe Check POST requests (req.body.status)
    if (req.body && typeof req.body.status === 'string') {
        if (req.body.status.toLowerCase() === 'dead') {
            req.body.status = 'mellow';
        }
    }

    // 2. Handle Venue Update PATCH requests (req.body.updates.status)
    if (req.body && req.body.updates && typeof req.body.updates.status === 'string') {
        if (req.body.updates.status.toLowerCase() === 'dead') {
            req.body.updates.status = 'mellow';
        }
    }

    // 3. Handle Direct Manual Status updates (req.body.updates.manualStatus)
    if (req.body && req.body.updates && typeof req.body.updates.manualStatus === 'string') {
        if (req.body.updates.manualStatus.toLowerCase() === 'dead') {
            req.body.updates.manualStatus = 'mellow';
        }
    }

    next();
};

export default vibeNormalizer;

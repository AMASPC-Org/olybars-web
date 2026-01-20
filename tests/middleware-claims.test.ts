import { vi, describe, it, expect, beforeEach } from 'vitest';
import { verifyToken } from '../server/src/middleware/authMiddleware.js';

// Mock Firebase Admin
const mockVerifyIdToken = vi.fn();
const mockGet = vi.fn();

vi.mock('../server/src/firebaseAdmin.js', () => ({
    auth: {
        verifyIdToken: (token: string) => mockVerifyIdToken(token)
    },
    db: {
        collection: () => ({
            doc: () => ({
                get: () => mockGet()
            })
        })
    }
}));

describe('authMiddleware - verifyToken', () => {
    let req: any;
    let res: any;
    let next: any;

    beforeEach(() => {
        req = {
            headers: {
                authorization: 'Bearer valid-token'
            }
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        next = vi.fn();
        vi.clearAllMocks();
    });

    it('should use roles from custom claims if present (0-read path)', async () => {
        mockVerifyIdToken.mockResolvedValue({
            uid: 'user123',
            email: 'test@example.com',
            role: 'super-admin',
            isAdmin: true
        });

        await verifyToken(req, res, next);

        expect(req.user).toEqual({
            uid: 'user123',
            email: 'test@example.com',
            role: 'super-admin',
            isAdmin: true,
            venuePermissions: {}
        });
        expect(mockGet).not.toHaveBeenCalled(); // Critical: No Firestore read
        expect(next).toHaveBeenCalled();
    });

    it('should fallback to Firestore if claims are missing', async () => {
        mockVerifyIdToken.mockResolvedValue({
            uid: 'user123',
            email: 'test@example.com'
            // No role or isAdmin claims
        });

        mockGet.mockResolvedValue({
            data: () => ({
                role: 'admin',
                systemRole: 'admin',
                isAdmin: true,
                venuePermissions: { 'venue1': 'owner' }
            })
        });

        await verifyToken(req, res, next);

        expect(req.user).toEqual({
            uid: 'user123',
            email: 'test@example.com',
            role: 'admin',
            systemRole: 'admin',
            isAdmin: true,
            venuePermissions: { 'venue1': 'owner' }
        });
        expect(mockGet).toHaveBeenCalled(); // Fallback read happened
        expect(next).toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
        mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

        await verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Invalid token' });
        expect(next).not.toHaveBeenCalled();
    });
});

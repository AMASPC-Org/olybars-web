import { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";
import { config } from "../appConfig/config.js";

const client = new OAuth2Client();

/**
 * Middleware to verify Google OIDC tokens for internal service-to-service communication.
 * Used for Cloud Scheduler and Cloud Tasks triggers.
 */
export const verifyInternalOidc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn(`[OIDC] Missing/Invalid Authorization Header: ${req.url}`);
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    // 1. Verify the token signature and issuer (accounts.google.com)
    // Cloud Tasks/Scheduler use the Service Account's email as the audience if specific audience not set?
    // Actually, traditionally we set the audience to the Service URL.
    // If we are on localhost, we might want to skip audience check or allow a specific one.

    // We expect the audience to be THIS service's URL.
    // If BACKEND_URL isn't set dynamically in Cloud Run, this might mismatch if we rely on config.BACKEND_URL.
    // However, the best practice is to check that the audience is INTENDED for us.
    // If we can't reliably know our own URL, we can check if it matches *one of* our expected audiences?
    // For now, let's strictly check against config.BACKEND_URL + /internal/... path OR just the host.
    // Actually, Cloud Tasks OIDC audience is usually just the root URL or the specific invocation URL.

    const audience = config.BACKEND_URL;

    // If verifyIdToken is called without 'audience', it allows any audience? No, it requires it.
    // We MUST specify the audience we expect.

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: audience, // This checks 'aud' claim
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error("Empty payload");
    }

    // 2. Verify Issuer
    if (payload.iss !== "https://accounts.google.com") {
      console.error(`[OIDC] Invalid Issuer: ${payload.iss}`);
      return res.status(401).json({ error: "Unauthorized: Invalid token issuer" });
    }

    // 3. Verify Email (Invoker Identity)
    // We only allow our own Service Account (or specific authorized invokers) to call these internal endpoints.
    // If SERVICE_ACCOUNT_EMAIL is set, we strictly enforce it.
    if (config.SERVICE_ACCOUNT_EMAIL && payload.email !== config.SERVICE_ACCOUNT_EMAIL) {
      console.error(`[OIDC] Email Mismatch. Expected: ${config.SERVICE_ACCOUNT_EMAIL}, Got: ${payload.email}`);
      return res.status(403).json({ error: "Forbidden: Unauthorized Service Account" });
    }

    // Attach info to request if needed (optional)
    (req as any).internalUser = payload;

    next();
  } catch (error: any) {
    console.error(`[OIDC] Verification Failed for ${req.url}:`, error.message);
    return res.status(401).json({ error: "Unauthorized: Token verification failed" });
  }
};

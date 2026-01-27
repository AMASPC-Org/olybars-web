import { auth } from "../lib/firebase";
import { setLastCorrelationId } from "./errorService";
import { BreadcrumbService } from "./breadcrumbService";

/**
 * Get headers with Firebase ID Token for authenticated requests
 */
export const getAuthHeaders = async (
  includeJson = true,
  forceRefresh = false,
) => {
  const headers: Record<string, string> = includeJson
    ? { "Content-Type": "application/json" }
    : {};

  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken(forceRefresh);
      headers["Authorization"] = `Bearer ${token}`;
      // Debug Log (Development only)
      if (import.meta.env.DEV) {
        console.debug(
          `[Auth] Generated token for ${user.email} (Refresh: ${forceRefresh})`,
        );
      }
    } catch (error) {
      console.error("[Auth] Failed to generate token:", error);
    }
  } else {
    console.warn("[Auth] getAuthHeaders called but no user is signed in.");
  }

  return headers;
};

/**
 * Global response interceptor to handle Auth failures and capture Correlation IDs
 */
export const checkResponse = async (response: Response) => {
  // 1. Capture Correlation ID for support/logs
  const correlationId = response.headers.get("x-correlation-id");
  if (correlationId) {
    setLastCorrelationId(correlationId);
  }

  // 2. Handle Auth Failures
  if (response.status === 401) {
    BreadcrumbService.add('SYSTEM', '401 Unauthorized detected');
    window.dispatchEvent(new CustomEvent("auth:session_expired"));
  }

  // 3. Track non-OK responses as breadcrumbs
  if (!response.ok) {
    BreadcrumbService.add('ERROR', `API Error: ${response.status} ${response.url}`, {
      status: response.status,
      correlationId
    });
  }

  return response;
};

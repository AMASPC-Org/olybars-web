import { auth } from "../lib/firebase";

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
 * Global response interceptor to handle Auth failures
 */
export const checkResponse = async (response: Response) => {
  if (response.status === 401) {
    console.warn(
      "[API] 401 Unauthorized detected. Dispatching session expiration.",
    );
    window.dispatchEvent(new CustomEvent("auth:session_expired"));
  }
  return response;
};

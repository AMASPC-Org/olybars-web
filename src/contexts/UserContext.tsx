import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getUserProfile } from "../services/userService";
import { UserProfile } from "../types";
import { SessionPurgeService } from "../services/SessionPurgeService";

interface UserContextType {
  userProfile: UserProfile;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem("oly_profile");
      if (!stored || stored === "null" || stored === "undefined") {
        return { uid: "guest", role: "guest" };
      }
      return JSON.parse(stored);
    } catch {
      return { uid: "guest", role: "guest" };
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // Sync profile to localStorage
  useEffect(() => {
    if (userProfile.uid === 'guest') {
      localStorage.removeItem("oly_profile");
    } else {
      localStorage.setItem("oly_profile", JSON.stringify(userProfile));
    }
  }, [userProfile]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // [HYDRATION] If we have a session but state is Guest OR stale, refresh it
        if (
          userProfile.uid === "guest" ||
          userProfile.uid !== firebaseUser.uid
        ) {
          try {
            const freshProfile = await getUserProfile(firebaseUser.uid);
            if (freshProfile) {
              // Apply Super Admin overrides if necessary (Ryan Rule)
              if (freshProfile.email === "ryan@amaspc.com") {
                freshProfile.role = "super-admin" as any;
                freshProfile.systemRole = "admin" as any;
              }
              setUserProfile(freshProfile);
            } else {
              // Minimal profile if Firestore sync hasn't happened yet
              setUserProfile({
                uid: firebaseUser.uid,
                role: "guest",
                email: firebaseUser.email || "",
              });
            }
          } catch (e) {
            console.error("[UserContext] Hydration failed:", e);
          }
        }
      } else {
        // [SANITIZATION] No session -> Revert to Guest
        if (localStorage.getItem("oly_profile")) {
          localStorage.removeItem("oly_profile");
        }

        if (userProfile.uid !== "guest") {
          setUserProfile({ uid: "guest", role: "guest" });
        }
      }
      setIsLoading(false);
    });

    // [INTERVENTION] Handle Session Expiry from API 401s
    const handleSessionExpiry = () => {
      console.warn("[UserContext] Session Expired Event Received. Signing out.");
      logout();
    };

    window.addEventListener("auth:session_expired", handleSessionExpiry);

    return () => {
      unsubscribe();
      window.removeEventListener("auth:session_expired", handleSessionExpiry);
    };
  }, [userProfile.uid]);

  const refreshProfile = async () => {
    if (auth.currentUser) {
      const fresh = await getUserProfile(auth.currentUser.uid);
      if (fresh) setUserProfile(fresh);
    }
  };

  const logout = async () => {
    await auth.signOut();
    SessionPurgeService.purgeSession('nuclear');
    setUserProfile({ uid: 'guest', role: 'guest' });
  };

  return (
    <UserContext.Provider
      value={{
        userProfile,
        isAuthenticated: userProfile.uid !== "guest",
        isLoading,
        setUserProfile,
        refreshProfile,
        logout
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

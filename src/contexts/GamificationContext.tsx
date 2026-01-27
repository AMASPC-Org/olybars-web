import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from './UserContext'; // Assuming UserContext is here
import {
  ClockInRecord,
  VibeCheckRecord,
  PointsReason,
  VenueStatus,
  GameStatus,
  Venue
} from '../types';
import { GAMIFICATION_CONFIG } from '../config/gamification';
import { logUserActivity, performVibeCheck, fetchUserRank, updateUserProfile } from '../services/userService';
import { generateArtieHook, VibeReceiptData } from '../features/social/services/VibeReceiptService';
import { useToast } from '../components/ui/BrandedToast';

interface GamificationContextType {
  userPoints: number;
  userRank: number | undefined;
  clockInHistory: ClockInRecord[];
  vibeCheckHistory: VibeCheckRecord[];
  awardPoints: (
    reason: PointsReason,
    venueId?: string,
    hasConsent?: boolean,
    verificationMethod?: "gps" | "qr",
    bonusPoints?: number,
    skipBackend?: boolean,
    venueStatus?: VenueStatus,
    overrideTotal?: number
  ) => void;
  handleVibeCheckSubmission: (
    venue: Venue,
    status: VenueStatus,
    hasConsent: boolean,
    photoUrl?: string,
    verificationMethod?: "gps" | "qr",
    gameStatus?: Record<string, GameStatus>,
    soberFriendlyCheck?: { isGood: boolean; reason?: string }
  ) => Promise<any>;
  currentReceipt: VibeReceiptData | null;
  addToClockInHistory: (record: ClockInRecord) => void;
  clearReceipt: () => void;
  // We could expose simple setters if needed, but actions are better
  setUserPoints: React.Dispatch<React.SetStateAction<number>>; // Exposed for edge cases if needed
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userProfile, setUserProfile } = useUser();
  const { showToast } = useToast();

  // --- STATE ---
  const [userPoints, setUserPoints] = useState(() =>
    parseInt(localStorage.getItem("oly_points") || "0"),
  );
  const [clockInHistory, setClockInHistory] = useState<ClockInRecord[]>(() =>
    JSON.parse(localStorage.getItem("oly_clockins") || "[]"),
  );
  const [vibeCheckHistory, setVibeCheckHistory] = useState<VibeCheckRecord[]>(
    () => JSON.parse(localStorage.getItem("oly_vibe_history") || "[]"),
  );
  const [userRank, setUserRank] = useState<number | undefined>(undefined);
  const [currentReceipt, setCurrentReceipt] = useState<VibeReceiptData | null>(null);

  const userId = userProfile?.uid || "guest_user_123";

  // --- EFFECTS ---
  useEffect(() => {
    const getRank = async () => {
      if (userProfile.uid !== "guest" && userPoints !== undefined) {
        const rank = await fetchUserRank(userPoints);
        setUserRank(rank);
      }
    };
    getRank();
  }, [userPoints, userProfile.uid]);

  useEffect(() => {
    if (userProfile.stats?.seasonPoints !== undefined) {
      setUserPoints(userProfile.stats.seasonPoints);
    }
  }, [userProfile.uid, userProfile.stats?.seasonPoints]);

  useEffect(() => {
    localStorage.setItem("oly_points", userPoints.toString());
  }, [userPoints]);

  useEffect(() => {
    localStorage.setItem("oly_clockins", JSON.stringify(clockInHistory));
  }, [clockInHistory]);

  useEffect(() => {
    localStorage.setItem("oly_vibe_history", JSON.stringify(vibeCheckHistory));
  }, [vibeCheckHistory]);


  // --- ACTIONS ---

  const awardPoints = (
    reason: PointsReason,
    venueId?: string,
    hasConsent?: boolean,
    verificationMethod?: "gps" | "qr",
    bonusPoints: number = 0,
    skipBackend: boolean = false,
    venueStatus?: VenueStatus,
    overrideTotal?: number,
  ) => {
    const { REWARDS, PIONEER_CURVE } = GAMIFICATION_CONFIG;
    let delta = 0;

    if (overrideTotal !== undefined) {
      delta = overrideTotal;
    } else if (reason === "clockin") {
      delta = venueStatus
        ? (PIONEER_CURVE as any)[venueStatus] || REWARDS.CLOCK_IN
        : REWARDS.CLOCK_IN;
    } else if (reason === "photo") {
      delta = REWARDS.VIBE_PHOTO;
    } else if (reason === "share" || reason === "social_share") {
      delta = 5;
    } else if (reason === "vibe") {
      delta = REWARDS.VIBE_REPORT;
      if (hasConsent) delta += REWARDS.MARKETING_CONSENT;
    }

    if (hasConsent && reason !== "vibe") {
      delta += REWARDS.MARKETING_CONSENT;
    }

    delta += bonusPoints;

    setUserPoints((prev) => prev + delta);

    if (reason === "vibe" && venueId) {
      const now = Date.now();
      setUserProfile((prev) => ({
        ...prev,
        lastGlobalVibeCheck: now,
        lastVibeChecks: {
          ...prev.lastVibeChecks,
          [venueId]: now,
        },
      }));
    }

    if (!skipBackend) {
      logUserActivity(userId, {
        type: reason,
        venueId,
        hasConsent,
        points: delta,
        verificationMethod,
      });
    }
  };

  const handleVibeCheckSubmission = async (
    venue: Venue,
    status: VenueStatus,
    hasConsent: boolean,
    photoUrl?: string,
    verificationMethod: "gps" | "qr" = "gps",
    gameStatus?: Record<string, GameStatus>,
    soberFriendlyCheck?: { isGood: boolean; reason?: string },
  ) => {

    // Calculate Game Bonus Points (Flat Rate)
    let gameBonus = 0;
    if (gameStatus && Object.keys(gameStatus).length > 0) {
      gameBonus = GAMIFICATION_CONFIG.REWARDS.GAME_REPORT_FLAT_BONUS;
    }

    let backendResult: any = null;
    try {
      backendResult = await performVibeCheck(
        venue.id,
        userProfile.uid,
        status,
        hasConsent,
        photoUrl,
        verificationMethod,
        gameStatus,
        soberFriendlyCheck,
      );
    } catch (err: any) {
      if (
        userProfile.uid === "guest" &&
        (err.status === 401 || err.status === 403)
      ) {
        throw err;
      }
      console.error("[OlyBars] Vibe Check Backend Error:", err);
      showToast("Vibe Check recorded offline (points may be delayed)", "info");
    }

    awardPoints(
      "vibe",
      venue.id,
      hasConsent,
      verificationMethod,
      gameBonus,
      userProfile.uid === "guest",
      undefined,
      backendResult?.pointsAwarded
    );

    // Generate Vibe Receipt logic is arguably presentation/alert logic,
    // but constructing the data is domain logic.
    const receipt: VibeReceiptData = {
      type: "vibe",
      venueName: venue.name,
      venueId: venue.id,
      pointsEarned:
        GAMIFICATION_CONFIG.REWARDS.VIBE_REPORT +
        (photoUrl ? GAMIFICATION_CONFIG.REWARDS.VIBE_PHOTO : 0) +
        (hasConsent ? GAMIFICATION_CONFIG.REWARDS.MARKETING_CONSENT : 0) +
        gameBonus,
      vibeStatus: status,
      artieHook: generateArtieHook("vibe", status, { gameBonus }),
      username: userProfile.handle || userProfile.displayName || "Member",
      userId: userProfile.uid,
      timestamp: new Date().toISOString(),
      metadata: {
        gameBonus,
        gamesUpdated: gameStatus ? Object.keys(gameStatus) : [],
      },
    };

    setCurrentReceipt(receipt);

    // Persist to Local History (optimistic)
    setVibeCheckHistory((prev) => [
      {
        venueId: venue.id,
        timestamp: Date.now(),
        status,
        points: receipt.pointsEarned,
      },
      ...prev,
    ]);

    return backendResult;
  };

  const addToClockInHistory = (record: ClockInRecord) => {
    setClockInHistory((prev) => [record, ...prev]);
  };

  return (
    <GamificationContext.Provider value={{
      userPoints,
      userRank,
      clockInHistory,
      vibeCheckHistory,
      awardPoints,
      handleVibeCheckSubmission,
      currentReceipt,
      addToClockInHistory,
      clearReceipt: () => setCurrentReceipt(null),
      setUserPoints
    }}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

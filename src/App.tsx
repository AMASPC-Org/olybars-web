import React, { useState, useEffect, Suspense, lazy } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "./components/common/SEO";
import { X } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./lib/firebase";

// --- CONFIG & TYPES ---
import { queryClient } from "./lib/queryClient";
import { GAMIFICATION_CONFIG } from "./config/gamification";
import {
  Venue,
  PointsReason,
  UserProfile,
  ClockInRecord,
  UserAlertPreferences,
  VenueStatus,
  GameStatus,
  VibeCheckRecord,
} from "./types";
import { isSystemAdmin } from "./types/auth_schema";

// --- REAL SERVICES ---
import { fetchVenues, updateVenueDetails } from "./services/venueService";
import {
  saveAlertPreferences,
  logUserActivity,
  fetchUserRank,
  toggleFavorite,
  updateUserProfile,
  performVibeCheck,
  getUserProfile,
} from "./services/userService";
import { LoadingScreen } from "./components/common/LoadingScreen";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { AppShell } from "./components/layout/AppShell";
import { AgeGate } from "./components/ui/AgeGate";
import { useToast } from "./components/ui/BrandedToast";
import {
  VibeReceiptData,
  generateArtieHook,
} from "./features/social/services/VibeReceiptService";
import { SessionPurgeService } from "./services/SessionPurgeService";
import { cookieService } from "./services/cookieService";
import { BuzzScreen } from "./features/venues/screens/BuzzScreen";
import { VenuesScreen } from "./features/venues/screens/VenuesScreen";

// --- LAZY COMPONENTS ---
const EventsScreen = lazy(() =>
  import("./features/league/screens/EventsScreen").then((m) => ({
    default: m.EventsScreen,
  })),
);
const KaraokeScreen = lazy(() =>
  import("./features/league/screens/KaraokeScreen").then((m) => ({
    default: m.KaraokeScreen,
  })),
);
const TriviaScreen = lazy(() =>
  import("./features/league/screens/TriviaScreen").then((m) => ({
    default: m.TriviaScreen,
  })),
);
const LiveMusicScreen = lazy(() =>
  import("./features/league/screens/LiveMusicScreen").then((m) => ({
    default: m.LiveMusicScreen,
  })),
);
const LeagueHQScreen = lazy(() =>
  import("./features/league/screens/LeagueHQScreen").then((m) => ({
    default: m.LeagueHQScreen,
  })),
);
const OwnerDashboardScreen = lazy(() =>
  import("./features/owner/screens/OwnerDashboardScreen").then((m) => ({
    default: m.OwnerDashboardScreen,
  })),
);
const LoginModal = lazy(() =>
  import("./features/auth/components/LoginModal").then((m) => ({
    default: m.LoginModal,
  })),
);
const ClockInModal = lazy(() =>
  import("./features/venues/components/ClockInModal").then((m) => ({
    default: m.ClockInModal,
  })),
);
const VibeCheckModal = lazy(() =>
  import("./features/venues/components/VibeCheckModal").then((m) => ({
    default: m.VibeCheckModal,
  })),
);
const MakerSurveyModal = lazy(() =>
  import("./features/marketing/components/MakerSurveyModal").then((m) => ({
    default: m.MakerSurveyModal,
  })),
);
const VibeReceiptModal = lazy(() =>
  import("./features/social/components/VibeReceiptModal").then((m) => ({
    default: m.VibeReceiptModal,
  })),
);
const OnboardingModal = lazy(() =>
  import("./components/ui/OnboardingModal").then((m) => ({
    default: m.OnboardingModal,
  })),
);
const PreferredSipsModal = lazy(() =>
  import("./features/profile/components/PreferredSipsModal").then((m) => ({
    default: m.PreferredSipsModal,
  })),
);
const HomeBaseModal = lazy(() =>
  import("./features/profile/components/HomeBaseModal").then((m) => ({
    default: m.HomeBaseModal,
  })),
);
const FlyerExtractor = lazy(() =>
  import("./pages/admin/FlyerExtractor").then((m) => ({
    default: m.FlyerExtractor,
  })),
);
const AdminDashboardScreen = lazy(() =>
  import("./features/admin/screens/AdminDashboardScreen").then((m) => ({
    default: m.AdminDashboardScreen,
  })),
);
const UserProfileScreen = lazy(
  () => import("./features/profile/screens/UserProfileScreen"),
); // Default export
const VenueProfileScreen = lazy(() =>
  import("./features/venues/screens/VenueProfileScreen").then((m) => ({
    default: m.VenueProfileScreen,
  })),
);
const ArtieBioScreen = lazy(
  () => import("./features/artie/screens/ArtieBioScreen"),
); // Default export
const JoinTeamScreen = lazy(() =>
  import("./features/admin/screens/JoinTeamScreen").then((m) => ({
    default: m.JoinTeamScreen,
  })),
);

const HistoryFeedScreen = lazy(() =>
  import("./features/history/screens/HistoryFeedScreen").then((m) => ({
    default: m.HistoryFeedScreen,
  })),
);
const HistoryArticleScreen = lazy(() =>
  import("./features/history/screens/HistoryArticleScreen").then((m) => ({
    default: m.HistoryArticleScreen,
  })),
);
const SettingsScreen = lazy(
  () => import("./features/profile/screens/SettingsScreen"),
); // Default export
const AuthPage = lazy(() =>
  import("./features/auth/screens/AuthPage").then((m) => ({
    default: m.AuthPage,
  })),
);
const PassportScreen = lazy(() =>
  import("./features/league/screens/PassportScreen").then((m) => ({
    default: m.PassportScreen,
  })),
);

// --- UTILS & HELPERS ---
import { cookieService } from "./services/cookieService";

// --- RELOCATED SCREENS ---

// --- RELOCATED SCREENS (LAYZY) ---
import TermsScreen from "./features/marketing/screens/TermsScreen";
import PrivacyScreen from "./features/marketing/screens/PrivacyScreen";
import CookiePolicyScreen from "./features/marketing/screens/CookiePolicyScreen";
import PartnerSecurityScreen from "./features/marketing/screens/PartnerSecurityScreen";
import FAQScreen from "./features/marketing/screens/FAQScreen";
import AboutPage from "./features/marketing/screens/About";
import { DiscoveryLayout } from "./features/venues/screens/DiscoveryLayout";
import { DiscoveryProvider } from "./features/venues/contexts/DiscoveryContext";
import OwnerPortal from "./features/owner/screens/OwnerPortal";

import { PointHistoryScreen } from "./features/profile/screens/PointHistoryScreen";
import { QRVibeCheckScreen } from "./features/vibe-check/screens/QRVibeCheckScreen";
import MerchStandScreen from "./features/merch/screens/MerchStandScreen";
import MerchDetailScreen from "./features/merch/screens/MerchDetailScreen";
import VoucherRedemptionScreen from "./features/merch/screens/VoucherRedemptionScreen";
import ScrollToTop from "./components/layout/ScrollToTop";
import { PulsePlaybookScreen } from "./features/marketing/screens/PulsePlaybookScreen";
import { PlayGatewayScreen } from "./features/play/screens/PlayGatewayScreen";
import { LeaguePerksScreen } from "./features/league/screens/LeaguePerksScreen";
import AIGatewayScreen from "./features/marketing/screens/AIGatewayScreen";
import AIFeedGuideScreen from "./features/marketing/screens/AIFeedGuideScreen";
import AIConductScreen from "./features/marketing/screens/AIConductScreen";
import ClaimVenuePage from "./features/owner/screens/ClaimVenuePage";
import GlossaryScreen from "./features/marketing/screens/GlossaryScreen";
import PointsGuideScreen from "./features/league/screens/PointsGuideScreen";
import LeagueMembershipPage from "./features/marketing/LeagueMembershipPage";
import OnboardingHandoverPage from "./features/marketing/screens/OnboardingHandoverPage";
import { FlightSchoolScreen } from "./features/flights/screens/FlightSchoolScreen";
import { MetaOAuthCallback } from "./features/owner/components/MetaOAuthCallback";
import { BackRoomScreen } from "./features/venues/screens/BackRoomScreen";

const InfoPopup = ({ infoContent, setInfoContent }: any) => {
  if (!infoContent) return null;
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={() => setInfoContent(null)}
    >
      <div
        className="bg-surface border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-black text-primary uppercase tracking-wide mb-3 font-league">
          {infoContent.title}
        </h3>
        <p className="text-sm text-slate-300 font-medium leading-relaxed font-body">
          {infoContent.text}
        </p>
        <button
          onClick={() => setInfoContent(null)}
          className="absolute top-3 right-3 text-slate-500 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// --- CONTEXTS ---
import { UserProvider, useUser } from "./contexts/UserContext";

// [BOUNCER INTEGRATION]
import { BouncerGate } from './features/auth/components/BouncerGate';

const SmartOwnerRoute = ({
  venues,
  handleUpdateVenue,
  // userProfile, // [REFACTOR] Now consumed via context or prop from AppContent
  isLoading,
}: any) => {
  const { venueId, tab } = useParams();
  const navigate = useNavigate();
  // We can consume context here if needed, or pass it down. 
  // For now, assume it's passed or available.
  const { userProfile } = useUser();

  // Helper to resolve initial venue
  const resolveStartingVenue = () => {
    if (venueId) return venueId;
    // If admin with no permissions, default to hannahs (legacy dev)
    // If owner, pick first venue
    if (userProfile.venuePermissions && Object.keys(userProfile.venuePermissions).length > 0) {
      return Object.keys(userProfile.venuePermissions)[0];
    }
    return "hannahs";
  };

  const defaultVenueId = resolveStartingVenue();

  return (
    <BouncerGate
      isLoading={isLoading}
      fallback={<OwnerPortal />}
    >
      <OwnerDashboardScreen
        isOpen={true}
        onClose={() => navigate("/")}
        venues={venues}
        updateVenue={handleUpdateVenue}
        userProfile={userProfile}
        initialVenueId={defaultVenueId}
        initialView={(tab as any) || "operations"}
        isLoading={isLoading}
      />
    </BouncerGate>
  );
};

function AppContent() {
  // --- DATA FETCHING (TanStack Query with Persistence) ---
  const { showToast } = useToast();
  const navigate = useNavigate();

  const { data: venues = [], isLoading } = useQuery({
    queryKey: ["venues-brief"],
    queryFn: () => fetchVenues(true), // Fetch brief mode for the list
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    initialData: () => {
      // Instant hydration for Returning Users [OPTIMIZATION]
      try {
        const cached = localStorage.getItem("oly_venues_cache");
        if (cached) return JSON.parse(cached);
      } catch (e) {
        console.error("[OlyBars] Hydration failed:", e);
      }
      return [];
    },
  });

  // Sync Venues to LocalStorage for next boot
  useEffect(() => {
    if (venues && venues.length > 0) {
      localStorage.setItem("oly_venues_cache", JSON.stringify(venues));
    }
  }, [venues]);

  // --- CONTEXT HOOKS ---
  const { userProfile, setUserProfile, isLoading: isAuthLoading } = useUser();

  // --- LOCAL STATE (Non-Identity) ---
  const [userPoints, setUserPoints] = useState(() =>
    parseInt(localStorage.getItem("oly_points") || "0"),
  );
  const [clockInHistory, setClockInHistory] = useState<ClockInRecord[]>(() =>
    JSON.parse(localStorage.getItem("oly_clockins") || "[]"),
  );
  const [vibeCheckHistory, setVibeCheckHistory] = useState<VibeCheckRecord[]>(
    () => JSON.parse(localStorage.getItem("oly_vibe_history") || "[]"),
  );
  const [alertPrefs, setAlertPrefs] = useState<UserAlertPreferences>(() =>
    JSON.parse(
      localStorage.getItem("oly_prefs") ||
      '{"nightlyDigest":true,"weeklyDigest":true,"followedVenues":[],"interests":[]}',
    ),
  );

  // Progressive Profiling State
  const [showPreferredSipsModal, setShowPreferredSipsModal] = useState(false);
  const [showHomeBaseModal, setShowHomeBaseModal] = useState(false);
  const [homeBaseTargetVenue, setHomeBaseTargetVenue] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Derived userId for convenience
  const userId = userProfile?.uid || "guest_user_123";

  // const { showToast } = useToast(); // Moved to top
  // const [artieMessages, setArtieMessages] = useState<{ sender: string, text: string }[]>([
  //   { sender: 'artie', text: "Cheers! I'm Artie, your local guide powered by Well 80 Artesian Water." }
  // ]);
  const [userRank, setUserRank] = useState<number | undefined>(undefined);

  // --- RESTORED LOCAL STATE ---
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState<"user" | "owner">("user");
  const [userSubMode, setUserSubMode] = useState<"login" | "signup">("signup");
  const [showOwnerDashboard, setShowOwnerDashboard] = useState(false);
  const [ownerDashboardInitialVenueId, setOwnerDashboardInitialVenueId] =
    useState<string | null>(null);
  const [ownerDashboardInitialView, setOwnerDashboardInitialView] = useState<
    "main" | "marketing" | "listing"
  >("main");
  const [hasAcceptedAgeGate, setHasAcceptedAgeGate] = useState(
    () => cookieService.get("oly_age_gate") === "true",
  );
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(
    () => cookieService.get("oly_terms") === "true",
  );
  const [infoContent, setInfoContent] = useState<{
    title: string;
    text: string;
  } | null>(null);
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [vibeVenue, setVibeVenue] = useState<Venue | null>(null);
  const [showVibeCheckModal, setShowVibeCheckModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [clockedInVenue, setClockedInVenue] = useState<string | null>(null);
  const [vibeCheckedVenue, setVibeCheckedVenue] = useState<string | null>(null);
  const [showArtie, setShowArtie] = useState(false);
  const [showMakerSurvey, setShowMakerSurvey] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<VibeReceiptData | null>(
    null,
  );

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
    localStorage.setItem("oly_points", userPoints.toString());
  }, [userPoints]);

  useEffect(() => {
    localStorage.setItem("oly_clockins", JSON.stringify(clockInHistory));
  }, [clockInHistory]);

  useEffect(() => {
    localStorage.setItem("oly_vibe_history", JSON.stringify(vibeCheckHistory));
  }, [vibeCheckHistory]);

  useEffect(() => {
    localStorage.setItem("oly_prefs", JSON.stringify(alertPrefs));
  }, [alertPrefs]);

  // Maker's Trail Survey Trigger: 3 Local Clock Ins and Survey Not Done
  useEffect(() => {
    if (
      userProfile.uid !== "guest" &&
      userProfile.makersTrailProgress &&
      userProfile.makersTrailProgress >= 3 &&
      !userProfile.hasCompletedMakerSurvey &&
      !showMakerSurvey
    ) {
      // Add a small delay for UX so it doesn't pop immediately after action
      const timer = setTimeout(() => setShowMakerSurvey(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [
    userProfile.makersTrailProgress,
    userProfile.hasCompletedMakerSurvey,
    userProfile.uid,
  ]);

  const openInfo = (title: string, text: string) => {
    setInfoContent({ title, text });
  };

  const awardPoints = (
    reason: PointsReason,
    venueId?: string,
    hasConsent?: boolean,
    verificationMethod?: "gps" | "qr",
    bonusPoints: number = 0,
    skipBackend: boolean = false,
    venueStatus?: VenueStatus, // Pass status for Pioneer Curve
    overrideTotal?: number,
  ) => {
    const { REWARDS, PIONEER_CURVE } = GAMIFICATION_CONFIG;
    let delta = 0;

    if (overrideTotal !== undefined) {
      delta = overrideTotal;
    } else if (reason === "clockin") {
      // Apply Pioneer Curve if status is provided, otherwise default to base
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

  const handleUpdateVenue = async (
    venueId: string,
    updates: Partial<Venue>,
  ) => {
    // [AUTH GUARD] Prevent Guests from triggering 401s
    if (userProfile.uid === "guest") {
      showToast("Session Expired. Please Login to save changes.", "error");
      // Optional: Prompt login
      setLoginMode("owner");
      setShowLoginModal(true);
      return;
    }

    // 1. Optimistic UI Update (TanStack Query Cache)
    queryClient.setQueryData(
      ["venues-brief"],
      (oldVenues: Venue[] | undefined) => {
        if (!oldVenues) return [];
        return oldVenues.map((v) =>
          v.id === venueId ? { ...v, ...updates } : v,
        );
      },
    );

    // 2. Persist to Backend
    try {
      await updateVenueDetails(venueId, updates, userProfile.uid);
    } catch (err: any) {
      console.error("[OlyBars] Failed to persist venue update:", err);
      showToast(
        err.message || "Connection issue: Update might not be permanent.",
        "error",
      );
      // Invalidate on error to revert to server state
      queryClient.invalidateQueries({ queryKey: ["venues-brief"] });
      throw err; // Re-throw so callers can manage their own UI state (e.g. isSaving)
    }
  };

  const handleClockIn = (venue: Venue) => {
    // 1. Calculate OlyBars Business Day Start (4:00 AM)
    if (clockedInVenue === venue.id) {
      showToast("You're already clocked in here!", "info");
      return;
    }

    React.startTransition(() => {
      setSelectedVenue(venue);
      setShowClockInModal(true);
    });
  };

  const handleVibeCheck = (venue: Venue) => {
    const now = Date.now();

    // 1. Global Cooldown (30m)
    const lastGlobal = userProfile.lastGlobalVibeCheck;
    if (lastGlobal && now - lastGlobal < 30 * 60 * 1000) {
      const minsLeft = Math.ceil((30 * 60 * 1000 - (now - lastGlobal)) / 60000);
      showToast(
        `Global Cooldown! Wait ${minsLeft}m before clocking another vibe.`,
        "info",
      );
      return;
    }

    // 2. Per-Venue Cooldown (60m)
    const lastCheck = userProfile.lastVibeChecks?.[venue.id];
    if (lastCheck && now - lastCheck < 60 * 60 * 1000) {
      const minsLeft = Math.ceil((60 * 60 * 1000 - (now - lastCheck)) / 60000);
      showToast(
        `${venue.name} Vibe Check locked! Available in ${minsLeft} m`,
        "info",
      );
      return;
    }

    setVibeVenue(venue);
    setShowVibeCheckModal(true);
  };
  const confirmVibeCheck = async (
    venue: Venue,
    status: VenueStatus,
    hasConsent: boolean,
    photoUrl?: string,
    verificationMethod: "gps" | "qr" = "gps",
    gameStatus?: Record<string, GameStatus>,
    soberFriendlyCheck?: { isGood: boolean; reason?: string },
  ) => {
    const now = Date.now();

    // 1. If not already clocked in, perform a background Clock In to unify signals
    if (!clockedInVenue || clockedInVenue !== venue.id) {
      setClockedInVenue(venue.id);
      setClockInHistory((prev) => [
        ...prev,
        { venueId: venue.id, timestamp: now },
      ]);
    }

    setVibeCheckedVenue(venue.id);

    // Calculate Game Bonus Points (Flat Rate)
    let gameBonus = 0;
    if (gameStatus && Object.keys(gameStatus).length > 0) {
      gameBonus = GAMIFICATION_CONFIG.REWARDS.GAME_REPORT_FLAT_BONUS;
    }

    // Update Venue Status and Photos (Attempt for all, handle guest auth errors)
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
      // Honest Gate: Propagate Auth Errors for Guest UI handling
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

    // Generate Vibe Receipt
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
        points:
          GAMIFICATION_CONFIG.REWARDS.VIBE_REPORT +
          (photoUrl ? GAMIFICATION_CONFIG.REWARDS.VIBE_PHOTO : 0) +
          (hasConsent ? GAMIFICATION_CONFIG.REWARDS.MARKETING_CONSENT : 0) +
          gameBonus,
      },
      ...prev,
    ]);

    return backendResult;
  };

  const handleToggleWeeklyBuzz = async () => {
    const newVal = !userProfile.weeklyBuzz;

    // 1. Update Profile (Local + Remote)
    setUserProfile((prev) => ({ ...prev, weeklyBuzz: newVal }));

    // 2. Update Alert Prefs (Local) to keep synced
    setAlertPrefs((prev) => ({ ...prev, weeklyDigest: newVal }));

    // 3. Persist to Firestore
    if (userProfile.uid !== "guest") {
      try {
        await updateUserProfile(userProfile.uid, { weeklyBuzz: newVal });
      } catch {
        showToast("Sync failed, retrying...", "error");
      }
    }
  };

  const handleMemberLoginClick = (mode: "login" | "signup" = "signup") => {
    setUserSubMode(mode);
    setLoginMode("user");
    setShowLoginModal(true);
  };

  const handleToggleFavorite = async (venueId: string) => {
    if (userProfile.uid === "guest") {
      // Allow local toggle without login modal
    }

    try {
      const result = await toggleFavorite(
        userProfile.uid,
        venueId,
        userProfile.favorites || [],
      );
      if (result.success) {
        setUserProfile((prev) => ({ ...prev, favorites: result.favorites }));
        showToast(
          userProfile.favorites?.includes(venueId)
            ? "Removed from Favorites"
            : "Added to Favorites",
          "success",
        );
      }
    } catch {
      showToast("Error updating favorites", "error");
    }
  };

  const handleOpenPreferredSips = () => setShowPreferredSipsModal(true);
  const handleOpenHomeBase = (venueId: string, venueName: string) => {
    setHomeBaseTargetVenue({ id: venueId, name: venueName });
    setShowHomeBaseModal(true);
  };

  const handleAcceptAgeGate = () => {
    cookieService.set("oly_age_gate", "true");
    cookieService.set("oly_terms", "true");
    setHasAcceptedAgeGate(true);
    setHasAcceptedTerms(true);
  };

  const handleAcceptTerms = () => {
    cookieService.set("oly_terms", "true");
    // We don't set oly_cookies here automatically so the banner shows up separately
    setHasAcceptedTerms(true);
  };

  useEffect(() => {
    localStorage.setItem("oly_points", userPoints.toString());
  }, [userPoints]);
  useEffect(() => {
    localStorage.setItem("oly_clockins", JSON.stringify(clockInHistory));
  }, [clockInHistory]);
  useEffect(() => {
    localStorage.setItem("oly_profile", JSON.stringify(userProfile));
  }, [userProfile]);
  useEffect(() => {
    localStorage.setItem("oly_prefs", JSON.stringify(alertPrefs));
    if (userId !== "guest") saveAlertPreferences(userId, alertPrefs);
  }, [alertPrefs]);

  const handleLogout = async () => {
    try {
      // 1. Authoritative Sign Out
      await signOut(auth);

      // 2. Surgical Purge via Service (Preserves Age Gate, Clears User Data)
      SessionPurgeService.purgeSession('nuclear');

      // 3. Reset React State (in case redirect takes a moment)
      setUserProfile({ uid: "guest", role: "guest" });
      setUserPoints(1250);
      setClockInHistory([]);
      setShowOwnerDashboard(false);

    } catch (error) {
      console.error("[App] Logout failed:", error);
      // Fail-safe purge even on error
      SessionPurgeService.purgeSession('nuclear');
    }
  };

  // Sync points when profile changes (e.g. after login)
  useEffect(() => {
    if (userProfile.stats?.seasonPoints !== undefined) {
      setUserPoints(userProfile.stats.seasonPoints);
    }
  }, [userProfile.uid, userProfile.stats?.seasonPoints]);

  if (isAuthInitializing) {
    return <LoadingScreen message="Verifying Identity..." />;
  }

  if (!hasAcceptedAgeGate) {
    return <AgeGate onAccept={handleAcceptAgeGate} />;
  }

  if (!hasAcceptedTerms && userProfile.role !== "guest") {
    return (
      <OnboardingModal
        isOpen={true}
        onClose={handleAcceptTerms}
        userRole={userProfile.role}
      />
    );
  }

  return (
    <ErrorBoundary>
      <DiscoveryProvider>
        <ScrollToTop />
        <Suspense fallback={<LoadingScreen />}>
          <div className="h-full bg-background overflow-hidden relative">
            <Routes>
              <Route
                path="*"
                element={
                  <AppShell
                    venues={venues}
                    userPoints={userPoints}
                    isLeagueMember={userProfile.role !== "guest"}
                    userProfile={userProfile}
                    onToggleWeeklyBuzz={handleToggleWeeklyBuzz}
                    onProfileClick={() => {
                      if (userProfile.uid === "guest") {
                        setLoginMode("user");
                        setUserSubMode("login");
                        setShowLoginModal(true);
                      } else {
                        navigate("/profile");
                      }
                    }}
                    onMemberLoginClick={(mode?: "login" | "signup") => {
                      setLoginMode("user");
                      if (mode) setUserSubMode(mode);
                      setShowLoginModal(true);
                    }}
                    userRank={userRank}
                    onLogout={handleLogout}
                    onToggleFavorite={handleToggleFavorite}
                    onClockIn={handleClockIn}
                    onVibeCheck={handleVibeCheck}
                    clockedInVenue={clockedInVenue}
                    onEditVenue={(vid) => {
                      setOwnerDashboardInitialVenueId(vid);
                      setOwnerDashboardInitialView("listing");
                      setShowOwnerDashboard(true);
                    }}
                    showArtie={showArtie}
                    setShowArtie={setShowArtie}
                    clockInHistory={clockInHistory}
                    vibeCheckHistory={vibeCheckHistory}
                  />
                }
              >
                <Route element={<DiscoveryLayout />}>
                  <Route
                    index
                    element={
                      <>
                        <SEO
                          title="Pulse & Buzz"
                          description="Track the real-time vibe of Thurston County. See which bars are buzzing right now."
                        />
                        <BuzzScreen />
                      </>
                    }
                  />
                  <Route
                    path="bars"
                    element={
                      <>
                        <SEO
                          title="Bar Directory"
                          description="The complete index of bars, taprooms, and lounges in Thurston County."
                        />
                        <VenuesScreen venues={venues} />
                      </>
                    }
                  />
                  <Route
                    path="bars/:id"
                    element={
                      <VenueProfileScreen
                        onOpenSips={handleOpenPreferredSips}
                        onOpenHomeBase={handleOpenHomeBase}
                      />
                    }
                  />
                  <Route
                    path="bars/:id/events"
                    element={<EventsScreen venues={venues} />}
                  />
                  <Route
                    path="back-room"
                    element={
                      <>
                        <SEO
                          title="The Back Room"
                          description="Private inventory for squads & parties."
                        />
                        <BackRoomScreen />
                      </>
                    }
                  />
                </Route>
                <Route
                  path="karaoke"
                  element={
                    <>
                      <SEO
                        title="Karaoke Guide"
                        description="Find the best karaoke spots in Thurston County tonight."
                      />
                      <KaraokeScreen venues={venues} />
                    </>
                  }
                />
                <Route
                  path="play"
                  element={
                    <>
                      <SEO
                        title="The Arcade & Arena"
                        description="The central hub for games, events, and activities in Thurston County."
                      />
                      <PlayGatewayScreen venues={venues} />
                    </>
                  }
                />
                <Route
                  path="trivia"
                  element={
                    <>
                      <SEO
                        title="Trivia & Games"
                        description="Your guide to trivia nights and bar games in Thurston County."
                      />
                      <TriviaScreen
                        venues={venues}
                        userProfile={userProfile}
                      />
                    </>
                  }
                />
                <Route
                  path="live"
                  element={
                    <>
                      <SEO
                        title="Live Music"
                        description="Live shows and concerts happening tonight in Thurston County."
                      />
                      <LiveMusicScreen venues={venues} />
                    </>
                  }
                />
                <Route
                  path="events"
                  element={
                    <>
                      <SEO
                        title="Event Wire"
                        description="The chronological feed of everything happening in the Thurston County bar scene."
                      />
                      <EventsScreen venues={venues} />
                    </>
                  }
                />
                <Route
                  path="league"
                  element={
                    <>
                      <SEO
                        title="Bar League HQ"
                        description="Join the official Artesian Bar League. Track your points, rankings, and rewards."
                      />
                      <LeagueHQScreen
                        venues={venues}
                        isLeagueMember={userProfile.role !== "guest"}
                        onJoinClick={(mode) => {
                          setUserSubMode(mode || "login");
                          setLoginMode("user");
                          setShowLoginModal(true);
                        }}
                        onAskArtie={() => setShowArtie(true)}
                      />
                    </>
                  }
                />
                <Route
                  path="passport"
                  element={
                    <PassportScreen
                      venues={venues}
                      userProfile={userProfile}
                      clockInHistory={clockInHistory}
                      vibeCheckHistory={vibeCheckHistory}
                    />
                  }
                />
                <Route path="partners/claim" element={<ClaimVenuePage />} />
                <Route
                  path="merch"
                  element={<MerchStandScreen venues={venues} />}
                />
                <Route
                  path="merch/:itemId"
                  element={
                    <MerchDetailScreen
                      venues={venues}
                      userProfile={userProfile}
                      setUserProfile={setUserProfile}
                    />
                  }
                />
                <Route
                  path="vouchers"
                  element={
                    <VoucherRedemptionScreen
                      userProfile={userProfile}
                      venues={venues}
                    />
                  }
                />
                <Route path="meet-artie" element={<ArtieBioScreen />} />
              </Route>
              {/* Fallback */}
              <Route path="*" element={<VenuesScreen venues={venues} isLoading={isLoading} userProfile={userProfile} onClockIn={handleClockIn} onVibeCheck={handleVibeCheck} clockInHistory={clockInHistory} vibeCheckHistory={vibeCheckHistory} clockedInVenue={clockedInVenue} vibeCheckedVenue={vibeCheckedVenue} />} />

            </Routes>

            {/* --- MODALS --- */}

            {showLoginModal && (
              <Suspense fallback={null}>
                <LoginModal
                  isOpen={showLoginModal}
                  onClose={() => setShowLoginModal(false)}
                  defaultMode={loginMode}
                  defaultSubMode={userSubMode}
                  onLoginSuccess={(profile) => {
                    setUserProfile(profile);
                    setShowLoginModal(false);
                    showToast(`Welcome back, ${profile.displayName || 'Guest'}!`, 'success');
                  }}
                />
              </Suspense>
            )}

            {showClockInModal && selectedVenue && (
              <Suspense fallback={null}>
                <ClockInModal
                  isOpen={showClockInModal}
                  onClose={() => setShowClockInModal(false)}
                  venue={selectedVenue}
                  userProfile={userProfile}
                  onClockIn={() => handleConfirmClockIn(selectedVenue.id)}
                />
              </Suspense>
            )}

            {showVibeCheckModal && vibeVenue && (
              <Suspense fallback={null}>
                <VibeCheckModal
                  isOpen={showVibeCheckModal}
                  onClose={() => setShowVibeCheckModal(false)}
                  venue={vibeVenue}
                  userProfile={userProfile}
                  onVibeSubmit={(status, pts) => handleConfirmVibeCheck(status, vibeVenue.id, pts)}
                />
              </Suspense>
            )}

            {showMakerSurvey && (
              <Suspense fallback={null}>
                <MakerSurveyModal
                  isOpen={showMakerSurvey}
                  onClose={() => setShowMakerSurvey(false)}
                  onComplete={handleMakerSurveyComplete}
                />
              </Suspense>
            )}

            <ArtieBioScreen
              isOpen={showArtie}
              onClose={() => setShowArtie(false)}
              userProfile={userProfile}
            />

            <JoinTeamScreen
              isOpen={false} // Placeholder
              onClose={() => { }}
            />

            <TermsModal
              isOpen={!hasAcceptedTerms && hasAcceptedAgeGate}
              onAccept={() => setHasAcceptedTerms(true)}
            />

            {currentReceipt && (
              <VibeReceiptModal
                data={currentReceipt}
                onClose={() => setCurrentReceipt(null)}
                isLoggedIn={userProfile.uid !== "guest"}
                onLogin={handleMemberLoginClick}
              />
            )}

            <InfoPopup
              infoContent={infoContent}
              setInfoContent={setInfoContent}
            />
          </div>
        </Suspense>
      </DiscoveryProvider>
    </ErrorBoundary>
  );
}

// --- ROOT EXPORT ---
export default function OlyBarsApp() {
  return (
    <ErrorBoundary>
      <DiscoveryProvider>
        <React.Suspense fallback={<LoadingScreen />}>
          <Router>
            <UserProvider>
              <AppContent />
            </UserProvider>
          </Router>
        </React.Suspense>
      </DiscoveryProvider>
    </ErrorBoundary>
  );
}

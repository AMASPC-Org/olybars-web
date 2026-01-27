import React, { useState, useEffect, Suspense, lazy } from "react";
import {
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "./components/common/SEO";

// --- CONFIG & TYPES ---
import { useUser, useGamification } from "./contexts";
import { queryClient } from "./lib/queryClient";
import {
  Venue,
  UserAlertPreferences,
} from "./types";

// --- REAL SERVICES ---
import { fetchVenues, updateVenueDetails } from "./services/venueService";
import {
  updateUserProfile,
} from "./services/userService";
import { LoadingScreen } from "./components/common/LoadingScreen";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { AppShell } from "./components/layout/AppShell";
import { AgeGate } from "./components/ui/AgeGate";
import { useToast } from "./components/ui/BrandedToast";
import { cookieService } from "./services/cookieService";
import { InfoPopup } from "./components/ui/InfoPopup";
import { SmartOwnerRoute } from "./features/owner/routes/SmartOwnerRoute";

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

// --- RELOCATED SCREENS (LAYZY) ---
import TermsScreen from "./features/marketing/screens/TermsScreen";
import PrivacyScreen from "./features/marketing/screens/PrivacyScreen";
import CookiePolicyScreen from "./features/marketing/screens/CookiePolicyScreen";
import PartnerSecurityScreen from "./features/marketing/screens/PartnerSecurityScreen";
import FAQScreen from "./features/marketing/screens/FAQScreen";
import AboutPage from "./features/marketing/screens/About";

import { DiscoveryProvider } from "./features/venues/contexts/DiscoveryContext";

import { PointHistoryScreen } from "./features/profile/screens/PointHistoryScreen";
import { QRVibeCheckScreen } from "./features/vibe-check/screens/QRVibeCheckScreen";
import MerchStandScreen from "./features/merch/screens/MerchStandScreen";
import MerchDetailScreen from "./features/merch/screens/MerchDetailScreen";
import VoucherRedemptionScreen from "./features/merch/screens/VoucherRedemptionScreen";
import ScrollToTop from "./components/layout/ScrollToTop";
import { PulsePlaybookScreen } from "./features/marketing/screens/PulsePlaybookScreen";
import { PlayGatewayScreen } from "./features/play/screens/PlayGatewayScreen";

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

import { VenuesScreen } from "./features/venues/screens/VenuesScreen";
import { BuzzScreen } from "./features/venues/screens/BuzzScreen";

// --- CONTEXTS ---

function AppContent() {
  // --- DATA FETCHING (TanStack Query with Persistence) ---
  const { showToast } = useToast();
  const navigate = useNavigate();

  console.log("[AppContent] Triggering venues-brief query...");
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
      return undefined;
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
  const {
    userPoints,
    userRank,
    awardPoints,
    handleVibeCheckSubmission,
    currentReceipt,
    clockInHistory,
    vibeCheckHistory,
    addToClockInHistory,
    clearReceipt
  } = useGamification();

  // --- LOCAL STATE (Non-Identity) ---
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


  // --- RESTORED LOCAL STATE ---
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState<"user" | "owner">("user");
  const [userSubMode, setUserSubMode] = useState<"login" | "signup">("signup");
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
  const [clockedInVenue, setClockedInVenue] = useState<string | null>(null);
  // Keep local ref to vibe checked for immediate UI feedback if separate from history
  // const [vibeCheckedVenue, setVibeCheckedVenue] = useState<string | null>(null);

  const [showArtie, setShowArtie] = useState(false);
  const [showMakerSurvey, setShowMakerSurvey] = useState(false);

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

  // Wrapper related to UI state management for Vibe Check confirmation
  // The heavy lifting is now in GamificationContext


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
    setHasAcceptedTerms(true);
  };

  if (isAuthLoading) {
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
                    userRank={userRank}
                    isLeagueMember={userProfile.role !== "guest"}
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
                      handleMemberLoginClick(mode);
                    }}
                    onClockIn={handleClockIn}
                    onVibeCheck={handleVibeCheck}
                    clockedInVenue={clockedInVenue}
                    onEditVenue={(id) => {
                      if (userProfile.uid === "guest") {
                        handleMemberLoginClick(); // Or owner login
                        return;
                      }
                      navigate(`/owner?venueId=${id}`);
                    }}
                    isLoading={isLoading}
                    showArtie={showArtie}
                    setShowArtie={setShowArtie}
                    clockInHistory={clockInHistory}
                    vibeCheckHistory={vibeCheckHistory}
                  />
                }
              >
                <Route index element={<VenuesScreen venues={venues} handleVibeCheck={handleVibeCheck} lastVibeChecks={userProfile.lastVibeChecks} lastGlobalVibeCheck={userProfile.lastGlobalVibeCheck} />} />
                <Route path="map" element={<VenuesScreen initialMode="map" venues={venues} handleVibeCheck={handleVibeCheck} lastVibeChecks={userProfile.lastVibeChecks} lastGlobalVibeCheck={userProfile.lastGlobalVibeCheck} />} />
                <Route
                  path="bars/:venueId"
                  element={<VenueProfileScreen onOpenSips={handleOpenPreferredSips} onOpenHomeBase={handleOpenHomeBase} />}
                />
                <Route path="bars" element={<VenuesScreen venues={venues} handleVibeCheck={handleVibeCheck} lastVibeChecks={userProfile.lastVibeChecks} lastGlobalVibeCheck={userProfile.lastGlobalVibeCheck} />} />
                <Route path="venues" element={<VenuesScreen venues={venues} handleVibeCheck={handleVibeCheck} lastVibeChecks={userProfile.lastVibeChecks} lastGlobalVibeCheck={userProfile.lastGlobalVibeCheck} />} />

                {/* --- MARKETING & STATIC --- */}
                <Route path="buzz" element={<BuzzScreen />} />
                <Route path="league" element={<LeagueHQScreen venues={venues} isLeagueMember={userProfile.role !== 'guest'} onJoinClick={handleMemberLoginClick} onPassportClick={() => navigate('/passport')} />} />
                <Route path="events" element={<EventsScreen venues={venues} />} />
                <Route path="events/karaoke" element={<KaraokeScreen venues={venues} />} />
                <Route path="events/trivia" element={<TriviaScreen venues={venues} />} />
                <Route path="events/live-music" element={<LiveMusicScreen venues={venues} />} />
                <Route path="playbook" element={<PulsePlaybookScreen />} />
                <Route path="play" element={<PlayGatewayScreen venues={venues} />} />
                <Route path="flights" element={<FlightSchoolScreen />} />
                <Route path="ai-guide" element={<AIFeedGuideScreen />} />
                <Route path="ai-gateway" element={<AIGatewayScreen />} />
                <Route path="ai-safety" element={<AIConductScreen />} />
                <Route path="points-guide" element={<PointsGuideScreen />} />
                <Route
                  path="league-membership"
                  element={<LeagueMembershipPage />}
                />
                <Route path="about" element={<AboutPage />} />
                <Route path="terms" element={<TermsScreen />} />
                <Route path="privacy" element={<PrivacyScreen />} />
                <Route path="cookies" element={<CookiePolicyScreen />} />
                <Route
                  path="partner-security"
                  element={<PartnerSecurityScreen />}
                />
                <Route path="faq" element={<FAQScreen />} />
                <Route path="glossary" element={<GlossaryScreen />} />
                <Route path="merch" element={<MerchStandScreen venues={venues} />} />
                <Route path="merch/:itemId" element={<MerchDetailScreen venues={venues} userProfile={userProfile} setUserProfile={setUserProfile} />} />
                <Route path="redeem" element={<VoucherRedemptionScreen venues={venues} userProfile={userProfile} />} />
                <Route path="back-room" element={<BackRoomScreen />} />


                {/* --- AUTH & PROFILE --- */}
                <Route path="auth" element={
                  <AuthPage
                    userProfile={userProfile}
                    setUserProfile={setUserProfile}
                    venues={venues}
                    alertPrefs={alertPrefs}
                    setAlertPrefs={setAlertPrefs}
                    openInfo={openInfo}
                    onOwnerSuccess={() => navigate('/owner?tab=marketing')}
                    loginMode={loginMode}
                    setLoginMode={setLoginMode}
                    userSubMode={userSubMode}
                    setUserSubMode={setUserSubMode}
                  />
                } />
                <Route path="join-team" element={<JoinTeamScreen userProfile={userProfile} />} />
                <Route path="claim-venue" element={<ClaimVenuePage />} />
                <Route
                  path="owner"
                  element={
                    <SmartOwnerRoute
                      venues={venues}
                      handleUpdateVenue={handleUpdateVenue}
                      isLoading={isLoading}
                    />
                  }
                >
                  <Route path=":venueId/:tab" element={<div />} /> {/* Dummy endpoint for deep links */}
                </Route>
                <Route
                  path="meta-callback"
                  element={
                    <MetaOAuthCallback
                      onClose={() => navigate("/owner?tab=marketing")}
                    />
                  }
                />
                <Route path="profile" element={<UserProfileScreen userProfile={userProfile} setUserProfile={setUserProfile} venues={venues} />} />
                <Route path="passport" element={<PassportScreen venues={venues} userProfile={userProfile} clockInHistory={clockInHistory} vibeCheckHistory={vibeCheckHistory} />} />
                <Route path="history" element={<PointHistoryScreen userProfile={userProfile} onBack={() => navigate(-1)} />} />
                <Route path="me/history" element={<HistoryFeedScreen />} />
                <Route
                  path="me/history/:articleId"
                  element={<HistoryArticleScreen venues={venues} />}
                />
                <Route path="settings" element={<SettingsScreen userProfile={userProfile} setUserProfile={setUserProfile} />} />


                {/* --- ADMIN --- */}
                <Route
                  path="admin"
                  element={
                    <AdminDashboardScreen userProfile={userProfile} />
                  }
                >
                  <Route path="flyers" element={<FlyerExtractor />} />
                </Route>

                <Route path="artie-bio" element={<ArtieBioScreen />} />
                <Route path="vc/:venueId" element={<QRVibeCheckScreen venues={venues} handleVibeCheck={handleVibeCheckSubmission} />} />
                <Route
                  path="meet-artie"
                  element={<ArtieBioScreen />}
                />
                {/* --- OWNER HANDOVER --- */}
                <Route path="venue-handover" element={<OnboardingHandoverPage />} />
              </Route>
            </Routes>

            {/* --- MODALS & OVERLAYS --- */}
            {selectedVenue && (
              <ClockInModal
                isOpen={showClockInModal}
                onClose={() => setShowClockInModal(false)}
                selectedVenue={selectedVenue}
                awardPoints={awardPoints}
                onClockInRecord={addToClockInHistory}
                setClockedInVenue={setClockedInVenue}
                vibeChecked={!!vibeVenue}
                onLogin={(mode) => {
                  setUserSubMode(mode);
                  setShowLoginModal(true);
                }}
                onJoinLeague={() => {
                  setUserSubMode('signup');
                  setShowLoginModal(true);
                }}
              />
            )}

            {vibeVenue && (
              <VibeCheckModal
                isOpen={showVibeCheckModal}
                onClose={() => setShowVibeCheckModal(false)}
                venue={vibeVenue!}
                onConfirm={handleVibeCheckSubmission}
                clockedIn={!!clockedInVenue}
                onClockInPrompt={() => {
                  setShowVibeCheckModal(false);
                  setShowClockInModal(true);
                }}
                onLogin={(mode) => {
                  setUserSubMode(mode);
                  setShowLoginModal(true);
                }}
              />
            )}

            {currentReceipt && (
              <VibeReceiptModal
                onClose={clearReceipt}
                data={currentReceipt}
                onLogin={(mode) => {
                  setUserSubMode(mode);
                  setLoginMode("user");
                  setShowLoginModal(true);
                  // Close receipt? Maybe keep open?
                  // clearReceipt(); 
                }}
              />
            )}

            <InfoPopup
              infoContent={infoContent}
              setInfoContent={setInfoContent}
            />

            <LoginModal
              isOpen={showLoginModal}
              onClose={() => setShowLoginModal(false)}
              userSubMode={userSubMode}
              setUserSubMode={setUserSubMode}
              loginMode={loginMode}
              setLoginMode={setLoginMode}
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              venues={venues} // Pass venues for owner drop-down
              alertPrefs={alertPrefs}
              setAlertPrefs={setAlertPrefs}
              openInfo={openInfo}
              onOwnerSuccess={() => {
                // Refresh handled by hook
                setShowLoginModal(false);
              }}
            />

            <MakerSurveyModal
              isOpen={showMakerSurvey}
              onClose={() => setShowMakerSurvey(false)}
              userId={userProfile.uid}
            />

            <PreferredSipsModal
              isOpen={showPreferredSipsModal}
              onClose={() => setShowPreferredSipsModal(false)}
              userProfile={userProfile}
              setUserProfile={setUserProfile}
            />

            <HomeBaseModal
              isOpen={showHomeBaseModal}
              onClose={() => setShowHomeBaseModal(false)}
              venueId={homeBaseTargetVenue?.id || ''}
              venueName={homeBaseTargetVenue?.name || ''}
            />
          </div>
          <SEO />
        </Suspense>
      </DiscoveryProvider>
    </ErrorBoundary>
  );
}

export default function App() {
  return <AppContent />;
}

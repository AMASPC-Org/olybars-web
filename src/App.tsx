import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { useUser } from "./contexts/UserContext";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "./components/common/SEO";
import { fetchVenues, updateVenueDetails } from "./services/venueService";
import { Venue } from "./types";
import { LoadingScreen } from "./components/common/LoadingScreen";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { AppShell } from "./components/layout/AppShell";
import { GlobalModals } from "./components/layout/GlobalModals";
import { ScrollToTop } from "./components/layout/ScrollToTop";
// import { InfoPopup } from "./components/ui/InfoPopup";

// --- CONTEXT PROCESSORS ---
import { DiscoveryProvider } from "./features/venues/contexts/DiscoveryContext";
import { LayoutProvider } from "./contexts/LayoutContext";

// --- LAZY ROUTES ---
const VenuesScreen = lazy(() => import("./features/venues/screens/VenuesScreen").then(m => ({ default: m.VenuesScreen })));
const VenueProfileScreen = lazy(() => import("./features/venues/screens/VenueProfileScreen").then(m => ({ default: m.VenueProfileScreen })));
const MapScreen = lazy(() => import("./features/map/screens/MapScreen").then(m => ({ default: m.MapScreen })));
const ProfileScreen = lazy(() => import("./features/profile/screens/UserProfileScreen"));
// const LeagueScreen = lazy(() => import("./features/league/screens/LeagueScreen").then(m => ({ default: m.LeagueScreen })));
// const LeagueLandingScreen = lazy(() => import("./features/league/screens/LeagueLandingScreen").then(m => ({ default: m.LeagueLandingScreen })));
const AdminDashboard = lazy(() => import("./features/admin/screens/AdminDashboardScreen").then(m => ({ default: m.AdminDashboardScreen })));
// const OwnerDashboard = lazy(() => import("./features/owner/screens/OwnerDashboardScreen").then(m => ({ default: m.OwnerDashboardScreen })));
const FlyerExtractor = lazy(() => import("./pages/admin/FlyerExtractor").then(m => ({ default: m.FlyerExtractor })));
// const VenueHandoverScreen = lazy(() => import("./features/owner/screens/VenueHandoverScreen").then(m => ({ default: m.VenueHandoverScreen })));
const PassportScreen = lazy(() => import("./features/league/screens/PassportScreen").then(m => ({ default: m.PassportScreen })));
const EventsScreen = lazy(() => import("./features/league/screens/EventsScreen").then(m => ({ default: m.EventsScreen })));
const KaraokeScreen = lazy(() => import("./features/league/screens/KaraokeScreen").then(m => ({ default: m.KaraokeScreen })));
const TriviaScreen = lazy(() => import("./features/league/screens/TriviaScreen").then(m => ({ default: m.TriviaScreen })));
const LiveMusicScreen = lazy(() => import("./features/league/screens/LiveMusicScreen").then(m => ({ default: m.LiveMusicScreen })));
const LeagueHQScreen = lazy(() => import("./features/league/screens/LeagueHQScreen").then(m => ({ default: m.LeagueHQScreen })));
const SmartOwnerRoute = lazy(() => import("./features/owner/routes/SmartOwnerRoute").then(m => ({ default: m.SmartOwnerRoute })));
const BackRoomScreen = lazy(() => import("./features/venues/screens/BackRoomScreen").then(m => ({ default: m.BackRoomScreen })));

// --- APP COMPONENT ---
export default function App() {
  const { data: venues = [], isLoading } = useQuery<Venue[]>({
    queryKey: ["venues"],
    queryFn: () => fetchVenues(),
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  const handleUpdateVenue = async (venueId: string, updates: any) => { // Using any to avoid strict type import issues for now
    await updateVenueDetails(venueId, updates);
  };

  const { userProfile, setUserProfile } = useUser();

  return (
    <ErrorBoundary>
      <DiscoveryProvider venues={venues} isLoading={isLoading}>
        <LayoutProvider>
          <ScrollToTop />
          <Suspense fallback={<LoadingScreen />}>
            <Routes>

              {/* Main App Shell */}
              <Route element={<AppShell />}>
                {/* Public Routes */}
                <Route path="/" element={<VenuesScreen />} />
                <Route path="/bars" element={<VenuesScreen />} />
                <Route path="/bars/:id" element={<VenueProfileScreen />} />
                <Route path="/map" element={<MapScreen />} />
                <Route path="/events" element={<EventsScreen />} />
                <Route path="/karaoke" element={<KaraokeScreen />} />
                <Route path="/trivia" element={<TriviaScreen />} />
                <Route path="/live-music" element={<LiveMusicScreen />} />
                <Route path="/league-hq" element={<LeagueHQScreen />} />

                {/* Protected / Feature Routes */}
                <Route path="/profile" element={<ProfileScreen userProfile={userProfile} setUserProfile={setUserProfile} venues={venues} />} />
                {/* <Route path="/league" element={<LeagueScreen />} /> */}
                {/* <Route path="/league-membership" element={<LeagueLandingScreen />} /> */}
                <Route path="/passport" element={<PassportScreen userProfile={userProfile} venues={venues} />} />
                <Route path="/back-room" element={<BackRoomScreen />} />

                {/* Owner (Smart Route) */}
                <Route path="/owner/*" element={<SmartOwnerRoute venues={venues} isLoading={isLoading} handleUpdateVenue={handleUpdateVenue} />} />
                {/* <Route path="/venue-handover/:token" element={<VenueHandoverScreen />} /> */}

                {/* Admin */}
                <Route path="/admin" element={<AdminDashboard userProfile={userProfile} />} />
                <Route path="/admin/extract" element={<FlyerExtractor />} />
              </Route>

            </Routes>

            {/* Global Modals (Auth, ClockIn, VibeRequest, etc) */}
            <GlobalModals />

            {/* Global Overlays - Removed unused InfoPopup */}
            <SEO />
          </Suspense>
        </LayoutProvider>
      </DiscoveryProvider>
    </ErrorBoundary>
  );
}

import React, { useState, useEffect, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import {
  Beer,
  X,
  Shield,
  ChevronRight,
  Info,
  Zap,
  Crown,
  Bell,
} from "lucide-react";
import {
  Venue,
  UserProfile,
  PartnerTier,
  TIER_CONFIG,
} from "../../../../types";
import {
  isVenueOwner,
  isVenueManager,
  isSystemAdmin,
} from "../../../../types/auth_schema";
import { useToast } from "../../../../components/ui/BrandedToast";
import { useVenueNotifications } from "../../hooks/useVenueNotifications";
import { VenueOpsService } from "../../../../services/VenueOpsService";

// Lazy Load Tabs
const OperationsTab = lazy(() => import("./OperationsTab"));
const MarketingTab = lazy(() => import("./MarketingTab"));
const ListingManagementTab = lazy(() =>
  import("../ListingManagementTab").then((module) => ({
    default: module.ListingManagementTab,
  })),
);
const LocalMakerManagementTab = lazy(() =>
  import("../LocalMakerManagementTab").then((module) => ({
    default: module.LocalMakerManagementTab,
  })),
);
const LeagueHostManagementTab = lazy(() =>
  import("../LeagueHostManagementTab").then((module) => ({
    default: module.LeagueHostManagementTab,
  })),
);
const UserManagementTab = lazy(() =>
  import("../UserManagementTab").then((module) => ({
    default: module.UserManagementTab,
  })),
);
const EventsManagementTab = lazy(() =>
  import("../EventsManagementTab").then((module) => ({
    default: module.EventsManagementTab,
  })),
);
const MenuManagementTab = lazy(() =>
  import("../MenuManagementTab").then((module) => ({
    default: module.MenuManagementTab,
  })),
);
const ScraperManagementTab = lazy(() =>
  import("../ScraperManagementTab").then((module) => ({
    default: module.ScraperManagementTab,
  })),
);
const PartnerManualTab = lazy(() =>
  import("../PartnerManualTab").then((module) => ({
    default: module.PartnerManualTab,
  })),
);
const BackRoomManagementTab = lazy(() =>
  import("../BackRoomManagementTab").then((module) => ({
    default: module.BackRoomManagementTab,
  })),
);
const NotificationsTab = lazy(() =>
  import("../NotificationsTab").then((module) => ({
    default: module.NotificationsTab,
  })),
);
const ReportsTab = lazy(() => import("./ReportsTab"));
const QrAssetsTab = lazy(() => import("./QrAssetsTab"));

interface DashboardShellProps {
  isOpen: boolean;
  onClose: () => void;
  venues: Venue[];
  updateVenue: (venueId: string, updates: Partial<Venue>) => Promise<void>;
  userProfile: UserProfile;
  initialVenueId?: string | null;
  initialView?: string;
  isLoading?: boolean;
}

export function DashboardShell({
  isOpen,
  onClose,
  venues,
  updateVenue,
  userProfile,
  initialVenueId,
  initialView = "main",
  isLoading = false,
}: DashboardShellProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // -- State --
  // Accessible Venues Logic
  const accessibleVenues = venues.filter((v) => {
    if (isSystemAdmin(userProfile)) return true;
    return isVenueManager(userProfile, v.id);
  });

  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(
    initialVenueId || null,
  );

  // Auto-select first venue
  useEffect(() => {
    if (!selectedVenueId && accessibleVenues.length > 0) {
      setSelectedVenueId(accessibleVenues[0].id);
    }
  }, [accessibleVenues, selectedVenueId]);

  const myVenue =
    accessibleVenues.find((v) => v.id === selectedVenueId) ||
    accessibleVenues[0];

  const [dashboardView, setDashboardView] = useState<string>(initialView);
  const [showWelcome, setShowWelcome] = useState(true);

  // Private Data State
  const [privateData, setPrivateData] = useState<any>(null);
  const [isLoadingPrivate, setIsLoadingPrivate] = useState(false);

  // Notifications
  const { count: notificationCount, hasNotifications } = useVenueNotifications(
    myVenue?.id,
  );

  // View Sync
  useEffect(() => {
    if (isOpen) {
      if (initialVenueId) setSelectedVenueId(initialVenueId);
      if (initialView) setDashboardView(initialView);
    }
  }, [isOpen, initialVenueId, initialView]);

  // Fetch Private Data
  useEffect(() => {
    if (selectedVenueId && isOpen) {
      fetchPrivateData();
    }
  }, [selectedVenueId, isOpen]);

  const fetchPrivateData = async () => {
    if (!selectedVenueId) return;
    setIsLoadingPrivate(true);
    try {
      const data = await VenueOpsService.getPrivateData(selectedVenueId);
      setPrivateData(data);
    } catch (e) {
      console.error("Failed to fetch private data:", e);
    } finally {
      setIsLoadingPrivate(false);
    }
  };

  if (!isOpen) return null;
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[80] bg-background flex flex-col items-center justify-center p-6 animate-in fade-in">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold uppercase text-white tracking-widest">
          Loading Venues...
        </h2>
      </div>
    );
  }

  if (!myVenue && accessibleVenues.length === 0) {
    return (
      <div className="fixed inset-0 z-[80] bg-background text-white flex flex-col items-center justify-center p-6">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold uppercase">Access Denied</h2>
        <p className="text-slate-400 text-center mt-2 max-w-xs">
          {venues.length === 0
            ? "No active venues found in the system."
            : "Your account does not have management permissions for any active venues."}
        </p>
        <div className="mt-4 p-2 bg-slate-900 rounded text-[10px] font-mono text-slate-500">
          Debug: {isSystemAdmin(userProfile) ? "SuperAdmin" : "Standard"} /{" "}
          {venues.length} Venues / UID: {userProfile.uid}
        </div>
        <button
          onClick={onClose}
          className="mt-8 bg-slate-800 px-6 py-2 rounded-md font-bold uppercase"
        >
          Back to Pulse
        </button>
      </div>
    );
  }

  // -- Render --
  return (
    <div className="fixed inset-0 z-[80] bg-[#0f172a] text-white flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex justify-between items-start shrink-0 bg-black">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-3 rounded-lg border border-white/20">
            <Beer className="w-8 h-8 text-black" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter font-league leading-none">
                THE BREW HOUSE
              </h2>
              <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/30 font-black uppercase tracking-widest">
                Admin Dashboard
              </span>
            </div>
            <div className="flex flex-col mt-2">
              {accessibleVenues.length > 1 ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-league">
                    Managing:
                  </span>
                  <div className="relative inline-block">
                    <select
                      value={selectedVenueId || ""}
                      onChange={(e) => setSelectedVenueId(e.target.value)}
                      className="bg-primary/10 text-primary text-sm font-black uppercase tracking-widest outline-none appearance-none pl-2 pr-8 py-1 rounded border border-primary/20 cursor-pointer font-league hover:bg-primary/20 transition-colors"
                    >
                      {accessibleVenues.map((v) => (
                        <option
                          key={v.id}
                          value={v.id}
                          className="bg-[#0f172a]"
                        >
                          {v.name}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="w-3 h-3 text-primary absolute right-2 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-primary font-black uppercase tracking-widest font-league flex items-center gap-2">
                  <span className="text-slate-500">Managing:</span>{" "}
                  {myVenue?.name}
                </p>
              )}
            </div>
          </div>
        </div>
        {/* Right Actions */}
        <div className="ml-8 hidden md:flex items-center gap-3">
          <div className="px-3 py-1 bg-slate-800 rounded-md border border-white/10 flex flex-col items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-league">
              {privateData?.partnerConfig?.tier ||
                myVenue.partnerConfig?.tier ||
                PartnerTier.LOCAL}{" "}
              TIER
            </span>
            <div className="flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-primary fill-current" />
              <span className="text-[10px] font-black text-primary font-league">
                {(TIER_CONFIG[
                  (privateData?.partnerConfig?.tier ||
                    myVenue.partnerConfig?.tier ||
                    PartnerTier.LOCAL) as PartnerTier
                ]?.flashBountyLimit || 0) -
                  (privateData?.partnerConfig?.flashBountiesUsed ||
                    myVenue.partnerConfig?.flashBountiesUsed ||
                    0)}{" "}
                TOKENS
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              navigate("/league-membership");
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black px-4 py-2 rounded-md shadow-lg shadow-yellow-900/20 hover:scale-105 transition-transform group"
          >
            <Crown className="w-4 h-4 text-black fill-black" />
            <span className="text-[10px] font-black uppercase tracking-widest font-league">
              LEVEL UP
            </span>
          </button>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-10 h-10" strokeWidth={4} />
          </button>
        </div>
        {/* Mobile Close */}
        <button
          onClick={onClose}
          className="md:hidden text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-8 h-8" strokeWidth={3} />
        </button>
      </div>

      {/* Gatekeeper Welcome Notice */}
      {showWelcome && (
        <div className="bg-blue-900/20 border-b border-blue-500/20 p-4 relative animate-in fade-in slide-in-from-top-2">
          <div className="flex gap-4 items-start max-w-4xl mx-auto">
            <Info className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
            <div>
              <h4 className="text-blue-400 font-black uppercase tracking-widest text-sm mb-1">
                Welcome to The Brew House
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                This is where the 98501 League is crafted.
                <span className="block mt-2 text-slate-400">
                  <strong>Note:</strong> League Host tools and Local Maker
                  designations are gated features. To activate these for your
                  venue, click the "Request Activation" button in your settings.
                  The Commish manually vets all hosts to ensure we maintain the
                  quality of the Artesian Anchor network.
                </span>
              </p>
            </div>
            <button
              onClick={() => setShowWelcome(false)}
              className="ml-auto text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center overflow-x-auto whitespace-nowrap bg-black border-b border-white/5 scroll-smooth no-scrollbar">
        <button
          onClick={() => setDashboardView("notifications")}
          className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 flex items-center gap-2 relative ${dashboardView === "notifications" ? "text-primary border-primary" : "text-slate-500 border-transparent"}`}
        >
          <Bell className="w-3 h-3" />
          Notifications
          {hasNotifications && (
            <span className="absolute top-2 right-2 flex bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 items-center justify-center shadow-md animate-in zoom-in">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        {[
          { id: "main", label: "Operations" },
          { id: "marketing", label: "Marketing" },
          { id: "events", label: "Events" },
          { id: "listing", label: "Listing" },
          { id: "menu", label: "THE MENU" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setDashboardView(tab.id)}
            className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === tab.id ? "text-primary border-primary" : "text-slate-500 border-transparent"}`}
          >
            {tab.label}
          </button>
        ))}

        {myVenue && isVenueOwner(userProfile, myVenue.id) && (
          <>
            {(isVenueOwner(userProfile, myVenue.id) ||
              myVenue.managersCanAddUsers) && (
              <button
                onClick={() => setDashboardView("people")}
                className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === "people" ? "text-primary border-primary" : "text-slate-500 border-transparent"}`}
              >
                People
              </button>
            )}
            {isVenueManager(userProfile, myVenue.id) && (
              <button
                onClick={() => setDashboardView("reports")}
                className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === "reports" ? "text-primary border-primary" : "text-slate-500 border-transparent"}`}
              >
                Reports
              </button>
            )}
            <button
              onClick={() => setDashboardView("qr")}
              className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === "qr" ? "text-primary border-primary" : "text-slate-500 border-transparent"}`}
            >
              QR Assets
            </button>
            <button
              onClick={() => setDashboardView("manual")}
              className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === "manual" ? "text-primary border-primary" : "text-slate-500 border-transparent"}`}
            >
              THE MANUAL
            </button>
            <button
              onClick={() => setDashboardView("backroom")}
              className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === "backroom" ? "text-primary border-primary" : "text-slate-500 border-transparent"}`}
            >
              Back Room
            </button>
            {myVenue.isLocalMaker && (
              <button
                onClick={() => setDashboardView("maker")}
                className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === "maker" ? "text-primary border-primary" : "text-slate-500 border-transparent"}`}
              >
                Local Maker
              </button>
            )}
            <button
              onClick={() => setDashboardView("host")}
              className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === "host" ? "text-primary border-primary" : "text-slate-500 border-transparent"}`}
            >
              League
            </button>
          </>
        )}

        <button
          onClick={() => setDashboardView("scraper")}
          className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === "scraper" ? "text-primary border-primary" : "text-slate-500 border-transparent"}`}
        >
          Scrapers
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto space-y-8 p-6 pb-24">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 uppercase font-black tracking-widest animate-pulse">
                Loading Module...
              </p>
            </div>
          }
        >
          {myVenue && dashboardView === "main" && (
            <OperationsTab
              venue={myVenue}
              updateVenue={updateVenue}
              setDashboardView={setDashboardView}
              isLoadingPrivate={isLoadingPrivate}
              userProfile={userProfile}
            />
          )}
          {myVenue && dashboardView === "marketing" && (
            <MarketingTab
              venue={myVenue}
              updateVenue={updateVenue}
              userProfile={userProfile}
              privateData={privateData}
            />
          )}
          {myVenue && dashboardView === "listing" && (
            <ListingManagementTab
              venue={myVenue}
              venues={venues} // Pass all venues if needed, usually just myVenue
              onUpdate={updateVenue}
              userProfile={userProfile}
            />
          )}
          {myVenue && dashboardView === "backroom" && (
            <BackRoomManagementTab
              venue={myVenue}
              onUpdate={(updates: any) => updateVenue(myVenue.id, updates)}
            />
          )}
          {myVenue && dashboardView === "menu" && (
            <MenuManagementTab
              venue={myVenue}
              onUpdate={(id: any, updates: any) => updateVenue(id, updates)}
              userId={userProfile.uid}
              userProfile={userProfile}
            />
          )}
          {myVenue && dashboardView === "scraper" && (
            <ScraperManagementTab
              venue={myVenue}
              onUpdate={updateVenue}
              userProfile={userProfile}
              onNavigate={(view: string) => setDashboardView(view)}
              notificationCount={notificationCount}
            />
          )}
          {myVenue && dashboardView === "events" && (
            <EventsManagementTab venue={myVenue} />
          )}
          {myVenue && dashboardView === "maker" && (
            <LocalMakerManagementTab
              venue={myVenue}
              onUpdate={updateVenue}
              venues={venues}
            />
          )}
          {myVenue && dashboardView === "host" && (
            <LeagueHostManagementTab venue={myVenue} onUpdate={updateVenue} />
          )}
          {myVenue && dashboardView === "people" && (
            <UserManagementTab
              venue={myVenue}
              onUpdate={(updates: any) => updateVenue(myVenue.id, updates)}
              currentUser={userProfile}
            />
          )}
          {myVenue && dashboardView === "reports" && (
            <ReportsTab venue={myVenue} />
          )}
          {myVenue && dashboardView === "qr" && <QrAssetsTab venue={myVenue} />}
          {myVenue && dashboardView === "manual" && <PartnerManualTab />}
          {myVenue && dashboardView === "notifications" && (
            <NotificationsTab
              venueId={myVenue.id}
              onNavigate={(view) => setDashboardView(view)}
            />
          )}
        </Suspense>
      </div>

      {/* Footer */}
      <div className="p-4 bg-black border-t border-white/10 shrink-0">
        <button
          onClick={onClose}
          className="w-full bg-white text-[#0f172a] font-black py-4 rounded-lg shadow-xl uppercase tracking-widest font-league text-lg active:scale-95 transition-transform"
        >
          Back to Pulse
        </button>
      </div>
    </div>
  );
}

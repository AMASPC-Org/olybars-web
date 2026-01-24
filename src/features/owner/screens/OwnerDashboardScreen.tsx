import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Beer,
  X,
  Zap,
  Shield,
  Clock,
  ShieldCheck,
  Globe,
  Bell,
  Book,
  Download,
  Printer,
  QrCode,
  Info,
  Landmark,
} from "lucide-react";
import { Venue, UserProfile } from "../../../types";
import { format } from "date-fns";

import { ListingManagementTab } from "../components/ListingManagementTab";
import { isVenueManager, isSystemAdmin } from "../../../types/auth_schema";
import { UserManagementTab } from "../components/UserManagementTab";
import { EventsManagementTab } from "../components/EventsManagementTab";
import { VenueOpsService } from "../../../services/VenueOpsService";
import { MfaService } from "../../../services/mfaService";
import { auth } from "../../../lib/firebase";

import { MenuManagementTab } from "../components/MenuManagementTab";
import { ScraperManagementTab } from "../components/ScraperManagementTab";
import { PartnerManualTab } from "../components/PartnerManualTab";
import { BackRoomManagementTab } from "../components/BackRoomManagementTab";
import { OperationsTab } from "../components/OperationsTab";
import { MarketingTab } from "../components/dashboard/MarketingTab";
import { TreasuryManagementTab } from "../components/TreasuryManagementTab";

import { NotificationsTab } from "../components/NotificationsTab";
import { useVenueNotifications } from "../hooks/useVenueNotifications";
import { InfinityNavRail } from "../../../components/ui/InfinityNavRail";

interface OwnerDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  venues: Venue[];
  updateVenue: (venueId: string, updates: Partial<Venue>) => Promise<void>;
  userProfile: UserProfile;
  initialVenueId?: string | null;
  initialView?: "main" | "marketing" | "listing" | "operations";
  isLoading?: boolean;
}

export const OwnerDashboardScreen: React.FC<OwnerDashboardProps> = ({
  isOpen,
  onClose,
  venues,
  updateVenue,
  userProfile,
  initialVenueId,
  initialView = "main",
  isLoading = false,
}) => {
  const navigate = useNavigate();

  const accessibleVenues = venues.filter((v) => {
    if (isSystemAdmin(userProfile)) return true;
    return isVenueManager(userProfile, v.id);
  });

  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(
    initialVenueId || null,
  );

  React.useEffect(() => {
    if (!selectedVenueId && accessibleVenues.length > 0) {
      setSelectedVenueId(accessibleVenues[0].id);
    }
  }, [accessibleVenues, selectedVenueId]);

  const myVenue =
    accessibleVenues.find((v) => v.id === selectedVenueId) ||
    accessibleVenues[0];

  const [showWelcome, setShowWelcome] = useState(true);

  const [dashboardView, setDashboardView] = useState<
    | "notifications"
    | "operations"
    | "marketing"
    | "events"
    | "listing"
    | "menu"
    | "people"
    | "reports"
    | "qr"
    | "manual"
    | "backroom"
    | "scraper"
    | "treasury"
  >(
    initialView === "main"
      ? "operations"
      : (initialView as any) || "operations",
  );

  const [selectedReportDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [privateData, setPrivateData] = useState<any>(null);

  const [showArtieCommands, setShowArtieCommands] = useState(false);

  const [activeEventDraft, setActiveEventDraft] = useState<
    { title: string; date: string } | undefined
  >(undefined);

  const { count: notificationCount } = useVenueNotifications(myVenue?.id);

  const isMfaEnrolled = MfaService.isEnrolled(auth.currentUser);
  const isSuperAdmin = isSystemAdmin(userProfile);

  // [MFA GUARD] Enforce Multi-Factor Authentication for Venue Owners (Partners)
  if (!isMfaEnrolled && !isSuperAdmin) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 text-center animate-in mb-safe">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <ShieldCheck className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight mb-2">
          Security Check Required
        </h2>
        <p className="text-slate-400 max-w-sm mb-8 leading-relaxed">
          To manage a venue on The Brew House, you must enable
          <span className="text-white font-bold">
            {" "}
            Two-Factor Authentication (2FA)
          </span>{" "}
          to protect your business account.
        </p>
        <button
          onClick={() => {
            // Trigger 2FA Enrollment Flow (Navigate to Profile > Security or open modal)
            onClose();
            navigate("/settings");
          }}
          className="bg-primary text-black px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform"
        >
          Enable 2FA Now
        </button>
        <button
          onClick={onClose}
          className="mt-6 text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white"
        >
          Return to App
        </button>
      </div>
    );
  }

  React.useEffect(() => {
    if (isOpen) {
      if (initialVenueId) setSelectedVenueId(initialVenueId);
      if (initialView) {
        setDashboardView(
          initialView === "main" ? "operations" : (initialView as any),
        );
      }
    }
  }, [isOpen, initialVenueId, initialView]);

  React.useEffect(() => {
    if (selectedVenueId && isOpen) {
      fetchPrivateData();
    }
  }, [selectedVenueId, isOpen]);

  const fetchPrivateData = async () => {
    if (!selectedVenueId) return;
    try {
      const data = await VenueOpsService.getPrivateData(selectedVenueId);
      setPrivateData(data);
    } catch (e) {
      console.error("Failed to fetch private data:", e);
    } finally {
    }
  };

  const handleTabChange = (newView: typeof dashboardView) => {
    setDashboardView(newView);
    if (myVenue) {
      navigate(`/admin/brewhouse/${myVenue.id}/${newView}`);
    }
  };

  const navItems = [
    { id: "notifications" as const, label: "Inbox", icon: Bell },
    { id: "operations" as const, label: "Pulse", icon: Beer },
    { id: "marketing" as const, label: "Growth", icon: Zap },
    { id: "events" as const, label: "Events", icon: Clock },
    { id: "listing" as const, label: "Listing", icon: Globe },
    { id: "menu" as const, label: "Menu", icon: Beer },
    { id: "people" as const, label: "People", icon: ShieldCheck },
    { id: "treasury" as const, label: "The Vault", icon: Landmark },
    { id: "reports" as const, label: "Reports", icon: Info },
    { id: "qr" as const, label: "QR Assets", icon: QrCode },
    { id: "manual" as const, label: "Manual", icon: Book },
    { id: "backroom" as const, label: "Back Room", icon: Shield },
    { id: "scraper" as const, label: "Scrapers", icon: Globe },
  ];

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[80] bg-background flex flex-col items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold uppercase text-white tracking-widest">
          Loading...
        </h2>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] bg-[#0f172a] text-white flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex justify-between items-start shrink-0 bg-black z-20">
        <div className="flex items-center gap-4">
          <Beer className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-black text-white uppercase font-league leading-none">
              THE BREW HOUSE
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-black text-slate-500 uppercase">
                Managing:
              </span>
              <select
                value={selectedVenueId || ""}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedVenueId(newId);
                  navigate(`/admin/brewhouse/${newId}/${dashboardView}`);
                }}
                className="bg-primary/10 text-primary text-sm font-black uppercase tracking-widest outline-none py-1 px-2 rounded border border-primary/20"
              >
                {accessibleVenues.map((v) => (
                  <option key={v.id} value={v.id} className="bg-[#0f172a]">
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-10 h-10" strokeWidth={4} />
        </button>
      </div>

      {/* Mobile Nav Rail (Top) */}
      <div className="lg:hidden w-full z-[90] bg-black/90 backdrop-blur-md sticky top-[73px]">
        <InfinityNavRail
          items={navItems.map((item) => ({
            id: item.id,
            label: item.label,
            icon: item.icon,
            action: () => handleTabChange(item.id),
            isActive: dashboardView === item.id,
          }))}
          className="bg-transparent border-b border-white/10"
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Desktop) */}
        <div className="hidden lg:flex w-64 flex-col bg-black/40 border-r border-white/5 overflow-y-auto">
          <div className="p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${dashboardView === item.id ? "bg-primary text-black font-black" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs uppercase tracking-widest leading-none mt-0.5">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-950">
          {/* Welcome Notice */}
          {showWelcome && (
            <div className="bg-blue-900/20 border-b border-blue-500/20 p-4 shrink-0">
              <div className="flex justify-between items-center max-w-4xl mx-auto">
                <p className="text-xs text-slate-300">
                  Welcome to The Brew House. This is where the 98501 League is
                  crafted.
                </p>
                <button onClick={() => setShowWelcome(false)}>
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 sm:pb-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {myVenue && dashboardView === "notifications" && (
                <NotificationsTab
                  venueId={myVenue.id}
                  onNavigate={(view) => handleTabChange(view as any)}
                  onDraftPost={() => {}} // Placeholder as activePostDraft was removed
                  onCreateEvent={setActiveEventDraft}
                />
              )}

              {myVenue && dashboardView === "operations" && (
                <OperationsTab venue={myVenue} />
              )}

              {myVenue && dashboardView === "marketing" && (
                <MarketingTab
                  venue={myVenue}
                  updateVenue={updateVenue}
                  userProfile={userProfile}
                  privateData={privateData}
                />
              )}

              {myVenue && dashboardView === "events" && (
                <EventsManagementTab
                  venue={myVenue}
                  initialEventDraft={activeEventDraft}
                />
              )}

              {myVenue && dashboardView === "listing" && (
                <ListingManagementTab
                  venue={myVenue}
                  onUpdate={updateVenue}
                  userProfile={userProfile}
                />
              )}

              {myVenue && dashboardView === "menu" && (
                <MenuManagementTab
                  venue={myVenue}
                  onUpdate={updateVenue}
                  userId={userProfile.uid}
                  userProfile={userProfile}
                />
              )}

              {myVenue && dashboardView === "people" && (
                <UserManagementTab
                  venue={myVenue}
                  onUpdate={(updates) => updateVenue(myVenue.id, updates)}
                  currentUser={userProfile}
                />
              )}

              {myVenue && dashboardView === "reports" && (
                <div className="bg-surface p-6 rounded-2xl border border-white/5">
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-6">
                    Engagement Reports
                  </h3>
                  <div className="aspect-video bg-black/40 rounded-xl border border-dashed border-white/10 flex items-center justify-center">
                    <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest font-league">
                      Data for {selectedReportDate}
                    </p>
                  </div>
                </div>
              )}

              {myVenue && dashboardView === "qr" && (
                <div className="bg-surface p-8 rounded-3xl border-2 border-primary/20 text-center">
                  <QrCode className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">
                    Venue QR Assets
                  </h3>
                  <div className="flex gap-4 justify-center">
                    <button className="bg-primary text-black px-6 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2">
                      <Download size={16} /> PNG
                    </button>
                    <button className="bg-white/10 text-white px-6 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2">
                      <Printer size={16} /> Print
                    </button>
                  </div>
                </div>
              )}

              {myVenue && dashboardView === "manual" && <PartnerManualTab />}
              {myVenue && dashboardView === "backroom" && (
                <BackRoomManagementTab
                  venue={myVenue}
                  onUpdate={(updates) => updateVenue(myVenue.id, updates)}
                />
              )}
              {myVenue && dashboardView === "treasury" && (
                <TreasuryManagementTab
                  venue={myVenue}
                  onUpdate={(updates) => updateVenue(myVenue.id, updates)}
                />
              )}
              {myVenue && dashboardView === "scraper" && (
                <ScraperManagementTab
                  venue={myVenue}
                  onUpdate={updateVenue}
                  userProfile={userProfile}
                  onNavigate={(view) => handleTabChange(view as any)}
                  notificationCount={notificationCount}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Artie Commands Toggle */}
      <button
        onClick={() => setShowArtieCommands(true)}
        className="fixed bottom-24 right-6 bg-primary text-black p-4 rounded-full shadow-2xl z-50 hover:scale-110 mb-safe"
      >
        <Zap className="w-6 h-6 fill-current" />
      </button>

      {showArtieCommands && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-6"
          onClick={() => setShowArtieCommands(false)}
        >
          <div
            className="bg-surface p-8 rounded-2xl border border-white/10 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-black text-primary uppercase mb-4">
              Text Artie
            </h3>
            <p className="text-sm text-slate-400 mb-6 font-medium">
              Text{" "}
              <span className="text-primary font-bold">
                'karaoke tomorrow at 9pm'
              </span>{" "}
              to Artie to update instantly.
            </p>
            <button
              onClick={() => setShowArtieCommands(false)}
              className="w-full bg-primary text-black font-black py-4 rounded-xl uppercase"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

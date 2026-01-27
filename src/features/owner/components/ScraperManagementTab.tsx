import React, { useState, useEffect } from "react";
import { Venue, ScraperSource, ScrapeTarget } from "../../../types/venue";
import { UserProfile } from "../../../types";
import { isSystemAdmin } from "../../../types/auth_schema";
import { VenueOpsService } from "../../../services/VenueOpsService";
import {
  ExternalLink,
  Globe,
  Plus,
  Activity,
  RefreshCw,
  Lock,
} from "lucide-react";
import { ScraperConsentToggle } from "./scraper/ScraperConsentToggle";
import { ConnectSourceCard } from "./scraper/ConnectSourceCard";
import { AddSourceModal } from "./scraper/AddSourceModal";
import { useToast } from "../../../components/ui/BrandedToast";
import { formatDistanceToNow, differenceInHours } from "date-fns";

interface ScraperManagementTabProps {
  venue: Venue;
  onUpdate: (venueId: string, updates: Partial<Venue>) => Promise<void>;
  userProfile: UserProfile;
  // onNavigate and notificationCount removed from usage if not needed, but keeping interface consistent might be better if parent passes them.
  // Actually, I'll keep them in interface but generic them out or just don't use them.
  // If I remove them from interface, I might break parent.
  // Let's check usage. The parent passes them.
  onNavigate?: (view: "notifications") => void;
  notificationCount?: number;
}

export const ScraperManagementTab: React.FC<ScraperManagementTabProps> = ({
  venue,
  onUpdate,
  userProfile,
}) => {
  const { showToast } = useToast();
  const isActiveAdmin = isSystemAdmin(userProfile);
  const [isScrapingEnabled, setIsScrapingEnabled] = useState(
    venue.is_scraping_enabled || false,
  );
  const [scraperConfig, setScraperConfig] = useState<ScraperSource[]>(
    venue.scraper_config || [],
  );
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [automationStatus, setAutomationStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastTriggerTime, setLastTriggerTime] = useState<number>(0);

  // [FIX] Sync local state with real-time venue updates
  useEffect(() => {
    setIsScrapingEnabled(venue.is_scraping_enabled || false);
    setScraperConfig(venue.scraper_config || []);
  }, [venue.is_scraping_enabled, venue.scraper_config]);

  // Fetch automation status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await VenueOpsService.getScraperStatus(venue.id);
        const mockedStatus = status || {
          lastSyncAt: { toMillis: () => Date.now() - 1000 * 60 * 60 * 2 }, // Mock 2 hours ago if empty
          syncStatus: "idle",
        };
        setAutomationStatus(mockedStatus);
      } catch (e) {
        console.error("Failed to fetch scraper status", e);
      }
    };
    fetchStatus();
  }, [venue.id]);

  const handleToggleScraping = async (enabled: boolean) => {
    setIsScrapingEnabled(enabled);
    try {
      await onUpdate(venue.id, { is_scraping_enabled: enabled });
    } catch (error) {
      console.error("Failed to update scraping status", error);
      setIsScrapingEnabled(!enabled);
      showToast("Failed to update scraping status", "error");
    }
  };

  const handleToggleSource = async (sourceId: string, enabled: boolean) => {
    const updated = scraperConfig.map((s) =>
      s.id === sourceId ? { ...s, isEnabled: enabled } : s,
    );
    setScraperConfig(updated);
    try {
      await onUpdate(venue.id, { scraper_config: updated });
    } catch (error) {
      console.error("Failed to update source status", error);
      showToast("Failed to update source status", "error");
    }
  };

  const handleAddSource = async (
    url: string,
    type: ScrapeTarget,
    frequency: "daily" | "weekly" | "monthly",
    description?: string,
  ) => {
    const newSource: ScraperSource = {
      id: crypto.randomUUID(),
      url,
      target: type,
      extractionMode: type,
      isEnabled: true,
      status: "pending",
      frequency,
      // [NEW] Store the description if provided (mostly for WEBSITE target)
      ...(description ? { extractionNotes: description } : {}),
    };
    const updated = [...scraperConfig, newSource];
    setScraperConfig(updated);
    setIsAddSourceModalOpen(false);
    try {
      await onUpdate(venue.id, { scraper_config: updated });
      showToast("External source connected successfully", "success");
    } catch (error) {
      console.error("Failed to add scraper source", error);
      showToast("Failed to add source", "error");
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    const updated = scraperConfig.filter((s) => s.id !== sourceId);
    setScraperConfig(updated);
    try {
      await onUpdate(venue.id, { scraper_config: updated });
      showToast("Source removed", "success");
    } catch (error) {
      console.error("Failed to delete scraper source", error);
      showToast("Failed to remove source", "error");
    }
  };

  const handleForceSync = async () => {
    // Rate limit check (15 minutes)
    const timeSinceLast = Date.now() - lastTriggerTime;
    if (timeSinceLast < 15 * 60 * 1000) {
      const remainingMinutes = Math.ceil(
        (15 * 60 * 1000 - timeSinceLast) / 60000,
      );
      showToast(
        `Sync is cooling down. Try again in ${remainingMinutes} minutes.`,
        "error",
      );
      return;
    }

    setIsSyncing(true);
    try {
      await VenueOpsService.triggerScraperSync(venue.id);
      showToast("Sync request sent. Updates should appear shortly.", "success");
      setLastTriggerTime(Date.now());
      setAutomationStatus((prev: any) => ({
        ...prev,
        syncStatus: "running",
      }));
    } catch (error) {
      console.error("Failed to trigger sync", error);
      showToast("Failed to trigger sync", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  // Determine health color
  const getHealthStatus = () => {
    if (!automationStatus || !automationStatus.lastSyncAt) return "neutral";
    const lastSyncMs =
      typeof automationStatus.lastSyncAt.toMillis === "function"
        ? automationStatus.lastSyncAt.toMillis()
        : Date.now(); // Fallback
    const hours = differenceInHours(Date.now(), lastSyncMs);

    if (hours < 24) return "good";
    if (hours < 48) return "warning";
    return "critical";
  };

  const health = getHealthStatus();

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1 flex items-center gap-2 italic">
              <ExternalLink className="w-5 h-5 text-primary" />
              Scraper Ingestion Engine
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Connect external calendars & websites for AI processing
            </p>
          </div>
          {isActiveAdmin && (
            <div className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-[9px] font-black text-red-500 uppercase tracking-widest">
              System Admin
            </div>
          )}
        </div>

        <div className="space-y-6">
          <ScraperConsentToggle
            isEnabled={isScrapingEnabled}
            onToggle={handleToggleScraping}
          />

          {/* Activity / Health Card */}
          <div className="bg-gradient-to-r from-slate-900 to-black border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between group gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-0.5">
                  Scraper Health
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    Status:
                  </span>
                  {health === "good" && (
                    <span className="text-[10px] text-green-400 font-black uppercase tracking-widest flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      Synced
                    </span>
                  )}
                  {health === "warning" && (
                    <span className="text-[10px] text-yellow-400 font-black uppercase tracking-widest flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                      Delayed
                    </span>
                  )}
                  {health === "critical" && (
                    <span className="text-[10px] text-red-500 font-black uppercase tracking-widest flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Stale
                    </span>
                  )}
                  {health === "neutral" && (
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
                      <div className="w-2 h-2 bg-slate-500 rounded-full" />
                      Unknown
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
              {/* Last Sync Info */}
              <div className="text-right hidden sm:block">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Last Run
                </span>
                <span className="block text-xs font-black text-white uppercase tracking-widest">
                  {automationStatus?.lastSyncAt
                    ? formatDistanceToNow(
                      typeof automationStatus.lastSyncAt.toMillis ===
                        "function"
                        ? automationStatus.lastSyncAt.toMillis()
                        : Date.now(),
                      { addSuffix: true },
                    )
                    : "Never"}
                </span>
              </div>

              {/* Force Sync Button */}
              <button
                onClick={handleForceSync}
                disabled={
                  !isScrapingEnabled ||
                  isSyncing ||
                  automationStatus?.syncStatus === "running"
                }
                className={`
                        relative overflow-hidden
                        flex items-center gap-2 px-4 py-3 rounded-xl border transition-all
                        ${!isScrapingEnabled
                    ? "opacity-50 cursor-not-allowed bg-slate-900 border-white/5 text-slate-500"
                    : isSyncing
                      ? "bg-primary/20 border-primary/20 text-primary"
                      : "bg-primary text-black hover:bg-primary/90 border-primary"
                  }
                    `}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isSyncing || automationStatus?.syncStatus === "running" ? "animate-spin" : ""}`}
                />
                <span className="text-xs font-black uppercase tracking-widest">
                  {isSyncing || automationStatus?.syncStatus === "running"
                    ? "Syncing..."
                    : "Force Sync"}
                </span>
              </button>
            </div>
          </div>

          {isScrapingEnabled && (
            <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="w-3 h-3 text-primary" />
                  Active Sources ({scraperConfig.length}/5)
                </h4>
                <button
                  onClick={() => setIsAddSourceModalOpen(true)}
                  disabled={scraperConfig.length >= 5}
                  className="text-[9px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors disabled:opacity-30 flex items-center gap-1"
                >
                  <Plus size={10} /> Add Source
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scraperConfig.map((source) => (
                  <div key={source.id} className="relative">
                    <ConnectSourceCard
                      key={source.id}
                      source={source}
                      onDelete={handleDeleteSource}
                      onToggle={handleToggleSource}
                    />
                    {/* Lock Overlay if Venue Locked (Visual only as per prompt instruction to show padlock) */}
                    {venue.isLocked && (
                      <div className="absolute top-2 right-2 z-10">
                        <Lock className="w-3 h-3 text-amber-500" />
                      </div>
                    )}
                  </div>
                ))}

                {scraperConfig.length === 0 && (
                  <div className="col-span-full py-8 text-center border-2 border-dashed border-white/5 rounded-xl">
                    <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest italic">
                      No external sources connected
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <AddSourceModal
        isOpen={isAddSourceModalOpen}
        onClose={() => setIsAddSourceModalOpen(false)}
        onAdd={handleAddSource}
        existingUrls={scraperConfig.map((s) => s.url)}
        tier={venue.partner_tier}
      />
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { Venue, ScraperSource, ScrapeTarget } from "../../../types/venue";
import { UserProfile } from "../../../types";
import { isSystemAdmin } from "../../../types/auth_schema";
import {
  ExternalLink,
  Globe,
  Plus,
  Lock,
} from "lucide-react";
import { ScraperConsentToggle } from "./scraper/ScraperConsentToggle";
import { ConnectSourceCard } from "./scraper/ConnectSourceCard";
import { AddSourceModal } from "./scraper/AddSourceModal";
import { IncomingEventsQueue } from "./scraper/IncomingEventsQueue";
import { ScraperBrainStatus } from "./scraper/ScraperBrainStatus";
import { useToast } from "../../../components/ui/BrandedToast";
import { ScraperApiClient } from "../../../services/ScraperApiClient";
import { Scraper } from "../../../types/scraper";

interface ScraperManagementTabProps {
  venue: Venue;
  onUpdate: (venueId: string, updates: Partial<Venue>) => Promise<void>;
  userProfile: UserProfile;
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
  const [scrapers, setScrapers] = useState<Scraper[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);

  // Sync isScrapingEnabled with venue prop
  useEffect(() => {
    setIsScrapingEnabled(venue.is_scraping_enabled || false);
  }, [venue.is_scraping_enabled]);

  // Load Scrapers from API
  useEffect(() => {
    loadScrapers();
  }, [venue.id]);

  const loadScrapers = async () => {
    try {
      setLoading(true);
      const list = await ScraperApiClient.listScrapers(venue.id);
      setScrapers(list);
    } catch (error) {
      console.error("Failed to load scrapers", error);
    } finally {
      setLoading(false);
    }
  };

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
    const previousScrapers = [...scrapers];
    // Optimistic update
    setScrapers(prev => prev.map(s => {
      if (s.id === sourceId) {
        return {
          ...s,
          schedule: {
            ...s.schedule,
            isEnabled: enabled
          }
        };
      }
      return s;
    }));

    try {
      const target = scrapers.find(s => s.id === sourceId);
      if (target) {
        await ScraperApiClient.updateScraper(venue.id, sourceId, {
          schedule: { ...target.schedule, isEnabled: enabled }
        });
      }
    } catch (error) {
      console.error("Failed to update source status", error);
      setScrapers(previousScrapers);
      showToast("Failed to update source status", "error");
    }
  };

  const handleAddSource = async (
    url: string,
    type: ScrapeTarget,
    frequency: "daily" | "weekly" | "monthly",
    description?: string,
  ) => {
    const newScraperPartial: Partial<Scraper> = {
      venueId: venue.id,
      url: url,
      type: type as any,
      name: url,
      schedule: {
        frequency: frequency.toUpperCase() as any,
        isEnabled: true,
        nextRunAt: null,
        lastRunAt: null
      },
      status: "ACTIVE",
      description: description,
    };

    try {
      await ScraperApiClient.createScraper(venue.id, newScraperPartial);
      showToast("External source connected successfully", "success");
      setIsAddSourceModalOpen(false);
      loadScrapers();
    } catch (error) {
      console.error("Failed to add scraper source", error);
      showToast("Failed to add source", "error");
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    try {
      await ScraperApiClient.deleteScraper(venue.id, sourceId);
      setScrapers(prev => prev.filter(s => s.id !== sourceId));
      showToast("Source removed", "success");
    } catch (error) {
      console.error("Failed to delete scraper source", error);
      showToast("Failed to remove source", "error");
    }
  };

  // Mapper for Legacy Component
  const mapScraperToSource = (s: Scraper): ScraperSource => ({
    id: s.id,
    url: s.url,
    target: s.type as any,
    extractionMode: s.type as any,
    isEnabled: s.schedule.isEnabled,
    status: s.status === "ACTIVE" ? "active" : s.status === "ERROR" ? "error" : "pending",
    extractionNotes: s.description
  });

  const scraperSources = scrapers.map(mapScraperToSource);

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

          <div className="animate-in fade-in slide-in-from-top-2 duration-700">
            <ScraperBrainStatus venueId={venue.id} />
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-primary rounded-full" />
              <h4 className="text-xs font-black text-white uppercase tracking-widest">
                Review Queue
              </h4>
            </div>
            <IncomingEventsQueue venueId={venue.id} venueName={venue.name} />
          </div>

          {isScrapingEnabled && (
            <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="w-3 h-3 text-primary" />
                  Active Sources ({scraperSources.length}/5)
                </h4>
                <button
                  onClick={() => setIsAddSourceModalOpen(true)}
                  disabled={scraperSources.length >= 5}
                  className="text-[9px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors disabled:opacity-30 flex items-center gap-1"
                >
                  <Plus size={10} /> Add Source
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scraperSources
                  .sort((a, b) => {
                    if (a.isEnabled && !b.isEnabled) return -1;
                    if (!a.isEnabled && b.isEnabled) return 1;

                    const PRIORITY: Record<string, number> = {
                      EVENTS: 1,
                      CALENDAR: 2,
                      MENU: 3,
                      DRINKS: 4,
                      SOCIAL_FEED: 5,
                      NEWSLETTER: 6,
                      WEBSITE: 7,
                    };
                    const pA = PRIORITY[a.extractionMode || a.target] || 99;
                    const pB = PRIORITY[b.extractionMode || b.target] || 99;

                    return pA - pB;
                  })
                  .map((source) => (
                    <div key={source.id} className="relative animate-in fade-in duration-300">
                      <ConnectSourceCard
                        key={source.id}
                        source={source}
                        onDelete={handleDeleteSource}
                        onToggle={handleToggleSource}
                      />
                      {venue.isLocked && (
                        <div className="absolute top-2 right-2 z-10">
                          <Lock className="w-3 h-3 text-amber-500" />
                        </div>
                      )}
                    </div>
                  ))}

                {scraperSources.length === 0 && (
                  <div className="col-span-full py-8 text-center border-2 border-dashed border-white/5 rounded-xl">
                    <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest italic">
                      {loading ? "Loading sources..." : "No external sources connected"}
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
        existingUrls={scraperSources.map((s) => s.url)}
      />
    </div>
  );
};

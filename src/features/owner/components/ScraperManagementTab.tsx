import React, { useState } from 'react';
import { Venue, ScraperSource, ScrapeTarget } from '../../../types/venue';
import { UserProfile } from '../../../types';
import { isSystemAdmin } from '../../../types/auth_schema';
import { VenueOpsService } from '../../../services/VenueOpsService';
import { ExternalLink, Globe, Plus } from 'lucide-react';
import { ScraperConsentToggle } from './scraper/ScraperConsentToggle';
import { ConnectSourceCard } from './scraper/ConnectSourceCard';
import { AddSourceModal } from './scraper/AddSourceModal';
import { useToast } from '../../../components/ui/BrandedToast';

interface ScraperManagementTabProps {
    venue: Venue;
    onUpdate: (venueId: string, updates: Partial<Venue>) => Promise<void>;
    userProfile: UserProfile;
}

export const ScraperManagementTab: React.FC<ScraperManagementTabProps> = ({ venue, onUpdate, userProfile }) => {
    const { showToast } = useToast();
    const isActiveAdmin = isSystemAdmin(userProfile);
    const [isScrapingEnabled, setIsScrapingEnabled] = useState(venue.is_scraping_enabled || false);
    const [scraperConfig, setScraperConfig] = useState<ScraperSource[]>(venue.scraper_config || []);
    const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);

    const handleToggleScraping = async (enabled: boolean) => {
        setIsScrapingEnabled(enabled);
        try {
            await onUpdate(venue.id, { is_scraping_enabled: enabled });
        } catch (error) {
            console.error('Failed to update scraping status', error);
            // Revert state on error
            setIsScrapingEnabled(!enabled);
            showToast('Failed to update scraping status', 'error');
        }
    };

    const handleToggleSource = async (sourceId: string, enabled: boolean) => {
        const updated = scraperConfig.map(s => s.id === sourceId ? { ...s, isEnabled: enabled } : s);
        setScraperConfig(updated);
        try {
            await onUpdate(venue.id, { scraper_config: updated });
        } catch (error) {
            console.error('Failed to update source status', error);
            showToast('Failed to update source status', 'error');
        }
    };

    const handleAddSource = async (url: string, type: ScrapeTarget) => {
        const newSource: ScraperSource = {
            id: crypto.randomUUID(),
            url,
            target: type,
            isEnabled: true,
            status: 'pending'
        };
        const updated = [...scraperConfig, newSource];
        setScraperConfig(updated);
        setIsAddSourceModalOpen(false);
        try {
            await onUpdate(venue.id, { scraper_config: updated });
            showToast('External source connected successfully', 'success');
        } catch (error) {
            console.error('Failed to add scraper source', error);
            showToast('Failed to add source', 'error');
        }
    };

    const handleDeleteSource = async (sourceId: string) => {
        const updated = scraperConfig.filter(s => s.id !== sourceId);
        setScraperConfig(updated);
        try {
            await onUpdate(venue.id, { scraper_config: updated });
            showToast('Source removed', 'success');
        } catch (error) {
            console.error('Failed to delete scraper source', error);
            showToast('Failed to remove source', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1 flex items-center gap-2 italic">
                            <ExternalLink className="w-5 h-5 text-primary" />
                            Scraper Ingestion Engine
                        </h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Connect external calendars & websites for AI processing</p>
                    </div>
                    {isActiveAdmin && (
                        <div className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-[9px] font-black text-red-500 uppercase tracking-widest">System Admin</div>
                    )}
                </div>

                <div className="space-y-6">
                    <ScraperConsentToggle
                        isEnabled={isScrapingEnabled}
                        onToggle={handleToggleScraping}
                    />

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
                                    <ConnectSourceCard
                                        key={source.id}
                                        source={source}
                                        onDelete={handleDeleteSource}
                                        onToggle={handleToggleSource}
                                    />
                                ))}

                                {scraperConfig.length === 0 && (
                                    <div className="col-span-full py-8 text-center border-2 border-dashed border-white/5 rounded-xl">
                                        <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest italic">No external sources connected</p>
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
                existingUrls={scraperConfig.map(s => s.url)}
            />
        </div>
    );
};

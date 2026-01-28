import React, { useState } from 'react';
import { ArenaLayout } from '../../../components/layout/ArenaLayout';
import { UniversalEventCard } from '../../../components/ui/UniversalEventCard';
import { Venue } from '../../../types';
import { useDiscovery } from '../../venues/contexts/DiscoveryContext';

export const LiveMusicScreen: React.FC = () => {
    const { allVenues: venues } = useDiscovery();
    const [searchQuery, setSearchQuery] = useState('');

    const musicVenues = venues.filter(v =>
        (v.leagueEvent === 'live_music' ||
            v.venueType.toLowerCase().includes('music') ||
            v.venueType.toLowerCase().includes('bar')) &&
        (v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.deal && v.deal.toLowerCase().includes(searchQuery.toLowerCase())))
    ).slice(0, 10);

    return (
        <ArenaLayout
            title="Live Music Circuit"
            subtitle="The Sound of the South Sound"
            activeCategory="live"
            artieTip="The spirits are loud tonight. Respect the craft, enjoy the sound. Most stages downtown start revving up around 9 PM."
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search venues or bands..."
        >
            <div className="space-y-2">
                {musicVenues.length > 0 ? (
                    musicVenues.map(venue => (
                        <UniversalEventCard
                            key={venue.id}
                            venue={venue}
                            title={venue.deal || "Local Showcase"}
                            time="9:00 PM - 12:00 AM"
                            category="live"
                            points={15}
                            onClockIn={() => console.log('Clock-in', venue.id)}
                            onShare={() => console.log('Share', venue.id)}
                            onVibeChange={(v) => console.log('Vibe', venue.id, v)}
                            contextSlot={
                                <div className="flex flex-wrap gap-2">
                                    <span className="bg-primary/10 text-primary text-[8px] font-black px-2 py-0.5 rounded border border-primary/20 uppercase">Jazz</span>
                                    <span className="bg-primary/10 text-primary text-[8px] font-black px-2 py-0.5 rounded border border-primary/20 uppercase">Vinyl</span>
                                    <span className="bg-primary/10 text-primary text-[8px] font-black px-2 py-0.5 rounded border border-primary/20 uppercase">Live Stage</span>
                                </div>
                            }
                        />
                    ))
                ) : (
                    <div className="text-center p-12 bg-[#1e293b]/30 rounded-[2rem] border border-dashed border-white/5">
                        <p className="text-slate-500 font-black uppercase tracking-widest font-league">No Stages Found</p>
                        <p className="text-[10px] text-slate-600 font-bold uppercase mt-2">Try searching for something else</p>
                    </div>
                )}
            </div>
        </ArenaLayout>
    );
};

import React, { useState } from 'react';
import { ArenaLayout } from '../../../components/layout/ArenaLayout';
import { UniversalEventCard } from '../../../components/ui/UniversalEventCard';
import { Mic } from 'lucide-react';
import { useDiscovery } from '../../venues/contexts/DiscoveryContext';

export const KaraokeScreen: React.FC = () => {
    const { allVenues: venues } = useDiscovery();
    const [searchQuery, setSearchQuery] = useState('');

    const karaokeVenues = venues.filter(v =>
        v.leagueEvent === 'karaoke' &&
        (v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.deal && v.deal.toLowerCase().includes(searchQuery.toLowerCase())))
    ).slice(0, 10);

    return (
        <ArenaLayout
            title="Karaoke Lounge"
            subtitle="The Mic is Hot"
            activeCategory="karaoke"
            artieTip="It's always better in the water. Grab a well drink, find a song, and join the queue. Oly Gold points for anyone brave enough to start the night."
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search karaoke spots..."
        >
            <div className="space-y-2">
                {karaokeVenues.length > 0 ? (
                    karaokeVenues.map(venue => (
                        <UniversalEventCard
                            key={venue.id}
                            venue={venue}
                            title="Mic is Live"
                            time="9:00 PM - 2:00 AM"
                            category="karaoke"
                            points={10}
                            onClockIn={() => console.log('Clock-in', venue.id)}
                            onShare={() => console.log('Share', venue.id)}
                            onVibeChange={(v) => console.log('Vibe', venue.id, v)}
                            contextSlot={
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Mic size={14} className="text-primary" />
                                        <span className="text-[10px] text-white font-black uppercase font-league">Vibe Master Active</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">5 In Queue</span>
                                </div>
                            }
                        />
                    ))
                ) : (
                    <div className="text-center p-12 bg-[#1e293b]/30 rounded-[2rem] border border-dashed border-white/5">
                        <p className="text-slate-500 font-black uppercase tracking-widest font-league">No Mic Found</p>
                        <p className="text-[10px] text-slate-600 font-bold uppercase mt-2">Try searching for something else</p>
                    </div>
                )}
            </div>
        </ArenaLayout>
    );
};

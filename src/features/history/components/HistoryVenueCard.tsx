import React from 'react';
import { Venue } from '../../../types';
import { MapPin, Trophy } from 'lucide-react';

interface VenueCardProps {
    venue: Venue;
    onClick?: () => void;
}

export const HistoryVenueCard: React.FC<VenueCardProps> = ({ venue, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="my-8 bg-surface-800 border-l-4 border-accent rounded-r-lg p-4 shadow-lg cursor-pointer hover:bg-surface-700 transition-colors group relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy className="w-16 h-16 text-accent" />
            </div>

            <div className="flex items-start justify-between relative z-10">
                <div>
                    <h3 className="text-xl font-heading text-white mb-1 uppercase tracking-wide flex items-center gap-2">
                        {venue.name}
                        {venue.isHistoricalAnchor && (
                            <span className="text-xs bg-accent text-black px-2 py-0.5 rounded-full font-bold">Historical Anchor</span>
                        )}
                    </h3>
                    <p className="text-slate-300 font-body text-sm mb-3 max-w-md">
                        {venue.historySnippet || venue.description}
                    </p>

                    <div className="flex items-center text-accent text-xs font-bold uppercase tracking-wider">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>Check In to Unlock Badge Progress</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

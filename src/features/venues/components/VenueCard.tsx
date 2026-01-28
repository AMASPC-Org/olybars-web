import React from 'react';
import { Venue, UserProfile } from '../../../types';
import { MapPin, Trophy, Clock, Star } from 'lucide-react';

interface VenueCardProps {
  venue: Venue;
  userProfile: UserProfile;
  onClockIn: (v: Venue) => void;
  onVibeCheck: (v: Venue, hasConsent?: boolean, photoUrl?: string) => void;
  currentLocation?: { latitude: number; longitude: number };
  onOpenHomeBase?: (venueId: string, venueName: string) => void;
  onOpenSips?: () => void;
  onToggleFavorite: (venueId: string) => void;
}

export const VenueCard: React.FC<VenueCardProps> = React.memo(({
  venue,
  userProfile,
  onClockIn,
  onVibeCheck,
  currentLocation,
  onToggleFavorite,
  onOpenHomeBase,
  onOpenSips
}) => {
  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-4 mb-4 shadow-lg hover:border-primary/50 transition-all">
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-black text-white uppercase font-league">{venue.name}</h3>
        <div className="flex gap-2">
          {onOpenHomeBase && (
            <button onClick={() => onOpenHomeBase(venue.id, venue.name)} title="Set Home Base">
              <Trophy className="w-5 h-5 text-slate-500 hover:text-amber-400" />
            </button>
          )}
          <button onClick={() => onToggleFavorite(venue.id)}>
            <Star className={`w-5 h-5 ${userProfile.favorites?.includes(venue.id) ? 'fill-primary text-primary' : 'text-slate-500'}`} />
          </button>
        </div>
      </div>
      <p className="text-slate-400 text-sm mt-1">{venue.address}</p>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onClockIn(venue)}
          className="flex-1 bg-primary text-black font-bold py-2 rounded-lg uppercase text-xs"
        >
          Clock In
        </button>
        <button
          onClick={() => onVibeCheck(venue)}
          className="flex-1 bg-surface-700 text-white border border-white/10 font-bold py-2 rounded-lg uppercase text-xs hover:bg-surface-600"
        >
          Vibe Check
        </button>
        {onOpenSips && (
          <button
            onClick={onOpenSips}
            className="px-3 bg-surface-700 border border-white/10 rounded-lg hover:bg-surface-600 flex items-center justify-center"
          >
            <span className="text-xs">🍷</span>
          </button>
        )}
      </div>
    </div>
  );
});

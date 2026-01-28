import React, { useState, useMemo } from "react";
import { useNavigate, Link, useSearchParams, useOutletContext } from "react-router-dom";
import {
  Beer,
  ChevronRight,
  Clock,
  Crown,
  Flame,
  MapPin,
  Music,
  Navigation,
  Search,
  Sparkles,
  Star,
  Trophy,
  Users,
  Utensils,
  Filter
} from "lucide-react";
import { Venue, VenueType, SceneTag, VenueStatus } from "../../../types";
import { useGeolocation } from "../../../hooks/useGeolocation";
import { calculateDistance, metersToMiles } from "../../../utils/geoUtils";
import { LoadingScreen } from "../../../components/common/LoadingScreen";
import { VenueCard as VenueFeatureCard } from "../components/VenueCard";

import { useDiscovery } from "../contexts/DiscoveryContext";
import { useLayout } from "../../../contexts/LayoutContext";
import { useGamification } from "../../../contexts/GamificationContext";
import { useUser } from "../../../contexts/UserContext";

export const VenuesScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    processedVenues: venues,
    isLoading,
    searchQuery,
    setSearchQuery,
    activeTag,
    setActiveTag,
    filterKind,
    setFilterKind,
    activeSort,
    setActiveSort
  } = useDiscovery();

  const { userProfile, toggleFavorite } = useUser();
  const { onOpenHomeBase, onOpenSips } = useOutletContext<any>();

  const { openModal } = useLayout();

  // --- Actions ---
  const handleVibeCheck = (venue: Venue) => {
    openModal('VIBE_CHECK', { venue });
  };

  const handleClockIn = (venue: Venue) => {
    openModal('CLOCK_IN', { venue });
  };

  // --- Legacy Render Logic (Preserved) ---
  // Note: Most filtering is now handled by DiscoveryContext, 
  // but we still render the UI controls here.

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="pb-24 space-y-4">
      {/* Header / Search */}
      <div className="px-4 pt-4">
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search bars, vibes, or drinks..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {['all', 'bar', 'brewery', 'club', 'restaurant'].map((kind) => (
            <button
              key={kind}
              onClick={() => setFilterKind(kind as any)} // Cast safely
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border-2 ${filterKind === kind
                ? 'bg-primary text-black border-primary'
                : 'bg-black text-slate-400 border-slate-800 hover:border-slate-600'
                }`}
            >
              {kind === 'all' ? 'All Venues' : kind.charAt(0).toUpperCase() + kind.slice(1) + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Venues List */}
      <div className="px-4 space-y-4">
        {venues.length === 0 ? (
          <div className="text-center py-12">
            <Beer className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No venues found</h3>
            <p className="text-slate-400">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          venues.map((venue) => (
            <VenueFeatureCard
              key={venue.id}
              venue={venue}
              userProfile={userProfile}
              onVibeCheck={() => handleVibeCheck(venue)}
              onClockIn={() => handleClockIn(venue)}
              onToggleFavorite={toggleFavorite}
              onOpenHomeBase={onOpenHomeBase}
              onOpenSips={onOpenSips}
            />
          ))
        )}
      </div>
    </div>
  );
};

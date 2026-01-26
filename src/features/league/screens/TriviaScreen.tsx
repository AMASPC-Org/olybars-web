import React, { useState, useMemo } from "react";
import { useUser } from "../../../contexts/UserContext";
import { ArenaLayout } from "../../../components/layout/ArenaLayout";
import { UniversalEventCard } from "../../../components/ui/UniversalEventCard";
import { GameFeatureCard } from "../components/GameFeatureCard";
import { ArtieFieldNote } from "../../artie/components/ArtieFieldNote";
import { Venue, GameFeature } from "../../../types";
import { Trophy, Zap, Search as SearchIcon } from "lucide-react";
import { GAME_FEATURE_LORE } from "../config/playConfig";
import { performPlayClockIn } from "../../../services/userService";
import { useToast } from "../../../components/ui/BrandedToast";
import { VibeReceiptModal } from "../../social/components/VibeReceiptModal";
import {
  VibeReceiptData,
  generateArtieHook,
} from "../../social/services/VibeReceiptService";
import { CheatCodeWidget } from "../../history/components/CheatCodeWidget";

interface TriviaScreenProps {
  venues: Venue[];
}

export const TriviaScreen: React.FC<TriviaScreenProps> = ({
  venues,
}) => {
  const { userProfile } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentReceipt, setCurrentReceipt] = useState<VibeReceiptData | null>(
    null,
  );
  const { showToast } = useToast();

  // 1. "Active Now" Scheduled Events (Trivia, Karaoke)
  const activeNow = useMemo(() => {
    return venues
      .filter(
        (v) =>
          (v.leagueEvent === "trivia" || v.leagueEvent === "karaoke") &&
          (!searchQuery ||
            v.name.toLowerCase().includes(searchQuery.toLowerCase())),
      )
      .slice(0, 3);
  }, [venues, searchQuery]);

  // 2. Filtered Amenities based on Search
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];

    const results: { venue: Venue; feature: GameFeature }[] = [];
    venues.forEach((v) => {
      const matchingFeatures = v.gameFeatures?.filter(
        (f) =>
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.id.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      matchingFeatures?.forEach((f) => {
        results.push({ venue: v, feature: f });
      });
    });

    return results.sort(
      (a, b) =>
        (b.feature.isLeaguePartner ? 1 : 0) -
        (a.feature.isLeaguePartner ? 1 : 0),
    );
  }, [venues, searchQuery]);

  // Artie Lore for the current search
  const activeLore = useMemo(() => {
    if (!searchQuery) return null;
    const key = Object.keys(GAME_FEATURE_LORE).find((k) =>
      searchQuery.toLowerCase().includes(k.toLowerCase()),
    );
    return key
      ? {
        title: key.charAt(0).toUpperCase() + key.slice(1),
        note: GAME_FEATURE_LORE[key],
      }
      : null;
  }, [searchQuery]);

  const handlePlayClockIn = async (venueId: string, featureId: string) => {
    if (!userProfile || userProfile.uid === "guest") {
      showToast("Create an OlyBars ID to log clock-ins!", "error");
      return;
    }

    try {
      const result = await performPlayClockIn(
        venueId,
        userProfile.uid,
        featureId,
      );
      showToast(result.message, "success");

      const venue = venues.find((v) => v.id === venueId);

      // Generate Vibe Receipt
      const receipt: VibeReceiptData = {
        type: "play",
        venueName: venue?.name || "Local Bar",
        venueId: venueId,
        pointsEarned: result.pointsAwarded || 5,
        vibeStatus: venue?.status || "chill",
        artieHook: generateArtieHook("play", "chill"),
        username: userProfile.displayName || userProfile.email || "Member",
        userId: userProfile.uid,
        timestamp: new Date().toISOString(),
      };
      setCurrentReceipt(receipt);
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  return (
    <ArenaLayout
      title="The Arcade & Play"
      subtitle="Olympia's Activity Engine"
      activeCategory="play"
      artieTip="Static clock-ins at darts or pool tables earn 5 drops toward the season leaderboard. Go get 'em."
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search Darts, Pool, Pinball..."
    >
      <div className="space-y-8">
        {/* Search Results / Lore */}
        {searchQuery && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {activeLore && (
              <ArtieFieldNote title={activeLore.title} note={activeLore.note} />
            )}

            <div className="flex items-center gap-2 px-2">
              <SearchIcon size={16} className="text-primary" />
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                {searchResults.length} Results for "{searchQuery}"
              </h2>
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {searchResults.map(({ venue, feature }, idx) => (
                  <GameFeatureCard
                    key={`${venue.id}-${feature.id}-${idx}`}
                    venue={venue}
                    gameFeature={feature}
                    onClockIn={handlePlayClockIn}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-900/50 rounded-3xl border border-dashed border-white/5 mx-2">
                <p className="text-slate-600 font-black uppercase text-[10px] tracking-widest">
                  No games matched your intel.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Top Tier: "Active Now" Scheduled Events */}
        {!searchQuery && activeNow.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-primary animate-pulse" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                  Live in the 98501
                </h2>
              </div>
              <span className="text-[9px] font-bold text-slate-500 uppercase">
                Featured Events
              </span>
            </div>

            {activeNow.map((venue) => (
              <UniversalEventCard
                key={venue.id}
                venue={venue}
                title={
                  venue.deal ||
                  (venue.leagueEvent === "trivia"
                    ? "Trivia Night"
                    : "Karaoke Night")
                }
                time="LIVE NOW"
                category="play"
                points={venue.leagueEvent === "trivia" ? 20 : 15}
                onClockIn={() => console.log("Clock-in", venue.id)}
                onShare={() => console.log("Share", venue.id)}
                onVibeChange={(v) => console.log("Vibe", venue.id, v)}
                contextSlot={
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy size={14} className="text-primary" />
                        <span className="text-[10px] text-white font-black uppercase font-league">
                          League Protocol Active
                        </span>
                      </div>
                    </div>
                    {venue.cheatCodeUrl && (
                      <CheatCodeWidget url={venue.cheatCodeUrl} />
                    )}
                  </div>
                }
              />
            ))}
          </div>
        )}

        {/* Static Play Guide (Empty Search State) */}
        {!searchQuery && (
          <div className="space-y-6">
            <div className="mx-2 p-8 border-2 border-dashed border-slate-800 rounded-[2rem] text-center space-y-4">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-white/5">
                <Trophy size={32} className="text-slate-700" />
              </div>
              <div>
                <p className="text-white font-black uppercase font-league tracking-wide">
                  Enter the Directory
                </p>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 leading-relaxed px-4">
                  Search for an activity above to see where the tables are open
                  and where to collect League drops.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 px-2">
              {["Darts", "Pool", "Pinball", "Arcade", "Cornhole", "Trivia"].map(
                (activity) => (
                  <button
                    key={activity}
                    onClick={() => setSearchQuery(activity)}
                    className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl text-left hover:border-primary/50 transition-all group"
                  >
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">
                      Quick Search
                    </span>
                    <span className="text-sm font-black text-white uppercase font-league group-hover:text-primary transition-colors">
                      {activity}
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>
        )}
      </div>

      {currentReceipt && (
        <VibeReceiptModal
          data={currentReceipt}
          onClose={() => setCurrentReceipt(null)}
        />
      )}
    </ArenaLayout>
  );
};

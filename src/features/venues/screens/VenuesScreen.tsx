import React, { useState, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  Beer,
  Bot,
  ChevronRight,
  Clock,
  Crown,
  Filter,
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
} from "lucide-react";
import { Venue, VenueType, SceneTag, VenueStatus } from "../../../types";
import { useGeolocation } from "../../../hooks/useGeolocation";
import { calculateDistance, metersToMiles } from "../../../utils/geoUtils";
import {
  isVenueOpen,
  getVenueStatus,
  getEffectiveRules,
  timeToMinutes,
} from "../../../utils/venueUtils";
import { VenueGallery } from "../components/VenueGallery";
import { format } from "date-fns";
import { useToast } from "../../../components/ui/BrandedToast";
import { VibeMugs } from "../../../components/VibeMugs";
import { useDiscovery } from "../contexts/DiscoveryContext";
import { VibeFallbackBanner } from "../components/VibeFallbackBanner";
import { VibeAlertModal } from "../../notifications/components/VibeAlertModal";
import { getNextFallbackVibe } from "../../../utils/venueUtils";
import { getUserProfile } from "../../../services/userService";

interface VenuesScreenProps {
  venues: Venue[];
  handleVibeCheck?: (v: Venue) => void;
  lastVibeChecks?: Record<string, number>;
  lastGlobalVibeCheck?: number;
}

type SortOption = "alpha" | "distance" | "energy" | "buzz";

export const VenuesScreen: React.FC<VenuesScreenProps> = ({
  venues,
  handleVibeCheck,
  lastVibeChecks,
  lastGlobalVibeCheck,
}) => {
  const navigate = useNavigate();
  const { coords } = useGeolocation();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSort, setActiveSort] = useState<SortOption>("buzz");
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [activeType, setActiveType] = useState<VenueType | "all">("all");
  const [activeTag, setActiveTag] = useState<string | null>(
    searchParams.get("filter") === "makers" ? "Makers" : null,
  );

  // NEW: Vibe Alert Logic
  const [fallbackMeta, setFallbackMeta] = useState<{
    original: VenueStatus;
    fallback: VenueStatus;
  } | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertTargetVibe, setAlertTargetVibe] = useState<string>("");
  const [userProfile, setUserProfile] = useState<any>(null); // Simplified for this context

  // Check user auth on mount (for subscription logic)
  React.useEffect(() => {
    const loadUser = async () => {
      // In a real app, useAuth() context is better. For now, check localStorage or skip if simplified.
      // This was causing a lint error because getUserProfile requires an ID.
      // We'll skip fetching profile here if we don't have an ID readily available,
      // relying on auth redirects mostly.
      // const p = await getUserProfile('guest'); // Placeholder fix for lint if guest exists, or just null.
      setUserProfile({ uid: "guest" });
    };
    loadUser();
  }, [searchParams, navigate]);

  // Handle "Notify Me" Action
  const handleNotifyPress = () => {
    if (!filterKind || filterKind !== "status" || !fallbackMeta) return;

    const target = fallbackMeta.original;

    if (userProfile && userProfile.uid !== "guest") {
      setAlertTargetVibe(target);
      setIsAlertModalOpen(true);
    } else {
      // Redirect to Auth with callback
      const redirectUrl = encodeURIComponent(`/bars?subscribe_vibe=${target}`);
      navigate(`/auth?mode=signup&redirect=${redirectUrl}`);
    }
  };

  // Context Filters
  const {
    filterKind,
    statusFilter,
    sceneFilter,
    playFilter,
    featureFilter,
    eventFilter,
  } = useDiscovery();

  // [RANKING] Auto-sort by distance for Deals filter
  React.useEffect(() => {
    if (filterKind === "deals" && coords) {
      setActiveSort("distance");
    }
  }, [filterKind, coords]);

  // Rotation Logic (shifts every 5 minutes) ensures global fairness
  const rotationOffset = useMemo(() => {
    const rotationInterval = 5 * 60 * 1000;
    return Math.floor(Date.now() / rotationInterval);
  }, []);

  // Filter and Sort Logic
  const processedVenues = useMemo(() => {
    let result = venues
      .map((v) => ({
        ...v,
        isOpen: isVenueOpen(v),
        hourStatus: getVenueStatus(v),
        distance:
          coords && v.location
            ? metersToMiles(
                calculateDistance(
                  coords.latitude,
                  coords.longitude,
                  v.location.lat,
                  v.location.lng,
                ),
              )
            : null,
      }))
      .filter((v) => v.isActive !== false); // Filter out Soft Deleted / Archived venues

    console.log("[VenuesScreen] Context State:", {
      filterKind,
      statusFilter,
      count: result.length,
      sample: result[0]?.status,
    });

    // 0. Global Context Filters (The Sticky Header Controls)
    if (filterKind === "status" && statusFilter !== "all") {
      // Recurisve Fallback Logic
      let effectiveVibe = statusFilter;
      let filteredResults = result.filter((v) => v.status === effectiveVibe);
      const visited = new Set([effectiveVibe]);

      while (filteredResults.length === 0) {
        const nextVibe = getNextFallbackVibe(effectiveVibe);
        if (!nextVibe || visited.has(nextVibe)) break;

        // Found a fallback candidate
        visited.add(nextVibe);
        const nextResults = result.filter((v) => v.status === nextVibe);

        if (nextResults.length > 0) {
          effectiveVibe = nextVibe;
          filteredResults = nextResults;
          break;
        }

        // If nextResults is empty, we continue the loop with nextVibe as effectiveVibe
        effectiveVibe = nextVibe;
      }

      // Apply the final results (either original, fallback, or empty)
      result = filteredResults;
    } else if (filterKind === "deals") {
      const now = Date.now();
      const currentMinutes =
        new Date().getHours() * 60 + new Date().getMinutes();
      const currentDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        new Date().getDay()
      ];

      result = result.filter((v) => {
        // 1. Live Flash Bounty
        if (
          v.activeFlashBounty?.isActive &&
          (v.activeFlashBounty.endTime || 0) > now
        )
          return true;

        // 2. Upcoming Flash Bounty
        if (
          v.flashBounties?.some((b) => (b as any).active && b.startTime > now)
        )
          return true;

        // 3. Active Happy Hour
        const rules = getEffectiveRules(v);
        const hasActiveHH = rules.some((r) => {
          if (r.days && r.days.length > 0 && !r.days.includes(currentDay))
            return false;
          const start = timeToMinutes(r.startTime);
          const end = timeToMinutes(r.endTime);
          return currentMinutes >= start && currentMinutes < end;
        });
        if (hasActiveHH) return true;

        // 4. Static Deal (Strict)
        const hasValidDeal =
          v.deal &&
          ![
            "none",
            "draft",
            "false",
            "",
            "mellow",
            "chill",
            "flowing",
            "gushing",
            "flooded",
            "packed",
          ].includes(v.deal.toLowerCase());
        return !!hasValidDeal;
      });
    } else if (filterKind === "scene" && sceneFilter !== "all") {
      // Basic Taxonomy Mapping or Direct Tag Match
      result = result.filter((v) => {
        // 1. Check Scene Tags
        if (v.sceneTags && v.sceneTags.includes(sceneFilter as SceneTag))
          return true;
        // 2. Check Venue Type (rough mapping for common terms)
        if (sceneFilter === "dive" && v.venueType === "bar_pub") return true; // Loose
        if (
          sceneFilter === "brewery" &&
          (v.venueType === "brewery_taproom" || v.venueType === "brewpub")
        )
          return true;
        if (sceneFilter === "sports" && v.sceneTags?.includes("sports"))
          return true;
        // 3. Fallback: string match on type
        return v.venueType.includes(sceneFilter);
      });
    } else if (filterKind === "play" && playFilter !== "all") {
      result = result.filter((v) => {
        // 1. Direct Match in Game Features
        if (
          v.gameFeatures?.some(
            (gf) =>
              gf.name.includes(playFilter) ||
              gf.id.includes(playFilter.toLowerCase()),
          )
        )
          return true;

        // 2. Legacy / Fallback Logic
        if (
          playFilter === "Pool" &&
          v.sceneTags?.includes("pool_tables" as any)
        )
          return true;
        if (playFilter === "Darts" && v.sceneTags?.includes("darts" as any))
          return true;
        if (playFilter === "Arcade" && v.venueType === "arcade_bar")
          return true;

        return false;
      });
    } else if (filterKind === "features" && featureFilter !== "all") {
      if (featureFilter === "patio")
        result = result.filter((v) => v.hasOutdoorSeating);
      else if (featureFilter === "dog_friendly")
        result = result.filter((v) => v.isDogFriendly);
      else if (featureFilter === "all_ages")
        result = result.filter((v) => v.isAllAges);
      else if (featureFilter === "dance_floor")
        result = result.filter((v) =>
          v.sceneTags?.includes("dance_floor" as any),
        );
      else if (featureFilter === "jukebox")
        result = result.filter((v) =>
          v.gameFeatures?.some(
            (gf) => gf.type === "jukebox" || gf.name === "Jukebox",
          ),
        );
      else if (featureFilter === "pull_tabs")
        result = result.filter((v) =>
          v.gameFeatures?.some(
            (gf) => gf.type === "pull_tabs" || gf.name === "Pull Tabs",
          ),
        );
    } else if (filterKind === "events") {
      if (eventFilter === "all") {
        result = result.filter((v) => !!v.leagueEvent);
      } else if (eventFilter !== "other") {
        result = result.filter(
          (v) =>
            v.leagueEvent === eventFilter ||
            v.leagueEvent?.toLowerCase().includes(eventFilter.toLowerCase()),
        );
      }
    } else if (filterKind === "makers") {
      result = result.filter(
        (v) => v.isHQ || v.isLocalMaker || v.venueType === "brewery_taproom",
      );
    }

    // 1. Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          (v.name && v.name.toLowerCase().includes(q)) ||
          (v.address && v.address.toLowerCase().includes(q)) ||
          (v.venueType &&
            v.venueType.replace(/_/g, " ").toLowerCase().includes(q)) ||
          (v.vibe && v.vibe.toLowerCase().includes(q)) ||
          // Keyword matches for amenities [NEW]
          (q.includes("dog") && v.isDogFriendly) ||
          (q.includes("family") && v.isAllAges) ||
          (q.includes("all ages") && v.isAllAges) ||
          (q.includes("kids") && v.isAllAges) ||
          (q.includes("outdoor") && v.hasOutdoorSeating) ||
          (q.includes("patio") && v.hasOutdoorSeating) ||
          (q.includes("private") &&
            (v.hasPrivateRoom ||
              (v.privateSpaces && v.privateSpaces.length > 0))) ||
          (q.includes("room") &&
            v.privateSpaces &&
            v.privateSpaces.length > 0) ||
          (q.includes("back room") &&
            v.privateSpaces &&
            v.privateSpaces.length > 0),
      );
    }

    // 2. Open Only Filter
    if (showOpenOnly) {
      result = result.filter((v) => v.isOpen);
    }

    // 3. Venue Type Filter (Primary Toggle)
    if (activeType !== "all") {
      result = result.filter((v) => v.venueType === activeType);
    }

    // 4. Tag Filter (Vibe Tags & Functional Tags)
    if (activeTag) {
      if (activeTag === "Deals") {
        const now = Date.now();
        const currentMinutes =
          new Date().getHours() * 60 + new Date().getMinutes();
        const currentDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
          new Date().getDay()
        ];

        result = result.filter((v) => {
          // Reuse Strict Logic
          if (
            v.activeFlashBounty?.isActive &&
            (v.activeFlashBounty.endTime || 0) > now
          )
            return true;
          if (
            v.flashBounties?.some((b) => (b as any).active && b.startTime > now)
          )
            return true;

          const rules = getEffectiveRules(v);
          const hasActiveHH = rules.some((r) => {
            if (r.days && r.days.length > 0 && !r.days.includes(currentDay))
              return false;
            const start = timeToMinutes(r.startTime);
            const end = timeToMinutes(r.endTime);
            return currentMinutes >= start && currentMinutes < end;
          });
          if (hasActiveHH) return true;

          const hasValidDeal =
            v.deal &&
            ![
              "none",
              "draft",
              "false",
              "",
              "mellow",
              "chill",
              "flowing",
              "gushing",
              "flooded",
              "packed",
            ].includes(v.deal.toLowerCase());
          return !!hasValidDeal;
        });
      } else if (activeTag === "Makers") {
        result = result.filter(
          (v) => v.isHQ || v.isLocalMaker || v.venueType === "brewery_taproom",
        );
      } else if (activeTag === "Tasting") {
        result = result.filter(
          (v) =>
            v.venueType === "winery_tasting" ||
            v.makerType === "Winery" ||
            v.makerType === "Distillery" ||
            v.sceneTags?.includes("wine_focus"),
        );
      } else if (activeTag === "Trivia")
        result = result.filter((v) => v.leagueEvent === "trivia");
      // Check Vibe Tags
      else {
        const sceneTagValue = activeTag
          .toLowerCase()
          .replace(/ /g, "_") as SceneTag; // rough mapping, better to specific map
        // Helper map for display -> value
        const TAG_MAP: Record<string, SceneTag> = {
          Dive: "dive",
          Speakeasy: "speakeasy",
          Sports: "sports",
          Tiki: "tiki_theme",
          Wine: "wine_focus",
          Cocktails: "cocktail_focus",
          "LGBTQ+": "lgbtq",
          Patio: "patio_garden",
        };
        const targetScene = TAG_MAP[activeTag];
        if (targetScene) {
          result = result.filter((v) => v.sceneTags?.includes(targetScene));
        }
      }
    }

    // 4. Global Visibility
    result = result.filter((v) => v.tier_config?.is_directory_listed !== false);

    // 5. Sorting
    result.sort((a, b) => {
      if (activeSort === "alpha") {
        return a.name.localeCompare(b.name);
      }
      if (activeSort === "distance") {
        const distA = a.distance ?? 999;
        const distB = b.distance ?? 999;
        return distA - distB;
      }
      if (activeSort === "energy") {
        const order: Record<VenueStatus, number> = {
          flooded: 0,
          gushing: 1,
          flowing: 2,
          trickle: 3,
        };
        return order[a.status] - order[b.status];
      }
      if (activeSort === "buzz") {
        // Priority 0: Partner Exposure Equity (League Members)
        const isAPartner = a.isPaidLeagueMember;
        const isBPartner = b.isPaidLeagueMember;

        // Score Calculation for Content Priority
        // 4 = Live Bounty
        // 3 = Active HH
        // 2 = Upcoming Bounty
        // 1 = Static Deal
        // 0 = None
        const getDealScore = (v: Venue) => {
          const now = Date.now();
          // Live Bounty
          if (
            v.activeFlashBounty?.isActive &&
            (v.activeFlashBounty.endTime || 0) > now
          )
            return 4;

          // Active HH
          const rules = getEffectiveRules(v);
          const currentMinutes =
            new Date().getHours() * 60 + new Date().getMinutes();
          const currentDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
            new Date().getDay()
          ];
          const isHH = rules.some((r) => {
            if (r.days && r.days.length > 0 && !r.days.includes(currentDay))
              return false;
            const start = timeToMinutes(r.startTime);
            const end = timeToMinutes(r.endTime);
            return currentMinutes >= start && currentMinutes < end;
          });
          if (isHH) return 3;

          // Upcoming
          if (
            v.flashBounties?.some((b) => (b as any).active && b.startTime > now)
          )
            return 2;

          // Static
          if (
            v.deal &&
            ![
              "none",
              "draft",
              "false",
              "",
              "mellow",
              "chill",
              "flowing",
              "gushing",
              "flooded",
              "packed",
            ].includes(v.deal.toLowerCase())
          )
            return 1;

          return 0;
        };

        const scoreA = getDealScore(a);
        const scoreB = getDealScore(b);

        // Primary Sort: Content Score (Live > HH > Upcoming > Static)
        if (scoreA !== scoreB) return scoreB - scoreA;

        // Secondary Sort: Partner Status (if scores are equal, e.g. both have Live Bounty)
        if (isAPartner !== isBPartner) return isAPartner ? -1 : 1;

        // Priority 3: Tie-Break with Rotation
        if (isAPartner && isBPartner) {
          const aHash = a.id
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const bHash = b.id
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);
          return (
            ((aHash + rotationOffset) % 100) - ((bHash + rotationOffset) % 100)
          );
        }

        // Fallback to Status
        const order: Record<VenueStatus, number> = {
          flooded: 0,
          gushing: 1,
          flowing: 2,
          trickle: 3,
        };
        return order[a.status] - order[b.status];
      }
      return 0;
    });

    // [DEBUG] Log for Vibe Filter Diagnosis
    if (filterKind === "status") {
      console.log("[VenuesScreen] Filtering by status:", statusFilter);
      console.log("[VenuesScreen] Result count:", result.length);
    }

    return result;
  }, [
    venues,
    searchQuery,
    showOpenOnly,
    activeTag,
    activeSort,
    coords,
    filterKind,
    statusFilter,
    sceneFilter,
    playFilter,
    featureFilter,
    eventFilter,
  ]);

  // Effect to update fallback UI state
  React.useEffect(() => {
    if (filterKind === "status" && statusFilter !== "all") {
      const original = venues.filter((v) => v.status === statusFilter);
      if (original.length === 0) {
        // Re-simulate loop logic to find consistent fallback
        let effective = statusFilter;
        let visited = new Set([effective]);
        let fallbackFound = null;

        while (true) {
          const next = getNextFallbackVibe(effective);
          if (!next || visited.has(next)) break;

          const check = venues.filter((v) => v.status === next);
          if (check.length > 0) {
            fallbackFound = next;
            break;
          }
          effective = next;
          visited.add(next);
        }

        if (fallbackFound) {
          setFallbackMeta({ original: statusFilter, fallback: fallbackFound });
          if (activeSort !== "distance") setActiveSort("distance");
        } else {
          setFallbackMeta(null);
        }
      } else {
        setFallbackMeta(null);
      }
    } else {
      setFallbackMeta(null);
    }
  }, [filterKind, statusFilter, venues, activeSort]);

  return (
    <div className="bg-background min-h-screen pb-32 font-body text-slate-100">
      {/* Header & Search */}
      <div className="p-6 space-y-4">
        <div className="flex flex-col items-center gap-1 mb-2">
          <h1 className="text-4xl font-black text-white tracking-widest font-league uppercase italic leading-none">
            BAR <span className="text-primary">DIRECTORY</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1 italic">
            The OlyBars Index
          </p>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by name, vibe, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border-2 border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-slate-600 focus:border-primary outline-none transition-all shadow-xl font-body"
          />
        </div>

        {/* Type Toggles (Primary) */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "all", label: "All" },
            { id: "bar_pub", label: "Bars" },
            { id: "restaurant_bar", label: "Rest & Bar" },
            { id: "brewery_taproom", label: "Breweries" },
            { id: "brewpub", label: "Brewpubs" },
            { id: "lounge_club", label: "Lounges" },
            { id: "arcade_bar", label: "Arcades" },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id as VenueType | "all")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                activeType === type.id
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-slate-500 border-slate-800 hover:border-slate-600"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Sorting & Quick Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveSort("buzz")}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap font-league ${activeSort === "buzz" ? "bg-primary text-black border-black shadow-[2px_2px_0px_0px_#fff]" : "bg-surface text-slate-400 border-slate-800"}`}
            >
              <Flame size={12} fill="currentColor" /> Buzz Clock
            </button>
            <button
              onClick={() => setActiveSort("alpha")}
              className={`px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap font-league ${activeSort === "alpha" ? "bg-primary text-black border-black shadow-[2px_2px_0px_0px_#fff]" : "bg-surface text-slate-400 border-slate-800"}`}
            >
              Alphabetical
            </button>
            <button
              onClick={() => setActiveSort("distance")}
              className={`px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap font-league ${activeSort === "distance" ? "bg-primary text-black border-black shadow-[2px_2px_0px_0px_#fff]" : "bg-surface text-slate-400 border-slate-800"}`}
            >
              Nearest
            </button>
            <button
              onClick={() => setActiveSort("energy")}
              className={`px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap font-league ${activeSort === "energy" ? "bg-primary text-black border-black shadow-[2px_2px_0px_0px_#fff]" : "bg-surface text-slate-400 border-slate-800"}`}
            >
              Vibe Check
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {[
                "Makers",
                "Tasting",
                "Trivia",
                "Deals",
                "Dive",
                "Speakeasy",
                "Sports",
                "Patio",
                "Cocktails",
                "Wine",
                "Tiki",
                "LGBTQ+",
              ].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all whitespace-nowrap ${activeTag === tag ? "bg-primary/20 text-primary border-primary" : "bg-transparent text-slate-500 border-slate-800"}`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowOpenOnly(!showOpenOnly)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all ${showOpenOnly ? "bg-green-500/20 text-green-400 border-green-500" : "bg-transparent text-slate-500 border-slate-800"}`}
            >
              <Clock size={12} />
              Open Now
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="px-6 space-y-4">
        {/* Fallback Banner */}
        {fallbackMeta && (
          <VibeFallbackBanner
            originalVibe={fallbackMeta.original}
            fallbackVibe={fallbackMeta.fallback}
            onNotifyPress={handleNotifyPress}
          />
        )}

        {/* Vibe Alert Confirmation */}
        <VibeAlertModal
          isOpen={isAlertModalOpen}
          onClose={() => setIsAlertModalOpen(false)}
          targetVibe={alertTargetVibe}
        />

        {processedVenues.length === 0 ? (
          <div className="space-y-6">
            <div className="text-center py-20 bg-surface/30 rounded-3xl border-2 border-dashed border-slate-800">
              <Sparkles className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest font-league italic">
                No spots found in this vibe
              </p>
            </div>

            {/* Exposure Equity: Rotating Partner Fallback */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4 justify-center">
                <Trophy className="w-5 h-5 text-primary" />
                <h4 className="text-sm font-black text-primary uppercase tracking-widest font-league">
                  League Partners
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[...venues]
                  .filter((v) => v.isPaidLeagueMember && v.isActive !== false)
                  .map((v, i, arr) => {
                    const shiftedIndex =
                      (i + (rotationOffset % (arr.length || 1))) %
                      (arr.length || 1);
                    return arr[shiftedIndex];
                  })
                  .slice(0, 3)
                  .map((v) => (
                    <Link
                      key={`fallback-${v.id}`}
                      to={`/bars/${v.id}`}
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl p-4 flex justify-between items-center group/item hover:bg-slate-900 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/20 p-2 rounded-lg group-hover/item:scale-110 transition-transform">
                          <Star className="w-4 h-4 text-primary fill-primary" />
                        </div>
                        <div className="text-left">
                          <h5 className="text-sm font-black text-white uppercase italic tracking-wide">
                            {v.name}
                          </h5>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">
                            {v.vibe}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover/item:text-primary transition-all" />
                    </Link>
                  ))}
              </div>
              <p className="mt-4 text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em] text-center italic">
                Rotating exposure for OlyBars partners
              </p>
            </div>
          </div>
        ) : (
          processedVenues.map((venue) => (
            <div
              key={venue.id}
              className="bg-surface border-2 border-slate-700 rounded-3xl overflow-hidden hover:border-primary transition-all group shadow-2xl relative"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        to={`/bars/${venue.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        <h3 className="text-2xl font-black text-white font-league uppercase italic leading-none group-hover:text-primary transition-colors">
                          {venue.name}
                        </h3>
                      </Link>
                      {venue.isPaidLeagueMember && (
                        <div className="bg-primary px-2 py-0.5 rounded transform -skew-x-12">
                          <span className="text-black text-[8px] font-black uppercase italic">
                            PARTNER
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Google Rating Badge */}
                    {venue.googleRating && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Star
                          size={12}
                          className="text-yellow-400 fill-yellow-400"
                        />
                        <span className="text-xs font-black text-white">
                          {venue.googleRating}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          ({venue.googleReviewCount})
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-body">
                      <span>{venue.venueType.replace(/_/g, " ")}</span>
                      <span>•</span>
                      <span className="italic">"{venue.vibe}"</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <VibeMugs status={venue.status} size={14} />
                    <div
                      className={`text-[10px] font-black px-3 py-1 rounded-full border mb-2 mt-2 inline-block font-league uppercase tracking-widest ${venue.hourStatus === "open" ? "bg-green-500/10 text-green-400 border-green-400/30" : venue.hourStatus === "last_call" ? "bg-red-600/20 text-red-400 border-red-500 animate-pulse" : "bg-red-500/10 text-red-400 border-red-400/30"}`}
                    >
                      {venue.hourStatus === "open"
                        ? "Open Now"
                        : venue.hourStatus === "last_call"
                          ? "LAST CALL 🕒"
                          : "Closed"}
                    </div>
                    {venue.distance !== null && (
                      <div className="flex items-center justify-end gap-1 text-[10px] font-black text-primary font-league uppercase">
                        <Navigation size={10} strokeWidth={3} />
                        {venue.distance.toFixed(1)} mi
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Smart Deal Display */}
                  {(() => {
                    const now = Date.now();
                    const rules = getEffectiveRules(venue);
                    const currentMinutes =
                      new Date().getHours() * 60 + new Date().getMinutes();
                    const currentDay = [
                      "Sun",
                      "Mon",
                      "Tue",
                      "Wed",
                      "Thu",
                      "Fri",
                      "Sat",
                    ][new Date().getDay()];

                    let liveBounty =
                      venue.activeFlashBounty?.isActive &&
                      (venue.activeFlashBounty.endTime || 0) > now
                        ? venue.activeFlashBounty
                        : null;
                    let activeHH = rules.find((r) => {
                      if (
                        r.days &&
                        r.days.length > 0 &&
                        !r.days.includes(currentDay)
                      )
                        return false;
                      const start = timeToMinutes(r.startTime);
                      const end = timeToMinutes(r.endTime);
                      return currentMinutes >= start && currentMinutes < end;
                    });
                    let upcomingBounty =
                      !liveBounty &&
                      venue.flashBounties?.find(
                        (b) => (b as any).active && b.startTime > now,
                      );

                    // Sort upcoming bounties by time to show soonest
                    if (venue.flashBounties && upcomingBounty) {
                      const sorted = [...venue.flashBounties]
                        .filter((b) => (b as any).active && b.startTime > now)
                        .sort((a, b) => a.startTime - b.startTime);
                      if (sorted.length > 0) upcomingBounty = sorted[0];
                    }

                    let staticDeal =
                      venue.deal &&
                      ![
                        "none",
                        "draft",
                        "false",
                        "",
                        "mellow",
                        "chill",
                        "flowing",
                        "gushing",
                        "flooded",
                        "packed",
                      ].includes(venue.deal.toLowerCase())
                        ? venue.deal
                        : null;

                    // 1. Live Bounty (Hero)
                    if (liveBounty) {
                      return (
                        <div className="bg-primary/10 border border-primary/50 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden animate-pulse-slow">
                          <div className="absolute top-0 right-0 bg-primary text-black text-[8px] font-black px-1.5 py-0.5 rounded-bl-lg">
                            LIVE NOW
                          </div>
                          <Crown
                            size={18}
                            className="text-primary fill-primary animate-bounce-subtle"
                          />
                          <div>
                            <p className="text-[10px] font-black text-primary uppercase leading-none mb-1 font-league">
                              Flash Bounty
                            </p>
                            <p className="text-xs font-bold text-white font-body">
                              {liveBounty.title}
                            </p>
                            <p className="text-[9px] text-primary/80 font-mono mt-0.5">
                              Ends in{" "}
                              {Math.ceil((liveBounty.endTime - now) / 60000)}m
                            </p>
                          </div>
                        </div>
                      );
                    }

                    // 2. Active HH
                    if (activeHH) {
                      return (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
                          <Clock size={16} className="text-emerald-400" />
                          <div>
                            <p className="text-[10px] font-black text-emerald-400 uppercase leading-none mb-1 font-league">
                              Happy Hour Active
                            </p>
                            <p className="text-xs font-bold text-white font-body">
                              {activeHH.specials || activeHH.description}
                            </p>
                            <p className="text-[9px] text-emerald-400/80 font-mono mt-0.5">
                              Ends {activeHH.endTime}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    // 3. Upcoming Bounty
                    if (upcomingBounty) {
                      return (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-center gap-3">
                          <Clock size={16} className="text-blue-400" />
                          <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase leading-none mb-1 font-league">
                              Upcoming:{" "}
                              {format(upcomingBounty.startTime, "EEE @ h:mm a")}
                            </p>
                            <p className="text-xs font-bold text-white font-body">
                              {upcomingBounty.title}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    // 4. Static Deal
                    if (staticDeal) {
                      return (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                          {venue.activeFlashBounty?.category === "food" ? (
                            <Utensils size={16} className="text-primary" />
                          ) : (
                            <Beer size={16} className="text-primary" />
                          )}
                          <div>
                            <p className="text-[10px] font-black text-primary uppercase leading-none mb-1 font-league">
                              Featured Deal
                            </p>
                            <p className="text-xs font-bold text-white font-body">
                              {staticDeal}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })()}

                  {venue.leagueEvent && (
                    <Link
                      to={`/bars/${venue.id}`}
                      className="block bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between group/event cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Trophy size={16} className="text-primary" />
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase leading-none mb-1 font-league">
                            Tonight's Play
                          </p>
                          <p className="text-xs font-bold text-white uppercase font-body">
                            {venue.leagueEvent}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-slate-600 group-hover/event:text-primary transition-colors"
                      />
                    </Link>
                  )}

                  <div className="mt-4">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 font-league italic">
                      Venue Gallery
                    </p>
                    <VenueGallery photos={venue.photos} />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex-1 flex items-center justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase font-league">
                        <Music size={12} strokeWidth={3} />
                        {venue.leagueEvent === "karaoke"
                          ? "Karaoke High"
                          : "Vibe Varies"}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase font-league">
                        <MapPin size={12} strokeWidth={3} />
                        {venue.address
                          ? venue.address.split(",")[0]
                          : "Downtown Oly"}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast(
                            "Find the physical Vibe Spot QR code inside " +
                              venue.name +
                              " to report a vibe.",
                            "info",
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all border outline-none bg-primary/5 border-primary/20 text-primary hover:bg-primary/20`}
                      >
                        <span className="flex flex-col items-center">
                          <span className="flex items-center gap-1">
                            <Users size={10} strokeWidth={3} /> Vibe Check (+5)
                          </span>
                          <span className="text-[6px] opacity-60">
                            SCAN QR REQUIRED
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

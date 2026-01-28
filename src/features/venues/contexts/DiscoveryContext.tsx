import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Venue, VenueStatus, VenueType, SceneTag } from '../../../types';
import { isSameDay, isAfter, startOfToday } from 'date-fns';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { calculateDistance, metersToMiles } from '../../../utils/geoUtils';
import {
    isVenueOpen,
    getVenueStatus,
    getEffectiveRules,
    timeToMinutes,
    getNextFallbackVibe
} from '../../../utils/venueUtils';

// --- Types ---
export type FilterKind = 'status' | 'deals' | 'scene' | 'play' | 'makers' | 'features' | 'events' | 'all';
export type SortOption = "alpha" | "distance" | "energy" | "buzz";

interface DiscoveryContextType {
    // Input Data
    allVenues: Venue[];
    isLoading: boolean;

    // Output Data
    processedVenues: Venue[];
    fallbackMeta: { original: VenueStatus; fallback: VenueStatus } | null;

    // Search & Filter State
    searchQuery: string;
    setSearchQuery: (q: string) => void;

    // Main Filter Kind
    filterKind: FilterKind;
    setFilterKind: (k: FilterKind) => void;

    // Sub-Filters
    statusFilter: VenueStatus | 'all';
    setStatusFilter: (s: VenueStatus | 'all') => void;
    sceneFilter: string | 'all';
    setSceneFilter: (s: string | 'all') => void;
    playFilter: string | 'all';
    setPlayFilter: (s: string | 'all') => void;
    featureFilter: string | 'all';
    setFeatureFilter: (s: string | 'all') => void;
    eventFilter: string | 'all';
    setEventFilter: (s: string | 'all') => void;

    // Additional Filters (from VenuesScreen)
    activeSort: SortOption;
    setActiveSort: (s: SortOption) => void;
    showOpenOnly: boolean;
    setShowOpenOnly: (open: boolean) => void;
    activeType: VenueType | "all";
    setActiveType: (t: VenueType | "all") => void;
    activeTag: string | null;
    setActiveTag: (t: string | null) => void;

    // Date Pivot
    selectedDate: Date;
    setSelectedDate: (d: Date) => void;
    isToday: boolean;

    // View State
    viewMode: 'list' | 'map';
    setViewMode: (m: 'list' | 'map') => void;
    mapRegion: string;
    setMapRegion: (r: string) => void;

    clearAllFilters: () => void;
    searchParams: URLSearchParams;
}

const DiscoveryContext = createContext<DiscoveryContextType | undefined>(undefined);

export const DiscoveryProvider: React.FC<{ children: React.ReactNode; venues?: Venue[]; isLoading?: boolean }> = ({ children, venues: rawVenues = [], isLoading = false }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get('q') || '';
    const { coords } = useGeolocation();

    // --- State ---
    const [filterKind, setFilterKind] = useState<FilterKind>('all');
    const [statusFilter, setStatusFilter] = useState<VenueStatus | 'all'>('all');
    const [sceneFilter, setSceneFilter] = useState<string | 'all'>('all');
    const [playFilter, setPlayFilter] = useState<string | 'all'>('all');
    const [featureFilter, setFeatureFilter] = useState<string | 'all'>('all');
    const [eventFilter, setEventFilter] = useState<string | 'all'>('all');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // New State from VenuesScreen
    const [activeSort, setActiveSort] = useState<SortOption>("buzz");
    const [showOpenOnly, setShowOpenOnly] = useState(false);
    const [activeType, setActiveType] = useState<VenueType | "all">("all");
    const [activeTag, setActiveTag] = useState<string | null>(
        searchParams.get("filter") === "makers" ? "Makers" : null
    );

    // Sync viewMode with URL
    const [viewModeInternal, setViewModeInternal] = useState<'list' | 'map'>(searchParams.get('view') === 'map' ? 'map' : 'list');

    // Auto-sort by distance for Deals filter
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

    // --- Derived State (Logic Injection) ---
    const { result: processedVenues, fallbackMeta } = useMemo(() => {
        // 1. augment venues with distance / status
        let result = rawVenues
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

        let tempFallbackMeta = null;

        // 2. Global Context Filters (The Sticky Header Controls)
        if (filterKind === "status" && statusFilter !== "all") {
            // Recursive Fallback Logic
            let effectiveVibe = statusFilter;
            let filteredResults = result.filter((v) => v.status === effectiveVibe);
            const visited = new Set([effectiveVibe]);

            // If empty, find fallback
            if (filteredResults.length === 0) {
                while (true) {
                    const nextVibe = getNextFallbackVibe(effectiveVibe);
                    if (!nextVibe || visited.has(nextVibe)) break;

                    visited.add(nextVibe);
                    const check = result.filter((v) => v.status === nextVibe);

                    if (check.length > 0) {
                        filteredResults = check;
                        tempFallbackMeta = { original: statusFilter, fallback: nextVibe };
                        // Force distance sort only if not already sorting by it? 
                        // VenuesScreen did: if (activeSort !== "distance") setActiveSort("distance");
                        // We can't setState inside render. We'll rely on the user to sort or default sort.
                        // Actually, this side effect is tricky in memo. We will return meta.
                        break;
                    }
                    effectiveVibe = nextVibe;
                }
            }
            result = filteredResults;

        } else if (filterKind === "deals") {
            const now = Date.now();
            const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
            const currentDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];

            result = result.filter((v) => {
                // 1. Live Flash Bounty
                if (v.activeFlashBounty?.isActive && (v.activeFlashBounty.endTime || 0) > now) return true;
                // 2. Upcoming Flash Bounty
                if (v.flashBounties?.some((b) => (b as any).active && b.startTime > now)) return true;
                // 3. Active Happy Hour
                const rules = getEffectiveRules(v);
                const hasActiveHH = rules.some((r) => {
                    if (r.days && r.days.length > 0 && !r.days.includes(currentDay)) return false;
                    const start = timeToMinutes(r.startTime);
                    const end = timeToMinutes(r.endTime);
                    return currentMinutes >= start && currentMinutes < end;
                });
                if (hasActiveHH) return true;
                // 4. Static Deal (Strict)
                const hasValidDeal = v.deal && !["none", "draft", "false", "", "mellow", "chill", "flowing", "gushing", "flooded", "packed"].includes(v.deal.toLowerCase());
                return !!hasValidDeal;
            });
        } else if (filterKind === "scene" && sceneFilter !== "all") {
            result = result.filter((v) => {
                if (v.sceneTags && v.sceneTags.includes(sceneFilter as SceneTag)) return true;
                if (sceneFilter === "dive" && v.venueType === "bar_pub") return true;
                if (sceneFilter === "brewery" && (v.venueType === "brewery_taproom" || v.venueType === "brewpub")) return true;
                if (sceneFilter === "sports" && v.sceneTags?.includes("sports")) return true;
                return v.venueType.includes(sceneFilter);
            });
        } else if (filterKind === "play" && playFilter !== "all") {
            result = result.filter((v) => {
                if (v.gameFeatures?.some((gf) => gf.name.includes(playFilter) || gf.id.includes(playFilter.toLowerCase()))) return true;
                if (playFilter === "Pool" && v.sceneTags?.includes("pool_tables" as any)) return true;
                if (playFilter === "Darts" && v.sceneTags?.includes("darts" as any)) return true;
                if (playFilter === "Arcade" && v.venueType === "arcade_bar") return true;
                return false;
            });
        } else if (filterKind === "features" && featureFilter !== "all") {
            if (featureFilter === "patio") result = result.filter((v) => v.hasOutdoorSeating);
            else if (featureFilter === "dog_friendly") result = result.filter((v) => v.isDogFriendly);
            else if (featureFilter === "all_ages") result = result.filter((v) => v.isAllAges);
            else if (featureFilter === "dance_floor") result = result.filter((v) => v.sceneTags?.includes("dance_floor" as any));
            else if (featureFilter === "jukebox") result = result.filter((v) => v.gameFeatures?.some((gf) => gf.type === "jukebox" || gf.name === "Jukebox"));
            else if (featureFilter === "pull_tabs") result = result.filter((v) => v.gameFeatures?.some((gf) => gf.type === "pull_tabs" || gf.name === "Pull Tabs"));
        } else if (filterKind === "events") {
            if (eventFilter === "all") {
                result = result.filter((v) => !!v.leagueEvent);
            } else if (eventFilter !== "other") {
                result = result.filter((v) => v.leagueEvent === eventFilter || v.leagueEvent?.toLowerCase().includes(eventFilter.toLowerCase()));
            }
        } else if (filterKind === "makers") {
            result = result.filter((v) => v.isHQ || v.isLocalMaker || v.venueType === "brewery_taproom");
        }

        // 3. Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (v) =>
                    (v.name && v.name.toLowerCase().includes(q)) ||
                    (v.address && v.address.toLowerCase().includes(q)) ||
                    (v.venueType && v.venueType.replace(/_/g, " ").toLowerCase().includes(q)) ||
                    (v.vibe && v.vibe.toLowerCase().includes(q)) ||
                    // Keyword matches for amenities
                    (q.includes("dog") && v.isDogFriendly) ||
                    (q.includes("family") && v.isAllAges) ||
                    (q.includes("all ages") && v.isAllAges) ||
                    (q.includes("kids") && v.isAllAges) ||
                    (q.includes("outdoor") && v.hasOutdoorSeating) ||
                    (q.includes("patio") && v.hasOutdoorSeating) ||
                    (q.includes("private") && (v.hasPrivateRoom || (v.privateSpaces && v.privateSpaces.length > 0))) ||
                    (q.includes("room") && v.privateSpaces && v.privateSpaces.length > 0) ||
                    (q.includes("back room") && v.privateSpaces && v.privateSpaces.length > 0),
            );
        }

        // 4. Open Only Filter
        if (showOpenOnly) {
            result = result.filter((v) => v.isOpen);
        }

        // 5. Venue Type Filter
        if (activeType !== "all") {
            result = result.filter((v) => v.venueType === activeType);
        }

        // 6. Tag Filter
        if (activeTag) {
            if (activeTag === "Deals") {
                // Same logic as 'deals' filterKind
                const now = Date.now();
                const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
                const currentDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
                result = result.filter((v) => {
                    if (v.activeFlashBounty?.isActive && (v.activeFlashBounty.endTime || 0) > now) return true;
                    if (v.flashBounties?.some((b) => (b as any).active && b.startTime > now)) return true;
                    const rules = getEffectiveRules(v);
                    const hasActiveHH = rules.some((r) => {
                        if (r.days && r.days.length > 0 && !r.days.includes(currentDay)) return false;
                        const start = timeToMinutes(r.startTime);
                        const end = timeToMinutes(r.endTime);
                        return currentMinutes >= start && currentMinutes < end;
                    });
                    if (hasActiveHH) return true;
                    const hasValidDeal = v.deal && !["none", "draft", "false", "", "mellow", "chill", "flowing", "gushing", "flooded", "packed"].includes(v.deal.toLowerCase());
                    return !!hasValidDeal;
                });
            } else if (activeTag === "Makers") {
                result = result.filter((v) => v.isHQ || v.isLocalMaker || v.venueType === "brewery_taproom");
            } else if (activeTag === "Tasting") {
                result = result.filter((v) => v.venueType === "winery_tasting" || v.makerType === "Winery" || v.makerType === "Distillery" || v.sceneTags?.includes("wine_focus"));
            } else if (activeTag === "Trivia") {
                result = result.filter((v) => v.leagueEvent === "trivia");
            } else {
                // Scene Tags
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

        // 7. Global Visibility
        result = result.filter((v) => v.tier_config?.is_directory_listed !== false);

        // 8. Sorting
        result.sort((a, b) => {
            if (activeSort === "alpha") return a.name.localeCompare(b.name);
            if (activeSort === "distance") {
                const distA = a.distance ?? 999;
                const distB = b.distance ?? 999;
                return distA - distB;
            }
            if (activeSort === "energy") {
                const order: Record<VenueStatus, number> = { packed: 0, flooded: 1, gushing: 2, buzzing: 3, flowing: 4, trickle: 5 };
                return order[a.status] - order[b.status];
            }
            if (activeSort === "buzz") {
                // Priority 0: Partner Exposure Equity (League Members)
                const isAPartner = a.isPaidLeagueMember;
                const isBPartner = b.isPaidLeagueMember;

                // Score Calculation
                const getDealScore = (v: Venue) => {
                    const now = Date.now();
                    if (v.activeFlashBounty?.isActive && (v.activeFlashBounty.endTime || 0) > now) return 4;
                    const rules = getEffectiveRules(v);
                    const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
                    const currentDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
                    const isHH = rules.some((r) => {
                        if (r.days && r.days.length > 0 && !r.days.includes(currentDay)) return false;
                        const start = timeToMinutes(r.startTime);
                        const end = timeToMinutes(r.endTime);
                        return currentMinutes >= start && currentMinutes < end;
                    });
                    if (isHH) return 3;
                    if (v.flashBounties?.some((b) => (b as any).active && b.startTime > now)) return 2;
                    if (v.deal && !["none", "draft", "false", "", "mellow", "chill", "flowing", "gushing", "flooded", "packed"].includes(v.deal.toLowerCase())) return 1;
                    return 0;
                };

                const scoreA = getDealScore(a);
                const scoreB = getDealScore(b);

                if (scoreA !== scoreB) return scoreB - scoreA;
                if (isAPartner !== isBPartner) return isAPartner ? -1 : 1;
                if (isAPartner && isBPartner) {
                    const aHash = a.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const bHash = b.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    return ((aHash + rotationOffset) % 100) - ((bHash + rotationOffset) % 100);
                }
                const order: Record<VenueStatus, number> = { packed: 0, flooded: 1, gushing: 2, buzzing: 3, flowing: 4, trickle: 5 };
                return order[a.status] - order[b.status];
            }
            return 0;
        });

        return { result, fallbackMeta: tempFallbackMeta };
    }, [
        rawVenues, searchQuery, showOpenOnly, activeTag, activeSort,
        coords, filterKind, statusFilter, sceneFilter, playFilter,
        featureFilter, eventFilter, activeType, rotationOffset
    ]);


    // --- Actions ---
    const setViewMode = useCallback((m: 'list' | 'map') => {
        setViewModeInternal(m);
        setSearchParams(prev => {
            if (m === 'map') prev.set('view', 'map');
            else prev.delete('view');
            return prev;
        });
    }, [setSearchParams]);

    const setMapRegion = useState<string>('all')[1]; // Placeholder if mapRegion logic not full

    const isToday = useMemo(() => isSameDay(selectedDate, new Date()), [selectedDate]);

    const handleSetSelectedDate = useCallback((d: Date) => {
        setSelectedDate(d);
        const isFuture = isAfter(d, startOfToday()) && !isSameDay(d, new Date());
        if (isFuture) {
            const incompatibleFilters: FilterKind[] = ['all', 'status', 'scene', 'features'];
            if (incompatibleFilters.includes(filterKind)) {
                setFilterKind('events');
                setEventFilter('all');
            }
        }
    }, [filterKind]);

    const setSearchQueryStrict = useCallback((q: string) => {
        setSearchParams(prev => {
            if (q) prev.set('q', q);
            else prev.delete('q');
            return prev;
        });
    }, [setSearchParams]);

    const clearAllFilters = useCallback(() => {
        setFilterKind('all');
        setStatusFilter('all');
        setSceneFilter('all');
        setPlayFilter('all');
        setFeatureFilter('all');
        setEventFilter('all');
        setSelectedDate(new Date());

        // Reset Local Extras
        setSearchQueryStrict("");
        setActiveSort("buzz");
        setShowOpenOnly(false);
        setActiveType("all");
        setActiveTag(null);
    }, [setSearchQueryStrict]);

    const value = useMemo(() => ({
        allVenues: rawVenues,
        isLoading,
        processedVenues,
        fallbackMeta,
        searchQuery,
        setSearchQuery: setSearchQueryStrict,
        filterKind,
        setFilterKind,
        statusFilter,
        setStatusFilter,
        sceneFilter,
        setSceneFilter,
        playFilter,
        setPlayFilter,
        featureFilter,
        setFeatureFilter,
        eventFilter,
        setEventFilter,
        selectedDate,
        setSelectedDate: handleSetSelectedDate,
        viewMode: viewModeInternal,
        setViewMode,
        clearAllFilters,
        isToday,
        mapRegion: 'all',
        setMapRegion,
        searchParams,

        // Extras
        activeSort,
        setActiveSort,
        showOpenOnly,
        setShowOpenOnly,
        activeType,
        setActiveType,
        activeTag,
        setActiveTag
    }), [
        rawVenues, processedVenues, fallbackMeta, searchQuery, setSearchQueryStrict,
        filterKind, statusFilter, sceneFilter, playFilter, featureFilter,
        eventFilter, selectedDate, handleSetSelectedDate, viewModeInternal,
        setViewMode, clearAllFilters, isToday, searchParams,
        activeSort, showOpenOnly, activeType, activeTag
    ]);

    return (
        <DiscoveryContext.Provider value={value}>
            {children}
        </DiscoveryContext.Provider>
    );
};

export const useDiscovery = () => {
    const context = useContext(DiscoveryContext);
    if (context === undefined) {
        throw new Error('useDiscovery must be used within a DiscoveryProvider');
    }
    return context;
};

import React, { useState, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
    Beer, Bot, ChevronRight, Clock, Crown, Filter, Flame, MapPin, Music, Navigation, Search, Sparkles, Star, Trophy, Users
} from 'lucide-react';
import { Venue, VenueType, SceneTag, VenueStatus } from '../../../types';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { calculateDistance, metersToMiles } from '../../../utils/geoUtils';
import { isVenueOpen, getVenueStatus } from '../../../utils/venueUtils';
import { VenueGallery } from '../components/VenueGallery';
import { useToast } from '../../../components/ui/BrandedToast';
import { VibeMugs } from '../../../components/VibeMugs';

interface VenuesScreenProps {
    venues: Venue[];
    handleVibeCheck?: (v: Venue) => void;
    lastVibeChecks?: Record<string, number>;
    lastGlobalVibeCheck?: number;
}

type SortOption = 'alpha' | 'distance' | 'energy' | 'buzz';

export const VenuesScreen: React.FC<VenuesScreenProps> = ({ venues, handleVibeCheck, lastVibeChecks, lastGlobalVibeCheck }) => {
    const navigate = useNavigate();
    const { coords } = useGeolocation();
    const { showToast } = useToast();
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSort, setActiveSort] = useState<SortOption>('buzz');
    const [showOpenOnly, setShowOpenOnly] = useState(false);
    const [activeType, setActiveType] = useState<VenueType | 'all'>('all');
    const [activeTag, setActiveTag] = useState<string | null>(searchParams.get('filter') === 'makers' ? 'Makers' : null);

    // Rotation Logic (shifts every 5 minutes) ensures global fairness
    const rotationOffset = useMemo(() => {
        const rotationInterval = 5 * 60 * 1000;
        return Math.floor(Date.now() / rotationInterval);
    }, []);

    // Filter and Sort Logic
    const processedVenues = useMemo(() => {
        let result = venues.map(v => ({
            ...v,
            isOpen: isVenueOpen(v),
            hourStatus: getVenueStatus(v),
            distance: coords && v.location ? metersToMiles(calculateDistance(coords.latitude, coords.longitude, v.location.lat, v.location.lng)) : null
        })).filter(v => v.isActive !== false); // Filter out Soft Deleted / Archived venues

        // 1. Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(v =>
                (v.name && v.name.toLowerCase().includes(q)) ||
                (v.address && v.address.toLowerCase().includes(q)) ||
                (v.venueType && v.venueType.replace(/_/g, ' ').toLowerCase().includes(q)) ||
                (v.vibe && v.vibe.toLowerCase().includes(q)) ||
                // Keyword matches for amenities [NEW]
                (q.includes('dog') && v.isDogFriendly) ||
                (q.includes('family') && v.isAllAges) ||
                (q.includes('all ages') && v.isAllAges) ||
                (q.includes('kids') && v.isAllAges) ||
                (q.includes('outdoor') && v.hasOutdoorSeating) ||
                (q.includes('patio') && v.hasOutdoorSeating) ||
                (q.includes('private') && (v.hasPrivateRoom || (v.privateSpaces && v.privateSpaces.length > 0))) ||
                (q.includes('room') && (v.privateSpaces && v.privateSpaces.length > 0)) ||
                (q.includes('back room') && (v.privateSpaces && v.privateSpaces.length > 0))
            );
        }

        // 2. Open Only Filter
        if (showOpenOnly) {
            result = result.filter(v => v.isOpen);
        }

        // 3. Venue Type Filter (Primary Toggle)
        if (activeType !== 'all') {
            result = result.filter(v => v.venueType === activeType);
        }

        // 4. Tag Filter (Vibe Tags & Functional Tags)
        if (activeTag) {
            if (activeTag === 'Deals') result = result.filter(v => !!v.deal || (v.flashBounties && v.flashBounties.length > 0));
            else if (activeTag === 'Makers') {
                result = result.filter(v =>
                    v.isHQ ||
                    v.isLocalMaker ||
                    v.venueType === 'brewery_taproom'
                );
            }
            else if (activeTag === 'Tasting') {
                result = result.filter(v =>
                    v.venueType === 'winery_tasting' ||
                    v.makerType === 'Winery' ||
                    v.makerType === 'Distillery' ||
                    v.sceneTags?.includes('wine_focus')
                );
            }
            else if (activeTag === 'Trivia') result = result.filter(v => v.leagueEvent === 'trivia');
            // Check Vibe Tags
            else {
                const sceneTagValue = activeTag.toLowerCase().replace(/ /g, '_') as SceneTag; // rough mapping, better to specific map
                // Helper map for display -> value
                const TAG_MAP: Record<string, SceneTag> = {
                    'Dive': 'dive',
                    'Speakeasy': 'speakeasy',
                    'Sports': 'sports',
                    'Tiki': 'tiki_theme',
                    'Wine': 'wine_focus',
                    'Cocktails': 'cocktail_focus',
                    'LGBTQ+': 'lgbtq',
                    'Patio': 'patio_garden'
                };
                const targetScene = TAG_MAP[activeTag];
                if (targetScene) {
                    result = result.filter(v => v.sceneTags?.includes(targetScene));
                }
            }
        }

        // 4. Global Visibility
        result = result.filter(v => v.tier_config?.is_directory_listed !== false);

        // 5. Sorting
        result.sort((a, b) => {
            if (activeSort === 'alpha') {
                return a.name.localeCompare(b.name);
            }
            if (activeSort === 'distance') {
                const distA = a.distance ?? 999;
                const distB = b.distance ?? 999;
                return distA - distB;
            }
            if (activeSort === 'energy') {
                const order: Record<VenueStatus, number> = { packed: 0, buzzing: 1, chill: 2, mellow: 3, dead: 4 };
                return order[a.status] - order[b.status];
            }
            if (activeSort === 'buzz') {
                // Priority 0: Partner Exposure Equity (League Members)
                const isAPartner = a.isPaidLeagueMember;
                const isBPartner = b.isPaidLeagueMember;
                if (isAPartner !== isBPartner) return isAPartner ? -1 : 1;

                // Priority 1: Has Deal?
                const aHasDeal = !!(a.deal || (a.flashBounties && a.flashBounties.length > 0));
                const bHasDeal = !!(b.deal || (b.flashBounties && b.flashBounties.length > 0));

                if (aHasDeal && !bHasDeal) return -1;
                if (!aHasDeal && bHasDeal) return 1;

                // Priority 2: Tie-Break with Rotation
                if (isAPartner && isBPartner) {
                    const aHash = a.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const bHash = b.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    return ((aHash + rotationOffset) % 100) - ((bHash + rotationOffset) % 100);
                }

                // Fallback to Status
                const order: Record<VenueStatus, number> = { packed: 0, buzzing: 1, chill: 2, mellow: 3, dead: 4 };
                return order[a.status] - order[b.status];
            }
            return 0;
        });

        return result;
    }, [venues, searchQuery, showOpenOnly, activeTag, activeSort, coords]);

    return (
        <div className="bg-background min-h-screen pb-32 font-body text-slate-100">
            {/* Header & Search */}
            <div className="p-6 space-y-4">
                <div className="flex flex-col items-center gap-1 mb-2">
                    <h1 className="text-4xl font-black text-white tracking-widest font-league uppercase italic leading-none">
                        BAR <span className="text-primary">DIRECTORY</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1 italic">The OlyBars Index</p>
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
                        { id: 'all', label: 'All' },
                        { id: 'bar_pub', label: 'Bars' },
                        { id: 'restaurant_bar', label: 'Rest & Bar' },
                        { id: 'brewery_taproom', label: 'Breweries' },
                        { id: 'brewpub', label: 'Brewpubs' },
                        { id: 'lounge_club', label: 'Lounges' },
                        { id: 'arcade_bar', label: 'Arcades' }
                    ].map(type => (
                        <button
                            key={type.id}
                            onClick={() => setActiveType(type.id as VenueType | 'all')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeType === type.id
                                ? 'bg-white text-black border-white'
                                : 'bg-transparent text-slate-500 border-slate-800 hover:border-slate-600'
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
                            onClick={() => setActiveSort('buzz')}
                            className={`flex items-center gap-1 px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap font-league ${activeSort === 'buzz' ? 'bg-primary text-black border-black shadow-[2px_2px_0px_0px_#fff]' : 'bg-surface text-slate-400 border-slate-800'}`}
                        >
                            <Flame size={12} fill="currentColor" /> Buzz Clock
                        </button>
                        <button
                            onClick={() => setActiveSort('alpha')}
                            className={`px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap font-league ${activeSort === 'alpha' ? 'bg-primary text-black border-black shadow-[2px_2px_0px_0px_#fff]' : 'bg-surface text-slate-400 border-slate-800'}`}
                        >
                            Alphabetical
                        </button>
                        <button
                            onClick={() => setActiveSort('distance')}
                            className={`px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap font-league ${activeSort === 'distance' ? 'bg-primary text-black border-black shadow-[2px_2px_0px_0px_#fff]' : 'bg-surface text-slate-400 border-slate-800'}`}
                        >
                            Nearest
                        </button>
                        <button
                            onClick={() => setActiveSort('energy')}
                            className={`px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap font-league ${activeSort === 'energy' ? 'bg-primary text-black border-black shadow-[2px_2px_0px_0px_#fff]' : 'bg-surface text-slate-400 border-slate-800'}`}
                        >
                            Vibe Check
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            {['Makers', 'Tasting', 'Trivia', 'Deals', 'Dive', 'Speakeasy', 'Sports', 'Patio', 'Cocktails', 'Wine', 'Tiki', 'LGBTQ+'].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                                    className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all whitespace-nowrap ${activeTag === tag ? 'bg-primary/20 text-primary border-primary' : 'bg-transparent text-slate-500 border-slate-800'}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowOpenOnly(!showOpenOnly)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all ${showOpenOnly ? 'bg-green-500/20 text-green-400 border-green-500' : 'bg-transparent text-slate-500 border-slate-800'}`}
                        >
                            <Clock size={12} />
                            Open Now
                        </button>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="px-6 space-y-4">
                {processedVenues.length === 0 ? (
                    <div className="space-y-6">
                        <div className="text-center py-20 bg-surface/30 rounded-3xl border-2 border-dashed border-slate-800">
                            <Sparkles className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold uppercase tracking-widest font-league italic">No spots found in this vibe</p>
                        </div>

                        {/* Exposure Equity: Rotating Partner Fallback */}
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4 justify-center">
                                <Trophy className="w-5 h-5 text-primary" />
                                <h4 className="text-sm font-black text-primary uppercase tracking-widest font-league">League Partners</h4>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {[...venues]
                                    .filter(v => v.isPaidLeagueMember && v.isActive !== false)
                                    .map((v, i, arr) => {
                                        const shiftedIndex = (i + (rotationOffset % (arr.length || 1))) % (arr.length || 1);
                                        return arr[shiftedIndex];
                                    })
                                    .slice(0, 3)
                                    .map(v => (
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
                                                    <h5 className="text-sm font-black text-white uppercase italic tracking-wide">{v.name}</h5>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase">{v.vibe}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover/item:text-primary transition-all" />
                                        </Link>
                                    ))
                                }
                            </div>
                            <p className="mt-4 text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em] text-center italic">
                                Rotating exposure for OlyBars partners
                            </p>
                        </div>
                    </div>
                ) : (
                    processedVenues.map(venue => (
                        <div
                            key={venue.id}
                            className="bg-surface border-2 border-slate-700 rounded-3xl overflow-hidden hover:border-primary transition-all group shadow-2xl relative"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Link to={`/bars/${venue.id}`} className="hover:text-primary transition-colors">
                                                <h3 className="text-2xl font-black text-white font-league uppercase italic leading-none group-hover:text-primary transition-colors">
                                                    {venue.name}
                                                </h3>
                                            </Link>
                                            {venue.isPaidLeagueMember && (
                                                <div className="bg-primary px-2 py-0.5 rounded transform -skew-x-12">
                                                    <span className="text-black text-[8px] font-black uppercase italic">PARTNER</span>
                                                </div>
                                            )}
                                        </div>
                                        {/* Google Rating Badge */}
                                        {venue.googleRating && (
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                                <span className="text-xs font-black text-white">{venue.googleRating}</span>
                                                <span className="text-[10px] text-slate-500 font-bold">({venue.googleReviewCount})</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-body">
                                            <span>{venue.venueType.replace(/_/g, ' ')}</span>
                                            <span>•</span>
                                            <span className="italic">"{venue.vibe}"</span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <VibeMugs status={venue.status} size={14} />
                                        <div className={`text-[10px] font-black px-3 py-1 rounded-full border mb-2 mt-2 inline-block font-league uppercase tracking-widest ${venue.hourStatus === 'open' ? 'bg-green-500/10 text-green-400 border-green-400/30' : venue.hourStatus === 'last_call' ? 'bg-red-600/20 text-red-400 border-red-500 animate-pulse' : 'bg-red-500/10 text-red-400 border-red-400/30'}`}>
                                            {venue.hourStatus === 'open' ? 'Open Now' : venue.hourStatus === 'last_call' ? 'LAST CALL 🕒' : 'Closed'}
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
                                    {venue.deal && (
                                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                                            <Beer size={16} className="text-primary" />
                                            <div>
                                                <p className="text-[10px] font-black text-primary uppercase leading-none mb-1 font-league">Featured Deal</p>
                                                <p className="text-xs font-bold text-white font-body">{venue.deal}</p>
                                            </div>
                                        </div>
                                    )}

                                    {venue.leagueEvent && (
                                        <Link to={`/bars/${venue.id}`} className="block bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between group/event cursor-pointer hover:bg-slate-800 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Trophy size={16} className="text-primary" />
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase leading-none mb-1 font-league">Tonight's Play</p>
                                                    <p className="text-xs font-bold text-white uppercase font-body">{venue.leagueEvent}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-600 group-hover/event:text-primary transition-colors" />
                                        </Link>
                                    )}

                                    <div className="mt-4">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 font-league italic">Venue Gallery</p>
                                        <VenueGallery photos={venue.photos} />
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
                                    <div className="flex-1 flex items-center justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase font-league">
                                                <Music size={12} strokeWidth={3} />
                                                {venue.leagueEvent === 'karaoke' ? 'Karaoke High' : 'Vibe Varies'}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase font-league">
                                                <MapPin size={12} strokeWidth={3} />
                                                {venue.address ? venue.address.split(',')[0] : 'Downtown Oly'}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    showToast('Find the physical Vibe Spot QR code inside ' + venue.name + ' to report a vibe.', 'info');
                                                }}
                                                className={`px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all border outline-none bg-primary/5 border-primary/20 text-primary hover:bg-primary/20`}
                                            >
                                                <span className="flex flex-col items-center">
                                                    <span className="flex items-center gap-1">
                                                        <Users size={10} strokeWidth={3} /> Vibe Check (+5)
                                                    </span>
                                                    <span className="text-[6px] opacity-60">SCAN QR REQUIRED</span>
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

import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDiscovery } from '../contexts/DiscoveryContext';
import { GlobalSearch } from '../../../components/features/search/GlobalSearch';
import { DateContextSelector } from '../../../components/features/search/DateContextSelector';
import {
    ChevronRight, List, Map as MapIcon, MapPin,
    Zap, Flame, Beer, Clock, Compass, Tag, Calendar, Gamepad2, Theater, LayoutGrid,
    Target, Gamepad, MoveHorizontal, Disc, Puzzle, Users, Layers, Circle,
    Trophy, Music, HelpCircle, Mic2, Tv, Ticket, Swords, Sparkles, Mic, Trees,
    Trees as TreesIcon, CircleDot, Dices, Hammer, Key, Martini, Wine
} from 'lucide-react';
import { TAXONOMY_PLAY, TAXONOMY_EVENTS } from '../../../data/taxonomy';
import { Venue, VenueStatus } from '../../../types';
import { format } from 'date-fns';

interface DiscoveryControlsProps {
    venues?: Venue[];
}

export const DiscoveryControls: React.FC<DiscoveryControlsProps> = ({ venues = [] }) => {
    const {
        filterKind, setFilterKind,
        statusFilter, setStatusFilter,
        sceneFilter, setSceneFilter,
        playFilter, setPlayFilter,
        featureFilter, setFeatureFilter,
        eventFilter, setEventFilter,
        selectedDate, setSelectedDate,
        viewMode, setViewMode,
        clearAllFilters,
        mapRegion, setMapRegion
    } = useDiscovery();

    const navigate = useNavigate();
    const location = useLocation();

    const [showVibeMenu, setShowVibeMenu] = useState(false);
    const [showSceneMenu, setShowSceneMenu] = useState(false);
    const [showPlayMenu, setShowPlayMenu] = useState(false);
    const [showFeatureMenu, setShowFeatureMenu] = useState(false);
    const [showEventMenu, setShowEventMenu] = useState(false);

    const handleInteraction = () => {
        if (location.pathname !== '/') {
            navigate('/');
        }
    };

    const baseChipClasses = 'px-3 py-1.5 text-xs font-bold rounded-full border transition-all whitespace-nowrap';
    const statusActive = filterKind === 'status' || filterKind === 'all';
    const sceneActive = filterKind === 'scene';
    const playActive = filterKind === 'play';
    const featuresActive = filterKind === 'features';
    const eventsActive = filterKind === 'events';

    return (
        <div className="px-4 space-y-3 pb-3 bg-background sticky top-[64px] z-30">
            <div className="flex flex-col gap-2">
                {/* Top Row: Date Selector & Map/List Toggle */}
                <div className="flex justify-between items-center py-1">
                    <div className="flex flex-col gap-1">
                        <div onClick={() => { handleInteraction(); }}>
                            <DateContextSelector
                                selectedDate={selectedDate}
                                onDateChange={setSelectedDate}
                            />
                        </div>
                        {/* Smart Header: Location context */}
                        <div className="flex items-center gap-1.5 px-1 animate-in fade-in slide-in-from-left-2 duration-700">
                            <MapPin size={12} className="text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Near: <span className="text-white">{mapRegion.toUpperCase()}</span>
                            </span>
                            <button
                                onClick={() => {
                                    handleInteraction();
                                    const regions = ['downtown', 'lacey', 'tumwater', 'yelm', 'all'];
                                    const idx = regions.indexOf(mapRegion);
                                    setMapRegion(idx === -1 ? 'downtown' : regions[(idx + 1) % regions.length]);
                                }}
                                className="text-[10px] font-black uppercase tracking-widest text-primary underline decoration-primary/30 underline-offset-2 hover:text-white transition-colors"
                            >
                                (Change)
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            handleInteraction();
                            setViewMode(viewMode === 'list' ? 'map' : 'list');
                        }}
                        className="p-3 bg-transparent rounded-xl border border-white/20 text-slate-400 hover:text-primary hover:border-primary transition-all active:scale-95 flex items-center gap-2"
                    >
                        {viewMode === 'list' ? <><MapIcon size={18} /><span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Map</span></> : <><List size={18} /><span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">List</span></>}
                    </button>
                </div>

                {/* Middle Row: Search Bar */}
                <div className="w-full">
                    <GlobalSearch
                        placeholder="SEARCH BY BAR, CITY, OR VIBE..."
                        variant="hero"
                        className="!bg-transparent !shadow-none border-white/10 focus-within:!border-primary/50"
                    />
                </div>

                {/* Bottom Row: Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <button
                        onClick={() => {
                            handleInteraction();
                            clearAllFilters();
                        }}
                        className={`${baseChipClasses} ${filterKind === 'all' ? 'bg-primary text-black border-primary' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30 hover:text-white'} flex items-center gap-1.5`}
                    >
                        <Compass className="w-3 h-3" /> All
                    </button>

                    {/* VIBE (Status) - HERO TREATMENT */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowVibeMenu(!showVibeMenu);
                                setShowSceneMenu(false); setShowPlayMenu(false); setShowFeatureMenu(false); setShowEventMenu(false);
                            }}
                            className={`${baseChipClasses} ${statusActive && filterKind !== 'all'
                                ? 'bg-primary text-black border-primary'
                                : 'bg-transparent text-white border-primary shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                                } flex items-center gap-1.5 border-2`}
                        >
                            <Sparkles className="w-3 h-3" /> Vibe <ChevronRight className={`w-3 h-3 transition-transform ${showVibeMenu ? 'rotate-90' : ''}`} />
                        </button>
                    </div>

                    {/* DEALS */}
                    <button
                        onClick={() => {
                            handleInteraction();
                            setFilterKind('deals');
                            setShowVibeMenu(false); setShowSceneMenu(false); setShowPlayMenu(false); setShowFeatureMenu(false); setShowEventMenu(false);
                        }}
                        className={`${baseChipClasses} ${filterKind === 'deals' ? 'bg-primary text-black border-primary' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30 hover:text-white'} flex items-center gap-1.5`}
                    >
                        <Tag className="w-3 h-3" /> Deals
                    </button>

                    {/* EVENTS */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowEventMenu(!showEventMenu);
                                setShowVibeMenu(false); setShowSceneMenu(false); setShowPlayMenu(false); setShowFeatureMenu(false);
                            }}
                            className={`${baseChipClasses} ${eventsActive ? 'bg-primary text-black border-primary' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30 hover:text-white'} flex items-center gap-1.5`}
                        >
                            <Calendar className="w-3 h-3" /> Events <ChevronRight className={`w-3 h-3 transition-transform ${showEventMenu ? 'rotate-90' : ''}`} />
                        </button>
                    </div>

                    {/* PLAY */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowPlayMenu(!showPlayMenu);
                                setShowVibeMenu(false); setShowSceneMenu(false); setShowFeatureMenu(false); setShowEventMenu(false);
                            }}
                            className={`${baseChipClasses} ${playActive ? 'bg-primary text-black border-primary' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30 hover:text-white'} flex items-center gap-1.5`}
                        >
                            <Dices className="w-3 h-3" /> Play <ChevronRight className={`w-3 h-3 transition-transform ${showPlayMenu ? 'rotate-90' : ''}`} />
                        </button>
                    </div>



                    {/* SCENE */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowSceneMenu(!showSceneMenu);
                                setShowVibeMenu(false); setShowPlayMenu(false); setShowFeatureMenu(false); setShowEventMenu(false);
                            }}
                            className={`${baseChipClasses} ${sceneActive ? 'bg-primary text-black border-primary' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30 hover:text-white'} flex items-center gap-1.5`}
                        >
                            <Theater className="w-3 h-3" /> Scene <ChevronRight className={`w-3 h-3 transition-transform ${showSceneMenu ? 'rotate-90' : ''}`} />
                        </button>
                    </div>

                    {/* FEATURES */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowFeatureMenu(!showFeatureMenu);
                                setShowVibeMenu(false); setShowSceneMenu(false); setShowPlayMenu(false); setShowEventMenu(false);
                            }}
                            className={`${baseChipClasses} ${featuresActive ? 'bg-primary text-black border-primary' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30 hover:text-white'} flex items-center gap-1.5`}
                        >
                            <LayoutGrid className="w-3 h-3" /> Features <ChevronRight className={`w-3 h-3 transition-transform ${showFeatureMenu ? 'rotate-90' : ''}`} />
                        </button>
                    </div>

                    {/* MAKERS */}
                    <button
                        onClick={() => {
                            handleInteraction();
                            setFilterKind('makers');
                            setShowVibeMenu(false); setShowSceneMenu(false); setShowPlayMenu(false); setShowFeatureMenu(false); setShowEventMenu(false);
                        }}
                        className={`${baseChipClasses} ${filterKind === 'makers' ? 'bg-primary text-black border-primary' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30 hover:text-white'} flex items-center gap-1.5`}
                    >
                        <Hammer className="w-3 h-3" /> Makers
                    </button>
                </div>

                {/* Active Menu Sub-Row */}
                {(showVibeMenu || showSceneMenu || showPlayMenu || showFeatureMenu || showEventMenu) && (
                    <div className="pt-2 animate-in slide-in-from-top-2 fade-in duration-200 border-t border-white/5 mx-2">
                        <div className="flex flex-wrap gap-2">
                            {/* VIBE OPTIONS */}
                            {showVibeMenu && [
                                { id: 'packed', label: 'Packed', icon: Zap },
                                { id: 'buzzing', label: 'Buzzing', icon: Flame },
                                { id: 'chill', label: 'Chill', icon: Beer },
                                { id: 'mellow', label: 'Mellow', icon: Clock }
                            ].map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        handleInteraction();
                                        setStatusFilter(option.id as VenueStatus);
                                        setFilterKind('status');
                                        setShowVibeMenu(false);
                                    }}
                                    className={`px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-all active:scale-95 flex items-center gap-2 ${statusFilter === option.id && filterKind === 'status' ? 'border-primary text-primary' : ''}`}
                                >
                                    {option.icon && <option.icon className="w-3.5 h-3.5" />}
                                    {option.label}
                                </button>
                            ))}

                            {/* SCENE OPTIONS */}
                            {showSceneMenu && [
                                { id: 'dive', label: 'Dive Bar', icon: Beer },
                                { id: 'sports', label: 'Sports Bar', icon: Trophy },
                                { id: 'speakeasy', label: 'Speakeasy', icon: Key },
                                { id: 'cocktail', label: 'Cocktails', icon: Martini },
                                { id: 'wine', label: 'Wine & Tapas', icon: Wine },
                                { id: 'brewery', label: 'Brewery', icon: Beer }
                            ].map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        handleInteraction();
                                        setSceneFilter(option.id);
                                        setFilterKind('scene');
                                        setShowSceneMenu(false);
                                    }}
                                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    {option.icon && <option.icon className="w-3.5 h-3.5" />}
                                    {option.label}
                                </button>
                            ))}

                            {/* PLAY OPTIONS */}
                            {showPlayMenu && TAXONOMY_PLAY.slice(0, 12).map(game => {
                                const PlayIcon = {
                                    'Pool': Target,
                                    'Pinball': Zap,
                                    'Darts': Target,
                                    'Arcade': Gamepad,
                                    'Shuffleboard': MoveHorizontal,
                                    'Cornhole': CircleDot,
                                    'Skee-Ball': Disc,
                                    'Board Games': Puzzle,
                                    'Ping Pong': MoveHorizontal,
                                    'Foosball': Users,
                                    'Giant Jenga': Layers,
                                    'Ring Toss': Circle
                                }[game] || Dices;

                                return (
                                    <button
                                        key={game}
                                        onClick={() => {
                                            handleInteraction();
                                            setPlayFilter(game);
                                            setFilterKind('play');
                                            setShowPlayMenu(false);
                                        }}
                                        className={`px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-all active:scale-95 flex items-center gap-2 ${playFilter === game ? 'border-primary text-primary' : ''}`}
                                    >
                                        <PlayIcon className="w-3.5 h-3.5" /> {game}
                                    </button>
                                );
                            })}

                            {/* FEATURES OPTIONS */}
                            {showFeatureMenu && [
                                { id: 'patio', label: 'Patio', icon: TreesIcon },
                                { id: 'dog_friendly', label: 'Dog Friendly', icon: Trees }, // Using tree for outdoors/dogs for now, Lucide doesn't have a dog icon in standard set often, wait... it usually does as Dog.
                                { id: 'all_ages', label: 'All Ages', icon: Users },
                                { id: 'fireplace', label: 'Fireplace', icon: Flame },
                                { id: 'dance_floor', label: 'Dance Floor', icon: Music },
                            ].map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        handleInteraction();
                                        setFeatureFilter(option.id);
                                        setFilterKind('features');
                                        setShowFeatureMenu(false);
                                    }}
                                    className={`px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-all active:scale-95 flex items-center gap-2 ${featureFilter === option.id ? 'border-primary text-primary' : ''}`}
                                >
                                    {option.icon && <option.icon className="w-3.5 h-3.5" />} {option.label}
                                </button>
                            ))}

                            {/* EVENTS OPTIONS */}
                            {showEventMenu && (
                                <>
                                    <button
                                        onClick={() => {
                                            handleInteraction();
                                            setEventFilter('all');
                                            setFilterKind('events');
                                            setShowEventMenu(false);
                                        }}
                                        className={`px-3 py-2 ${eventFilter === 'all' ? 'bg-primary text-black' : 'bg-slate-800 text-slate-200'} hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 transition-all active:scale-95 flex items-center gap-2`}
                                    >
                                        <Calendar className="w-3.5 h-3.5" /> All Events
                                    </button>
                                    {TAXONOMY_EVENTS.map((event: string) => {
                                        const EventIcon = {
                                            'League Night': Trophy,
                                            'Live Music': Music,
                                            'Trivia Night': HelpCircle,
                                            'Karaoke': Mic2,
                                            'DJ': Disc,
                                            'Watch Party': Tv,
                                            'Bar Bingo': Ticket,
                                            'Tournaments': Swords,
                                            'Theme Night': Sparkles,
                                            'Open Mic': Mic
                                        }[event] || Calendar;

                                        return (
                                            <button
                                                key={event}
                                                onClick={() => {
                                                    handleInteraction();
                                                    setEventFilter(event);
                                                    setFilterKind('events');
                                                    setShowEventMenu(false);
                                                }}
                                                className={`px-3 py-2 ${eventFilter === event ? 'bg-primary text-black' : 'bg-slate-800 text-slate-200'} hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 transition-all active:scale-95 flex items-center gap-2`}
                                            >
                                                <EventIcon className="w-3.5 h-3.5" /> {event}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => {
                                            handleInteraction();
                                            setEventFilter('other');
                                            setFilterKind('events');
                                            setShowEventMenu(false);
                                        }}
                                        className={`px-3 py-2 ${eventFilter === 'other' ? 'bg-primary text-black' : 'bg-slate-800 text-slate-200'} hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 transition-all active:scale-95 flex items-center gap-2`}
                                    >
                                        <Layers className="w-3.5 h-3.5" /> Other
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchVenueById } from '../../../services/venueService';
import { isVenueOwner, isVenueManager, hasVenueAccess, isSystemAdmin } from '../../../types/auth_schema';
import { ASSETS } from '../../../components/partners/AssetToggleGrid';
import {
    MapPin, Clock, Beer, Trophy, Music, Users,
    ChevronLeft, Navigation, Star, Shield, Info,
    Flame, Calendar, Share2, ChevronRight, Zap,
    Settings, Instagram, Facebook, Twitter, Mail, Phone,
    Scroll, Sparkles, Feather, Gamepad2, LayoutGrid, CheckCircle2,
    Utensils, ChefHat, Pizza, ShoppingBag, Ban, AlertTriangle,
    Target, Mic2, HelpCircle, Box, Disc, ExternalLink, X, Crown, Key
} from 'lucide-react';
import { formatToAMPM } from '../../../utils/timeUtils';
import { Venue, UserProfile } from '../../../types';
import { SEO } from '../../../components/common/SEO';
import { VenueGallery } from '../components/VenueGallery';
import { getVenueStatus, isVenueOpen } from '../../../utils/venueUtils';
import { useToast } from '../../../components/ui/BrandedToast';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { calculateDistance, metersToMiles, estimateWalkTime, getZone } from '../../../utils/geoUtils';
import { ArtieDistanceWarningModal } from '../components/ArtieDistanceWarningModal';
import { GatekeeperModal } from '../components/GatekeeperModal';
import { TapSourceModal } from '../components/TapSourceModal';
import { updateUserProfile, logUserActivity } from '../../../services/userService';

interface VenueProfileScreenProps {
    onOpenSips?: () => void;
    onOpenHomeBase?: (venueId: string, venueName: string) => void;
}

const VENUE_TYPE_LABELS: Record<string, string> = {
    bar_pub: 'Bar / Pub',
    restaurant_bar: 'Restaurant & Bar',
    brewery_taproom: 'Brewery / Taproom',
    lounge_club: 'Lounge / Club',
    arcade_bar: 'Arcade Bar',
    brewpub: 'Brewpub'
};

export const VenueProfileScreen: React.FC<VenueProfileScreenProps> = ({ onOpenSips, onOpenHomeBase }) => {
    const {
        venues,
        userProfile,
        onClockIn: handleClockIn,
        onVibeCheck: handleVibeCheck,
        clockedInVenue,
        onToggleFavorite: handleToggleFavoriteProp,
        onEditVenue: onEdit
    } = useOutletContext<{
        venues: Venue[];
        userProfile: UserProfile;
        onClockIn: (v: Venue) => void;
        onVibeCheck: (v: Venue, hasConsent?: boolean, photoUrl?: string) => void;
        clockedInVenue?: string | null;
        onToggleFavorite: (venueId: string) => void;
        onEditVenue?: (venueId: string) => void;
    }>();

    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();

    // 1. Initial Data from Context (Brief Mode)
    const contextVenue = venues.find(v => v.id === id);

    // 2. Fetch Full Data (Deep Mode) in background
    const { data: venue = contextVenue, isLoading: isFullLoading } = useQuery({
        queryKey: ['venue', id],
        queryFn: () => fetchVenueById(id!),
        enabled: !!id,
        initialData: contextVenue,
        staleTime: 60 * 1000,
    });

    const { coords } = useGeolocation({ shouldPrompt: false });

    const [isWarningOpen, setIsWarningOpen] = useState(false);
    const [distanceInfo, setDistanceInfo] = useState({ miles: 0, mins: 0 });
    const [zones, setZones] = useState({ user: '', destination: '' });

    // Membership Gating
    const [isGatekeeperOpen, setIsGatekeeperOpen] = useState(false);
    const [isMembershipVerified, setIsMembershipVerified] = useState(false);

    // [NEW] Tap Source (Lead Capture)
    const [isTapSourceOpen, setIsTapSourceOpen] = useState(false);

    useEffect(() => {
        if (venue?.membershipRequired && !isMembershipVerified) {
            setIsGatekeeperOpen(true);
        }
    }, [venue, isMembershipVerified]);

    const onToggleFavorite = (venueId: string) => {
        const isCurrentlyFavorite = userProfile.favorites?.includes(venueId);
        handleToggleFavoriteProp(venueId);

        // If Adding + No Home Base -> Prompt Home Base
        if (!isCurrentlyFavorite) {
            if (!userProfile.homeBase && onOpenHomeBase && venue) {
                onOpenHomeBase(venueId, venue.name);
            }
            // Fallback: If Adding + No Phone -> Capture Lead
            else if (!userProfile.phone) {
                setIsTapSourceOpen(true);
            } else {
                showToast("You'll now get alerts for this spot! 🌟", "success");
            }
        }
    };

    const handleTapSourceSubmit = async (phone: string) => {
        if (!userProfile?.uid || !venue) return;

        // 1. Update Profile (Fire & Forget for UI speed)
        await updateUserProfile(userProfile.uid, { phone });

        // 2. Award Drops (25)
        await logUserActivity(userProfile.uid, {
            type: 'bonus',
            venueId: venue.id,
            points: 25,
            metadata: { source: 'tap_source_modal', action: 'phone_capture' }
        });

        // Modal handles its own success state/timeout
    };

    const timeToMinutes = (timeStr: string) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };

    const activeHappyHour = React.useMemo(() => {
        const now = new Date();
        const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        if (!venue) return null;

        const rules = [...(venue.happyHourRules || [])];
        if (venue.happyHour?.startTime) {
            rules.push({
                id: 'legacy',
                startTime: venue.happyHour.startTime,
                endTime: venue.happyHour.endTime,
                days: venue.happyHour.days || [],
                description: venue.happyHour.description,
                specials: venue.happyHourSpecials || venue.happyHourSimple
            });
        }

        return rules.find(r => {
            if (r.days && r.days.length > 0 && !r.days.includes(currentDay)) return false;
            const start = timeToMinutes(r.startTime);
            const end = timeToMinutes(r.endTime);
            return currentMinutes >= start && currentMinutes < end;
        });
    }, [venue]);

    // [PHASE 1] Menu & Flight Builder State
    const [flightItems, setFlightItems] = useState<any[]>([]); // Using any for now to avoid extensive type imports in this file if not present
    const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);

    const toggleFlightItem = (item: any) => {
        if (flightItems.find(i => i.id === item.id)) {
            setFlightItems(flightItems.filter(i => i.id !== item.id));
        } else {
            if (flightItems.length >= 4) {
                showToast("Flight full (Max 4 items)", "error");
                return;
            }
            setFlightItems([...flightItems, item]);
        }
    };

    const flightStats = React.useMemo(() => {
        if (flightItems.length === 0) return { abv: 0, price: 0 };
        const totalAbv = flightItems.reduce((acc, item) => acc + (item.stats?.abv || 0), 0);
        return {
            abv: (totalAbv / flightItems.length).toFixed(1),
            price: '??' // Price logic depends on data
        };
    }, [flightItems]);

    // AI SEO: Generate Schema.org JSON-LD
    const getLDSchema = () => {
        if (!venue) return null;

        const baseSchema: any = {
            "@context": "https://schema.org",
            "@type": venue.venueType === 'restaurant_bar' ? 'Restaurant' : 'Bar',
            "name": venue.name,
            "image": venue.photos?.[0]?.url,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": venue.address || "Thurston County",
                "addressLocality": venue.address?.includes('Lacey') ? 'Lacey' : venue.address?.includes('Tumwater') ? 'Tumwater' : 'Olympia',
                "addressRegion": "WA",
                "addressCountry": "US"
            },
            "url": window.location.href,
            "telephone": venue.phone,
            "servesCuisine": venue.venueType === 'restaurant_bar' ? venue.vibe : undefined,
            "priceRange": "$$",
            "description": venue.insiderVibe || venue.originStory,
            "publicAccess": venue.physicalRoom !== false,
            "additionalProperty": [
                {
                    "@type": "PropertyValue",
                    "name": "Oly Pulse Status",
                    "value": venue.status || "chill",
                    "description": "Real-time activity level from OlyBars.com"
                }
            ],
            "eventStatus": isVenueOpen(venue) ? "https://schema.org/EventScheduled" : "https://schema.org/EventCancelled"
        };

        const events: any[] = [];
        if (venue.leagueEvent) {
            events.push({
                "@type": "Event",
                "name": `${venue.leagueEvent} at ${venue.name}`,
                "startDate": new Date().toISOString().split('T')[0] + "T19:00:00",
                "location": {
                    "@type": "Place",
                    "name": venue.name,
                    "address": venue.address
                },
                "description": "Artesian Bar League Sanctioned Event",
                "keywords": "League Play, Trivia, Artesian Bar League"
            });
        }

        if (venue.deal) {
            events.push({
                "@type": "Event",
                "name": "Happy Hour Deal",
                "description": venue.deal,
                "location": {
                    "@type": "Place",
                    "name": venue.name
                }
            });
        }

        if (events.length > 0) {
            baseSchema.event = events;
        }

        const breadcrumbSchema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://olybars.com/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Bars",
                    "item": "https://olybars.com/bars"
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": venue.name,
                    "item": `https://olybars.com/bars/${venue.id}`
                }
            ]
        };

        return [baseSchema, breadcrumbSchema];
    };

    const handleShare = async () => {
        if (!venue) return;
        const shareData = {
            title: `OlyBars - ${venue.name}`,
            text: `Clocking in at ${venue.name} on OlyBars. Come join the league!`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    const handleDirectionsClick = () => {
        if (!venue || !venue.location) return;

        if (coords) {
            const distMeters = calculateDistance(
                coords.latitude,
                coords.longitude,
                venue.location.lat,
                venue.location.lng
            );
            const miles = metersToMiles(distMeters);
            const mins = estimateWalkTime(distMeters);
            const userZone = getZone(coords.latitude, coords.longitude);
            const destZone = getZone(venue.location.lat, venue.location.lng);

            if (miles > 0.8 || mins > 15 || (userZone !== destZone && userZone !== 'Unknown' && destZone !== 'Unknown')) {
                setDistanceInfo({ miles, mins });
                setZones({ user: userZone, destination: destZone });
                setIsWarningOpen(true);
                return;
            }
        }

        // Direct to Google Maps if close or location unknown
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${venue.location.lat},${venue.location.lng}`, '_blank');
    };

    if (!venue) {
        return (
            <div className="p-10 text-center text-slate-500 font-bold">
                <p>Venue Not Found</p>
                <button onClick={() => navigate('/')} className="mt-4 text-primary hover:underline">Return to Discovery</button>
            </div>
        );
    }

    const status = getVenueStatus(venue);
    const isOpen = isVenueOpen(venue);

    return (
        <div className="bg-background min-h-screen pb-32 font-body text-slate-100 animate-in fade-in duration-500">
            {venue && (
                <TapSourceModal
                    isOpen={isTapSourceOpen}
                    onClose={() => setIsTapSourceOpen(false)}
                    venue={venue}
                    onSubmit={handleTapSourceSubmit}
                />
            )}
            {/* AI SEO: Metadata & JSON-LD */}
            <SEO
                title={venue.name}
                description={venue.insiderVibe || `Explore ${venue.name} in Thurston County. Live vibes, happy hours, and league play.`}
                ogImage={venue.photos?.[0]?.url}
                ogType="profile"
                jsonLd={getLDSchema()}
            />

            {/* Simple Back Button */}
            <div className="px-6 pt-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-primary mb-4 hover:opacity-80 transition-opacity uppercase font-black tracking-widest text-xs"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                </button>
            </div>

            {/* Hero Header */}
            <div className="relative h-64 overflow-hidden">
                <img
                    src={venue.photos?.[0]?.url || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop'}
                    className="w-full h-full object-cover opacity-60"
                    alt={venue.name}
                />

                {/* Hybrid "Master Maker" Badge (Bar + Maker) */}
                {venue.isLocalMaker && venue.makerType !== 'Distillery' && venue.makerType !== 'Brewery' && (
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl border border-primary/50 px-6 py-2 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.2)] flex items-center gap-2 transform hover:scale-105 transition-transform cursor-help z-20">
                        <Trophy className="w-4 h-4 text-primary fill-primary animate-pulse" />
                        <span className="text-xs font-black text-primary uppercase tracking-widest font-league">Master Maker</span>
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

                <div className="absolute top-6 right-6 flex gap-2 z-10">
                    <button
                        onClick={() => onToggleFavorite(venue.id)}
                        className={`p-2 bg-black/50 backdrop-blur-md rounded-full border transition-colors ${userProfile.favorites?.includes(venue.id)
                            ? 'border-primary text-primary'
                            : 'border-white/10 text-white hover:bg-black'
                            }`}
                    >
                        <Star className={`w-5 h-5 ${userProfile.favorites?.includes(venue.id) ? 'fill-primary' : ''}`} />
                    </button>
                    <button
                        onClick={handleShare}
                        className="p-2 bg-black/50 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-black transition-colors"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                    {isVenueManager(userProfile, venue.id) && (
                        <button
                            onClick={() => onEdit?.(venue.id)}
                            className="p-2 bg-primary/20 backdrop-blur-md rounded-full text-primary border border-primary/30 hover:bg-primary/40 transition-colors"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex justify-between items-end">
                        <div className="max-w-[70%]">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-4xl font-black text-white font-league uppercase italic leading-[0.9] whitespace-normal break-words py-1">
                                    {venue.name}
                                </h1>
                                {venue.isHQ && <Shield className="w-5 h-5 text-primary fill-primary" />}
                                {venue.isBoutique && <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400" />}
                            </div>

                            {/* Review Score & Type */}
                            <div className="flex items-center gap-3 mb-2">
                                {(venue.googleRating) && (
                                    <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-sm">
                                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                        <span className="text-xs font-black text-white">{venue.googleRating}</span>
                                        <span className="text-[10px] text-slate-300">({venue.googleReviewCount})</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-widest truncate">
                                    <span>{venue.venueType === 'brewpub' ? 'Brewpub' : (venue.makerType || VENUE_TYPE_LABELS[venue.venueType] || venue.venueType)}</span>
                                    <span>•</span>
                                    <span className="text-primary italic">"{venue.vibe}"</span>
                                </div>
                            </div>

                            {/* [NEW] Compact Social Row */}
                            <div className="flex items-center gap-3">
                                {venue.website && (
                                    <a href={venue.website} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                                {venue.instagram && (
                                    <a href={`https://instagram.com/${venue.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-colors">
                                        <Instagram className="w-4 h-4" />
                                    </a>
                                )}
                                {venue.facebook && (
                                    <a href={venue.facebook.startsWith('http') ? venue.facebook : `https://${venue.facebook}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-400 transition-colors">
                                        <Facebook className="w-4 h-4" />
                                    </a>
                                )}
                                {venue.email && (
                                    <a href={`mailto:${venue.email}`} className="text-slate-400 hover:text-orange-400 transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </a>
                                )}
                                {venue.phone && (
                                    <a href={`tel:${venue.phone}`} className="text-slate-400 hover:text-green-400 transition-colors">
                                        <Phone className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Open Status Badge */}
                        {venue.physicalRoom !== false ? (
                            <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${status === 'open' ? 'bg-green-500/10 text-green-400 border-green-400/30' :
                                status === 'last_call' ? 'bg-red-600/20 text-red-500 border-red-500/50 animate-pulse' :
                                    'bg-red-500/10 text-red-400 border-red-400/30'
                                }`}>
                                {status === 'open' ? 'Open Now' : status === 'last_call' ? 'LAST CALL' : 'Closed'}
                            </div>
                        ) : (
                            <div className="px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                                Production Only
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-8">
                {/* [NEW] FLASH BOUNTY (TOP PRIORITY) */}
                {(venue.activeFlashBounty?.title || venue.deal) && (
                    <div className="bg-red-500/10 border-2 border-red-500/50 rounded-2xl p-5 flex gap-5 animate-in zoom-in-95 duration-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                        <div className="bg-red-500 p-3 h-fit rounded-xl shadow-lg shadow-red-500/40">
                            <Zap className="w-6 h-6 text-white fill-white" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em] italic">Live Flash Bounty</p>
                                {venue.activeFlashBounty?.endTime && (
                                    <span className="text-[9px] font-mono text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                        ENDS {formatToAMPM(new Date(venue.activeFlashBounty.endTime).toTimeString().slice(0, 5))}
                                    </span>
                                )}
                            </div>
                            <h4 className="text-xl font-black text-white uppercase font-league leading-none mb-1 tracking-tight">
                                {(venue.activeFlashBounty?.title || venue.deal)?.replace(/⚡/g, '').trim()}
                            </h4>
                            <p className="text-sm font-bold text-red-100/80 leading-snug">
                                {venue.activeFlashBounty?.description || 'Limited time offer! Get down here now to claim your bonus.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* LIVE GAME STATUS (PREMIUM) */}
                {venue.hasGameVibeCheckEnabled && venue.liveGameStatus && Object.keys(venue.liveGameStatus).length > 0 && (
                    <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-500 shadow-lg">
                        <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <h4 className="text-xs font-black text-slate-300 uppercase tracking-[0.15em]">Live Game Status</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {venue.gameFeatures?.filter(f => venue.liveGameStatus?.[f.id]).map(feature => {
                                const statusData = venue.liveGameStatus![feature.id];
                                const now = Date.now();

                                // Check expiration
                                const isExpired = statusData.expiresAt && now > statusData.expiresAt;
                                const isTaken = statusData.status === 'taken' && !isExpired;

                                const minsAgo = Math.floor((now - statusData.timestamp) / 60000);
                                const minsLeft = statusData.expiresAt ? Math.ceil((statusData.expiresAt - now) / 60000) : 0;

                                return (
                                    <div key={feature.id} className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-white/5">
                                        <span className="text-xs font-bold text-slate-300 uppercase">{feature.name}</span>
                                        <div className="text-right">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${isTaken ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                {isTaken ? 'In Use' : 'Open'}
                                            </span>
                                            <p className="text-[8px] text-slate-600 font-mono mt-0.5">
                                                {isTaken && minsLeft > 0 ? `Free in ~${minsLeft}m` : (minsAgo < 1 ? 'Just now' : `${minsAgo}m ago`)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className={`bg-surface border-[1.5px] p-4 rounded-2xl flex flex-col items-center gap-1 relative overflow-hidden group ${(venue.status === 'buzzing' || venue.status === 'packed') ? 'border-primary shadow-[0_0_15px_rgba(251,191,36,0.15)]' :
                        venue.status === 'chill' ? 'border-blue-400/50 shadow-[0_0_10px_rgba(59,130,246,0.1)]' :
                            'border-slate-700 shadow-none'
                        }`}>
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${(venue.status === 'buzzing' || venue.status === 'packed') ? 'bg-primary/5' : 'bg-white/5'
                            }`} />

                        {(venue.status === 'buzzing' || venue.status === 'packed') ?
                            <Flame className="w-5 h-5 text-orange-500 animate-pulse fill-orange-500/20" /> :
                            venue.status === 'chill' ?
                                <Users className="w-5 h-5 text-blue-400 fill-blue-400/20" /> :
                                <Beer className="w-5 h-5 text-slate-500 fill-slate-500/20" />
                        }

                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest relative z-10">Energy</span>
                        <span className={`text-sm font-black uppercase font-league relative z-10 ${(venue.status === 'buzzing' || venue.status === 'packed') ? 'text-white' :
                            venue.status === 'chill' ? 'text-blue-100' :
                                'text-slate-400'
                            }`}>
                            {venue.status === 'dead' ? 'TRICKLE' :
                                venue.status === 'mellow' ? 'TRICKLE' :
                                    venue.status === 'chill' ? 'FLOWING' :
                                        venue.status === 'buzzing' ? 'GUSHING' :
                                            venue.status === 'packed' ? 'FLOODED' : venue.status}
                        </span>
                    </div>
                    <div className="bg-surface border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-1 shadow-lg">
                        <Trophy className="w-5 h-5 text-primary" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Clock Ins</span>
                        <span className="text-sm font-black text-white font-mono">{venue.clockIns}</span>
                    </div>
                    <div className="bg-surface border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-1 shadow-lg">
                        <Clock className="w-5 h-5 text-slate-400" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Hours</span>
                        <span className="text-[10px] font-bold text-white uppercase">
                            {typeof venue.hours === 'string' ? venue.hours : 'Featured Hours'}
                        </span>
                    </div>
                    {/* Food Service Status */}
                    <div className="bg-surface border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-1 shadow-lg">
                        {venue.foodService === 'full_kitchen' ? <Utensils className="w-5 h-5 text-green-400" /> :
                            venue.foodService === 'limited_kitchen' ? <ChefHat className="w-5 h-5 text-yellow-400" /> :
                                venue.foodService === 'snacks' ? <Pizza className="w-5 h-5 text-orange-400" /> :
                                    <ShoppingBag className="w-5 h-5 text-blue-400" />}
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Food</span>
                        <span className="text-[10px] font-bold text-white uppercase truncate w-full text-center">
                            {venue.foodService === 'full_kitchen' ? 'Full Kitchen' :
                                venue.foodService === 'limited_kitchen' ? 'Pub Grub' :
                                    venue.foodService === 'snacks' ? 'Snacks' : 'BYO / None'}
                        </span>
                    </div>
                </div>

                {/* Strategic Tags: Capacity & Sober Friendly */}
                {(venue.isLowCapacity || venue.isSoberFriendly || venue.isAllAges || venue.isDogFriendly || venue.hasOutdoorSeating) && (
                    <div className="flex gap-2 flex-wrap">
                        {venue.isLowCapacity && (
                            <div className="bg-red-900/20 border border-red-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                <Users className="w-3 h-3 text-red-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-300">Micro-Venue: Low Capacity</span>
                            </div>
                        )}
                        {venue.isSoberFriendly && (
                            <div className="bg-blue-500/10 border border-blue-500/30 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-[0_0_15px_rgba(59,130,246,0.1)] group hover:border-blue-500/50 transition-all">
                                <div className="p-1.5 bg-blue-500 rounded-lg">
                                    <Shield className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 leading-none">Verified Badge</span>
                                    <span className="text-[11px] font-bold text-blue-100 uppercase tracking-tighter">Sober Friendly Choice</span>
                                </div>
                            </div>
                        )}
                        {venue.isAllAges && (
                            <div className="bg-green-900/20 border border-green-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                <Users className="w-3 h-3 text-green-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-green-300">All Ages Welcome</span>
                            </div>
                        )}
                        {venue.isDogFriendly && (
                            <div className="bg-purple-900/20 border border-purple-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-purple-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-purple-300">Dog Friendly</span>
                            </div>
                        )}
                        {venue.hasOutdoorSeating && (
                            <div className="bg-orange-900/20 border border-orange-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-orange-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-orange-300">Outdoor Seating</span>
                            </div>
                        )}
                    </div>
                )}


                {/* Insider Vibe (Pit/Stephanie/Chris Personas) */}
                {venue.insiderVibe && (
                    <div className="bg-primary/10 border border-primary/30 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 -translate-y-1/2 translate-x-1/2 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-1000" />
                        <Sparkles className="w-6 h-6 text-primary absolute top-4 right-4" />

                        <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Insider Vibe
                        </h3>
                        <p className="text-sm font-bold text-white leading-relaxed italic">
                            "{venue.insiderVibe}"
                        </p>
                    </div>
                )}

                {/* Origin Story */}
                {venue.originStory && (
                    <div className="bg-surface border border-white/5 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-10 transition-opacity duration-700" />
                        <Scroll className="w-8 h-8 text-white/5 absolute top-4 right-4" />

                        <h3 className="text-lg font-black text-white uppercase font-league mb-4 relative z-10 flex items-center gap-2">
                            <Feather className="w-4 h-4 text-primary" />
                            The Origin Story
                        </h3>
                        <div className="prose prose-invert prose-sm">
                            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line relative z-10 font-serif italic opacity-90">
                                {venue.originStory}
                            </p>
                        </div>
                    </div>
                )}

                {/* Action Bar */}
                {venue.physicalRoom !== false ? (
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleClockIn(venue)}
                            disabled={clockedInVenue === venue.id || (venue.membershipRequired && !isMembershipVerified)}
                            className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-xl shadow-primary/10 ${(clockedInVenue === venue.id || (venue.membershipRequired && !isMembershipVerified))
                                ? 'bg-slate-800 text-slate-500 border border-slate-700'
                                : 'bg-primary text-black hover:scale-[1.02] active:scale-95'
                                }`}
                        >
                            <MapPin className="w-4 h-4" />
                            {clockedInVenue === venue.id ? 'Clocked In' : 'Clock In (+10)'}
                        </button>
                        <button
                            onClick={() => handleVibeCheck(venue)}
                            disabled={venue.membershipRequired && !isMembershipVerified}
                            className={`flex-1 py-4 bg-surface border-2 border-slate-700 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex flex-col items-center justify-center text-slate-100 hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-95 shadow-xl ${(venue.membershipRequired && !isMembershipVerified) ? 'opacity-50 grayscale cursor-not-allowed' : ''
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-primary" />
                                <span>Vibe Check (+5)</span>
                            </div>
                            <span className="text-[7px] text-primary/60 mt-1">REPORT FROM THE FIELD</span>
                        </button>
                        <button
                            onClick={handleDirectionsClick}
                            className="bg-slate-900 border-2 border-slate-700 p-4 rounded-2xl text-slate-100 hover:border-primary/50 transition-all active:scale-95"
                        >
                            <Navigation className="w-5 h-5 text-primary" />
                        </button>
                    </div>
                ) : (
                    <div className="bg-blue-900/20 border-2 border-blue-500/30 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-3 animate-pulse" />
                        <h4 className="text-lg font-black text-white uppercase font-league mb-2 tracking-tight">Production Only Maker</h4>
                        <p className="text-xs text-blue-300/80 mb-4 font-bold uppercase tracking-widest leading-relaxed">
                            This maker doesn't have a taproom yet. Join the scavenger hunt to find their brews in the wild!
                        </p>
                    </div>
                )}

                {/* Strategic Actions: Menu & Ordering */}
                <div className="flex flex-col gap-3">
                    {/* [NEW] Direct Menu / Taps Link */}
                    {venue.directMenuUrl && (
                        <div className="animate-in slide-in-from-bottom-4 duration-700">
                            <a
                                href={venue.directMenuUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                    const hasSips = userProfile.favoriteDrinks?.length || userProfile.favoriteDrink;
                                    if (!hasSips && onOpenSips) {
                                        e.preventDefault();
                                        onOpenSips();
                                    }
                                }}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl uppercase tracking-[0.25em] flex items-center justify-center gap-3 shadow-xl border border-white/5 transition-all active:scale-95"
                            >
                                <Utensils className="w-5 h-5 text-primary" />
                                <span>View Menu / Taps</span>
                            </a>
                        </div>
                    )}

                    {/* Online Ordering */}
                    {venue.orderUrl && (
                        <div className="animate-in slide-in-from-bottom-4 duration-700">
                            <a
                                href={venue.orderUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-5 rounded-2xl uppercase tracking-[0.25em] flex items-center justify-center gap-3 shadow-2xl shadow-orange-950/40 border border-orange-400/30 group transition-all active:scale-95"
                            >
                                <ShoppingBag className="w-6 h-6 group-hover:animate-bounce" />
                                <span>Order Online Now</span>
                            </a>
                            <p className="text-[9px] text-center text-slate-600 font-bold uppercase tracking-widest mt-2 italic flex items-center justify-center gap-1">
                                <Zap className="w-3 h-3" /> Powered by Toast & OlyBars
                            </p>
                        </div>
                    )}
                </div>

                {/* Intelligence Section */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] font-league italic">Intel & Buzz</h3>

                    {activeHappyHour && (
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-4 animate-in zoom-in-95 duration-300">
                            <div className="bg-primary p-2.5 h-fit rounded-xl">
                                <Beer className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 italic">Happy Hour Active</p>
                                <h4 className="text-md font-black text-white uppercase font-league leading-none mb-1">{activeHappyHour.specials || 'Happy Hour Specials'}</h4>
                                <p className="text-xs font-bold text-slate-300 leading-tight">{activeHappyHour.description}</p>
                                <p className="text-[9px] text-primary/60 font-black uppercase mt-2">Ends at {formatToAMPM(activeHappyHour.endTime)}</p>
                            </div>
                        </div>
                    )}


                    {venue.leagueEvent && (
                        <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-4 relative overflow-hidden group shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -translate-y-1/2 translate-x-1/2 rounded-full blur-3xl" />

                            <div className="flex gap-4 relative z-10">
                                <div className="bg-primary/20 p-3 h-fit rounded-xl border border-primary/20">
                                    <Calendar className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1 italic">League Integration</p>
                                    <h4 className="text-xl font-black text-white uppercase font-league tracking-wide leading-none mb-1">
                                        {venue.leagueEvent === 'trivia' ? 'Artesian Pub Quiz' : `${venue.leagueEvent} Tonight`}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        Starts at {formatToAMPM(venue.triviaTime) || '7:00 PM'} • Double League Points
                                    </p>
                                </div>
                            </div>

                            {venue.leagueEvent === 'trivia' && (venue.triviaHost || venue.triviaPrizes || venue.triviaSpecials) && (
                                <div className="grid grid-cols-1 gap-3 bg-black/40 rounded-xl p-4 border border-white/5 relative z-10">
                                    {venue.triviaHost && (
                                        <div className="flex items-center gap-3">
                                            <Users className="w-3.5 h-3.5 text-primary" />
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Hosted By: <span className="text-white">{venue.triviaHost}</span></span>
                                        </div>
                                    )}
                                    {venue.triviaPrizes && (
                                        <div className="flex items-center gap-3">
                                            <Trophy className="w-3.5 h-3.5 text-primary" />
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Prizes: <span className="text-white">{venue.triviaPrizes}</span></span>
                                        </div>
                                    )}
                                    {venue.triviaSpecials && (
                                        <div className="flex items-center gap-3">
                                            <Zap className="w-3.5 h-3.5 text-primary" />
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tonight's Special: <span className="text-primary">{venue.triviaSpecials}</span></span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {venue.triviaHowItWorks && venue.triviaHowItWorks.length > 0 && (
                                <div className="space-y-2 relative z-10">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">How it Works</p>
                                    <div className="flex flex-wrap gap-2">
                                        {venue.triviaHowItWorks.map((step, idx) => (
                                            <div key={idx} className="bg-white/5 px-2 py-1 rounded text-[9px] font-bold text-slate-400 border border-white/5">
                                                {idx + 1}. {step}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Happy Hour Full Schedule */}
                    {(venue.happyHourRules && venue.happyHourRules.length > 0) && (
                        <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-4 shadow-2xl">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] font-league italic">Happy Hour Rules</h3>
                            <div className="space-y-3">
                                {venue.happyHourRules.map((rule) => {
                                    const now = new Date();
                                    const currentDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                    const currentDayIdx = now.getDay();
                                    const currentDay = currentDayLabels[currentDayIdx];
                                    const isToday = rule.days.includes(currentDay);

                                    return (
                                        <div key={rule.id} className={`p-4 rounded-xl border transition-all ${isToday ? 'bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(251,191,36,0.05)]' : 'bg-black/20 border-white/5 opacity-60'}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex flex-wrap gap-1">
                                                    {rule.days.map(d => (
                                                        <span key={d} className={`text-[8px] font-black px-1.5 py-0.5 rounded ${isToday && d === currentDay ? 'bg-primary text-black' : 'bg-white/10 text-slate-400'}`}>
                                                            {d}
                                                        </span>
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-mono text-primary font-bold">{formatToAMPM(rule.startTime)} - {formatToAMPM(rule.endTime)}</span>
                                            </div>
                                            <h5 className="text-sm font-black text-white uppercase font-league tracking-wide">{rule.specials}</h5>
                                            <p className="text-[10px] text-slate-500 font-medium italic leading-tight">{rule.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* [PHASE 1] Live Menu & Taps */}
                    {(venue.fullMenu?.some(i => i.status === 'Live') || (venue.happyHourMenu && venue.happyHourMenu.length > 0)) && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] font-league italic">Live Menu & Taps</h3>
                                <span className="text-[9px] font-mono text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-500/30 flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    LIVE NOW
                                </span>
                            </div>

                            <div className="bg-slate-900 border border-primary/20 rounded-2xl overflow-hidden shadow-2xl relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                                <div className="divide-y divide-white/5 relative z-10">
                                    {/* Legacy Happy Hour Fallback (if no fullMenu) */}
                                    {(!venue.fullMenu || venue.fullMenu.length === 0) && venue.happyHourMenu?.map((item, idx) => (
                                        <div key={idx} className="p-4 flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-white text-sm uppercase">{item.name}</p>
                                                <p className="text-xs text-slate-500">{item.description}</p>
                                            </div>
                                            <span className="font-mono text-primary text-sm font-bold">{item.price}</span>
                                        </div>
                                    ))}

                                    {/* New Full Menu Rendering */}
                                    {venue.fullMenu?.filter(i => i.status === 'Live').map((item) => {
                                        const isHighAbv = item.stats?.abv && item.stats.abv > 8.0;
                                        const isInFlight = flightItems.find(f => f.id === item.id);

                                        return (
                                            <div key={item.id} className="p-4 flex justify-between gap-4 group hover:bg-white/5 transition-colors">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-black text-white text-sm uppercase font-league tracking-wide">{item.name}</p>
                                                        {isHighAbv && (
                                                            <div className="flex items-center gap-0.5 text-[8px] font-black text-red-500 border border-red-500/30 px-1 rounded bg-red-500/10">
                                                                <AlertTriangle size={8} /> HI-OCTANE
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{item.description}</p>
                                                    <div className="mt-2 flex gap-3 text-[10px] font-mono text-slate-500">
                                                        {item.type !== 'Food' && <span>{item.stats.abv || '?'}% ABV</span>}
                                                        {item.stats.ibu && <span>{item.stats.ibu} IBU</span>}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="font-mono text-white text-sm font-bold">{item.stats.price || '-'}</span>
                                                    {item.type !== 'Food' && (
                                                        <button
                                                            onClick={() => toggleFlightItem(item)}
                                                            className={`p-1.5 rounded-lg border transition-all ${isInFlight
                                                                ? 'bg-primary text-black border-primary'
                                                                : 'border-slate-700 text-slate-500 hover:border-primary hover:text-primary'
                                                                }`}
                                                        >
                                                            <Beer size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Weekly Rituals Section */}
                    {venue.weekly_schedule && Object.keys(venue.weekly_schedule).length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] font-league italic">Weekly Rituals</h3>
                            <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const).map((day) => {
                                    const activities = venue.weekly_schedule?.[day];
                                    if (!activities || activities.length === 0) return null;

                                    const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;

                                    return (
                                        <div key={day} className={`flex items-center justify-between p-4 border-b border-white/5 last:border-0 ${isToday ? 'bg-primary/10' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1 h-1 rounded-full ${isToday ? 'bg-primary animate-pulse' : 'bg-slate-700'}`} />
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-primary' : 'text-slate-500'}`}>
                                                    {day}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                {activities.map((act, i) => (
                                                    <span key={i} className="text-xs font-black text-white uppercase font-league tracking-wide">
                                                        {act}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Game & Activity Features */}
                    {venue.gameFeatures && venue.gameFeatures.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Gamepad2 className="w-3 h-3" />
                                Play & Features
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {venue.gameFeatures.map(feature => {
                                    // Icon Mapping Fallback
                                    const ASSET_MAP: Record<string, any> = {
                                        'pool_table': { icon: Target, label: 'Pool' },
                                        'darts': { icon: Target, label: 'Darts' },
                                        'shuffleboard': { icon: Disc, label: 'Shuffleboard' },
                                        'arcade_game': { icon: Gamepad2, label: 'Arcade' },
                                        'pinball_machine': { icon: Zap, label: 'Pinball' },
                                        'skeeball': { icon: Disc, label: 'Skee-ball' },
                                        'foosball': { icon: Trophy, label: 'Foosball' },
                                        'cornhole': { icon: Box, label: 'Cornhole' },
                                        'trivia': { icon: HelpCircle, label: 'Trivia' },
                                        'karaoke': { icon: Mic2, label: 'Karaoke' },
                                        'console_gaming': { icon: Gamepad2, label: 'Console' },
                                        'giant_jenga': { icon: Box, label: 'Giant Jenga' },
                                        'beer_pong': { icon: Beer, label: 'Beer Pong' }
                                    };
                                    const config = ASSET_MAP[feature.type] || { icon: LayoutGrid, label: feature.name };
                                    const Icon = config.icon;
                                    const isOutOfOrder = feature.status === 'out_of_order';

                                    return (
                                        <div key={feature.id} className={`border rounded-xl p-3 flex items-center gap-3 relative overflow-hidden ${isOutOfOrder ? 'bg-red-900/10 border-red-500/30' : 'bg-slate-900/40 border-white/5'
                                            }`}>
                                            <div className={`p-2 rounded-lg ${isOutOfOrder ? 'bg-red-500/10 text-red-400' : 'bg-black/40 text-primary'}`}>
                                                {isOutOfOrder ? <AlertTriangle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className={`text-[10px] font-black uppercase truncate ${isOutOfOrder ? 'text-red-400 line-through' : 'text-white'}`}>
                                                    {feature.count > 1 ? `${feature.count} ` : ''}{feature.name}
                                                </p>
                                                {isOutOfOrder ? (
                                                    <span className="text-[8px] font-black text-red-500 uppercase tracking-widest bg-red-950/50 px-1.5 py-0.5 rounded">
                                                        Out of Order
                                                    </span>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircle2 className="w-2.5 h-2.5 text-primary" />
                                                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                                                            Active
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}


                </div>

                {/* "Where to find us" / Scavenger Hunt */}
                {venue.isLocalMaker && (
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] font-league italic">
                            {venue.physicalRoom === false ? 'Scavenger Hunt: Find the Brew' : 'Where to Find Us'}
                        </h3>
                        <div className="bg-surface border border-white/5 rounded-2xl p-5 space-y-3">
                            <p className="text-xs text-slate-400 mb-2">
                                {venue.physicalRoom === false
                                    ? `Scan a Vibe Spot at these partner bars to unlock the '${venue.scavengerHunts?.[0]?.badgeId || 'Maker'}' badge!`
                                    : "Our products are proudly poured at:"}
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                                {venues.filter(v => v.carryingMakers?.includes(venue.id) || venue.scavengerHunts?.[0]?.partnerVenues.includes(v.id)).map(carrier => (
                                    <div key={carrier.id} onClick={() => navigate(`/bars/${carrier.id}`)} className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-white/5 cursor-pointer hover:bg-white/5 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <Beer className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
                                            <span className="font-bold text-sm text-white">{carrier.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {venue.physicalRoom === false && <Sparkles className="w-3 h-3 text-primary animate-pulse" />}
                                            <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-white" />
                                        </div>
                                    </div>
                                ))}
                                {venues.filter(v => v.carryingMakers?.includes(venue.id) || venue.scavengerHunts?.[0]?.partnerVenues.includes(v.id)).length === 0 && (
                                    <p className="text-[10px] text-slate-600 font-bold uppercase py-2">Distribution list updating...</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Gallery */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] font-league italic">Vibe Gallery</h3>
                    <div className="bg-surface border border-white/5 rounded-2xl p-2 min-h-[150px]">
                        <VenueGallery photos={venue.photos} />
                    </div>
                </div>

                {/* Policies & Access Detail [NEW] */}
                {(venue.reservations || venue.hasPrivateRoom || (venue.privateSpaces && venue.privateSpaces.length > 0) || venue.openingTime) && (
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] font-league italic">Policies & Reservations</h3>
                        <div className="bg-surface border border-white/5 rounded-2xl p-4 space-y-4">
                            {venue.openingTime && (
                                <div className="flex items-center gap-3">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Opens At</span>
                                        <p className="text-xs font-bold text-white uppercase">{venue.openingTime}</p>
                                    </div>
                                </div>
                            )}
                            {venue.reservations && (
                                <div className="flex items-center gap-3">
                                    <Info className="w-4 h-4 text-primary" />
                                    <div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Reservations</span>
                                        <p className="text-xs font-bold text-white uppercase">{venue.reservations}</p>
                                        {venue.reservationUrl && (
                                            <a
                                                href={venue.reservationUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 inline-flex items-center gap-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all"
                                            >
                                                <ExternalLink size={10} />
                                                Book a Table
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                            {(venue.hasPrivateRoom || (venue.privateSpaces && venue.privateSpaces.length > 0)) && (
                                <div className="flex items-center gap-3">
                                    <Key className="w-4 h-4 text-primary" />
                                    <div className="flex-1">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">The Back Room</span>
                                        <p className="text-xs font-bold text-white uppercase">
                                            {venue.privateSpaces?.length
                                                ? `${venue.privateSpaces.length} Private Space${venue.privateSpaces.length > 1 ? 's' : ''} Available`
                                                : 'Private Space Available'}
                                        </p>
                                        {venue.privateSpaces?.length ? (
                                            <button
                                                onClick={() => navigate(`/back-room?venueId=${venue.id}`)}
                                                className="mt-2 inline-flex items-center gap-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all"
                                            >
                                                <ExternalLink size={10} />
                                                View Spaces
                                            </button>
                                        ) : (
                                            <p className="text-[9px] text-slate-400 italic mt-1">Direct booking available at venue</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Location Info / Conditional Navigation */}
                {venue.physicalRoom !== false && (
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] font-league italic">Navigation</h3>
                        <div className="bg-surface border border-white/5 rounded-2xl p-4 flex justify-between items-center transition-all hover:border-primary/30 cursor-pointer"
                            onClick={() => venue.address && window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`, '_blank')}>
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-800 p-2.5 rounded-xl">
                                    <Navigation className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Address</span>
                                    <p className="text-sm font-bold text-white uppercase tracking-tight">{venue.address || 'Olympia, WA'}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-700" />
                        </div>
                    </div>
                )}

                {/* [NEW] Owner Claim Section */}
                {(!venue.ownerId || isSystemAdmin(userProfile) || !userProfile || userProfile.uid === 'guest') && (
                    <div className="pt-16 mt-16 border-t border-white/5 pb-16 sticky-claim-trigger">
                        <div className="bg-gradient-to-br from-primary/10 to-black border border-primary/30 p-8 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-all duration-1000" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-primary text-black rounded-lg">
                                        <Crown className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase font-league tracking-wide">Own this Venue?</h3>
                                        <p className="text-xs text-primary font-bold uppercase tracking-widest">Official Partner Program</p>
                                    </div>
                                </div>

                                <p className="text-slate-300 mb-6 max-w-xl leading-relaxed">
                                    Claim your official listing to manage your "Vibe," access real-time analytics, and launch Flash Bounties to drive traffic instantly.
                                </p>

                                <button
                                    onClick={() => {
                                        let url = '/partners/claim';
                                        const params = new URLSearchParams();
                                        if (venue.id) params.append('venueId', venue.id);
                                        if (venue.googlePlaceId) params.append('placeId', venue.googlePlaceId);
                                        params.append('name', venue.name);
                                        if (venue.address) params.append('address', venue.address);
                                        if (params.toString()) url += `?${params.toString()}`;
                                        navigate(url, { state: { prefilledVenue: venue } });
                                    }}
                                    className="bg-primary text-black font-black uppercase tracking-widest py-3 px-8 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(251,191,36,0.3)] flex items-center gap-2"
                                >
                                    <Crown className="w-4 h-4" />
                                    Claim Your Listing
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* [PHASE 1] Flight Builder Dock & Modal */}
            {flightItems.length > 0 && (
                <>
                    {/* Fixed Dock */}
                    <div className="fixed bottom-24 left-4 right-4 z-40 animate-in slide-in-from-bottom duration-300 md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md">
                        <div className="bg-slate-900/90 backdrop-blur-md border border-primary/30 p-4 rounded-2xl shadow-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary text-black font-black w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-primary/20">
                                    {flightItems.length}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Building Flight</span>
                                        <button onClick={(e) => { e.stopPropagation(); navigate('/flight-school'); }} className="text-primary hover:text-white transition-colors">
                                            <HelpCircle size={10} />
                                        </button>
                                    </div>
                                    <span className="text-xs font-bold text-white uppercase">{4 - flightItems.length} slots remaining</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsFlightModalOpen(true)}
                                className="bg-primary text-black px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-yellow-400 transition-colors shadow-lg shadow-primary/10"
                            >
                                View Stats
                            </button>
                        </div>
                    </div>

                    {/* Flight Modal */}
                    {isFlightModalOpen && (
                        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                            <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-3xl overflow-hidden relative shadow-2xl">
                                <button
                                    onClick={() => setIsFlightModalOpen(false)}
                                    className="absolute top-4 right-4 text-slate-500 hover:text-white"
                                >
                                    <X size={24} />
                                </button>

                                <div className="p-8 text-center bg-slate-800/50">
                                    <Trophy className="w-12 h-12 text-primary mx-auto mb-4" />
                                    <h3 className="text-2xl font-black text-white uppercase font-league tracking-tighter mb-1">Your Flight Deck</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Calculated Experience</p>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg ABV</p>
                                            <p className={`text-3xl font-black font-league ${parseFloat(flightStats.abv as string) > 8.0 ? 'text-red-500' : 'text-white'}`}>
                                                {flightStats.abv}%
                                            </p>
                                        </div>
                                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Est. Cost</p>
                                            <p className="text-3xl font-black text-white font-league">$$</p>
                                        </div>
                                    </div>

                                    {/* Warnings */}
                                    {parseFloat(flightStats.abv as string) > 8.0 && (
                                        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                            <div>
                                                <p className="text-xs font-black text-red-400 uppercase tracking-wide mb-1">High Gravity Alert</p>
                                                <p className="text-[10px] text-red-300 leading-relaxed">
                                                    This flight packs a punch. Please drink responsibly and arrange a safe ride home.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Items List */}
                                    <div className="space-y-2">
                                        {flightItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                                <span className="text-xs font-bold text-white">{item.name}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-mono text-slate-400">{item.stats.abv}%</span>
                                                    <button onClick={() => toggleFlightItem(item)} className="text-slate-600 hover:text-red-500">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Actions */}
                                    <button
                                        onClick={() => {
                                            if (!userProfile) {
                                                showToast("Please log in to save your flight!", "error");

                                                // Ideally, trigger login modal here if available
                                                return;
                                            }
                                            // TODO: Actual save logic to Firestore users/{uid}/flights
                                            showToast("Flight Saved to Profile! (Coming Soon: View Flights)", "success");
                                            setIsFlightModalOpen(false);
                                            setFlightItems([]);
                                        }}
                                        className="w-full bg-primary text-black font-black py-4 rounded-xl uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
                                    >
                                        Confirm Selection
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Distance Warning Modal */}
            {venue && venue.location && (
                <ArtieDistanceWarningModal
                    isOpen={isWarningOpen}
                    onClose={() => setIsWarningOpen(false)}
                    distanceMiles={distanceInfo.miles}
                    walkTimeMins={distanceInfo.mins}
                    destinationName={venue.name}
                    destinationAddress={venue.address || ''}
                    destinationCoords={{ lat: venue.location.lat, lng: venue.location.lng }}
                    userZone={zones.user}
                    destinationZone={zones.destination}
                />
            )}

            {/* Gatekeeper Modal for Private Clubs */}
            <GatekeeperModal
                isOpen={isGatekeeperOpen}
                onClose={() => setIsGatekeeperOpen(false)}
                onAcknowledge={() => {
                    setIsMembershipVerified(true);
                    setIsGatekeeperOpen(false);
                }}
                venue={venue}
            />
        </div>
    );
};

export default VenueProfileScreen;

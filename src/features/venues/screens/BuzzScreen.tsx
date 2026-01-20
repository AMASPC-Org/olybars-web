import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, Link, useSearchParams, useOutletContext } from 'react-router-dom';
import { GlobalSearch } from '../../../components/features/search/GlobalSearch';
import { StickyHeader } from '../../../components/layout/StickyHeader';
import { DateContextSelector } from '../../../components/features/search/DateContextSelector';
import {
  Flame, Beer, Star, Users, MapPin,
  Trophy, ChevronRight, Crown, Search, Filter,
  Bot, Clock, Zap, Gamepad2, ShieldCheck, List, Map as MapIcon, Sparkles
} from 'lucide-react';
import { Venue, VenueStatus, UserProfile, ClockInRecord, VibeCheckRecord } from '../../../types';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { calculateDistance, metersToMiles } from '../../../utils/geoUtils';
import { isVenueOpen, getVenueStatus, getEffectiveRules, timeToMinutes } from '../../../utils/venueUtils';
import { PULSE_CONFIG } from '../../../config/pulse';
import { TAXONOMY_PLAY, TAXONOMY_FEATURES, TAXONOMY_EVENTS } from '../../../data/taxonomy';
import { isSameDay, format } from 'date-fns';
import { useDiscovery } from '../contexts/DiscoveryContext';
import { VenueMap } from '../components/VenueMap';
import { SEO } from '../../../components/common/SEO';

const SkeletonCard = () => (
  <div className="bg-surface rounded-xl border border-slate-800 p-4 shadow-lg animate-pulse">
    <div className="flex justify-between items-start mb-3">
      <div className="space-y-2">
        <div className="h-6 w-48 bg-slate-800 rounded"></div>
        <div className="h-3 w-32 bg-slate-800 rounded"></div>
      </div>
      <div className="h-6 w-20 bg-slate-800 rounded-full"></div>
    </div>
    <div className="h-10 w-full bg-slate-800 rounded mb-4"></div>
    <div className="flex gap-2">
      <div className="h-10 flex-1 bg-slate-800 rounded"></div>
      <div className="h-10 flex-1 bg-slate-800 rounded"></div>
    </div>
  </div>
);

const PulseMeter = ({ status }: { status: VenueStatus }) => {
  if (status === 'dead' || status === 'mellow') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/30 text-slate-400 text-xs font-bold border border-slate-800">
        <Clock className="w-3 h-3" /> Mellow
      </span>
    );
  }

  if (status === 'chill') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/30 text-blue-200 text-xs font-bold border border-blue-800">
        <Beer className="w-3 h-3" /> Chill
      </span>
    );
  }


  if (status === 'buzzing') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-900/30 text-red-200 text-xs font-bold border border-red-800 animate-pulse">
        <Flame className="w-3 h-3" /> Buzzing
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-900/30 text-pink-200 text-xs font-bold border border-pink-800 animate-pulse">
      <Zap className="w-3 h-3" /> Packed
    </span>
  );
};

type FilterKind = 'status' | 'scene' | 'play' | 'makers' | 'features' | 'events' | 'all';

const STATUS_ORDER: Record<VenueStatus, number> = {
  packed: 0,
  buzzing: 1,
  chill: 2,
  mellow: 3,
  dead: 4,
};

const EventCard = ({ event, onClick }: { event: any, onClick: () => void }) => {
  return (
    <div
      onClick={onClick}
      className="p-4 rounded-2xl bg-surface/50 border border-white/5 hover:bg-surface transition-all cursor-pointer group flex gap-4 animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-900 border border-white/5 flex flex-col items-center justify-center p-2 text-center">
        <Clock className="w-8 h-8 text-primary/40 mb-1" />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter leading-none">
          {event.startTime || (event.type === 'Weekly' ? 'ALL DAY' : 'TONIGHT')}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-black uppercase font-league leading-tight truncate group-hover:text-primary transition-colors text-white">
            {event.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest italic truncate">{event.venue.name}</span>
          <span className="text-slate-700">•</span>
          <span className="text-[10px] font-black text-slate-500 uppercase">{event.type || 'Special Event'}</span>
        </div>

        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {event.description || `Join us at ${event.venue.name} for ${event.title}!`}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MapPin size={10} className="text-slate-600" />
            <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[150px]">{event.venue.address || 'Olympia, WA'}</span>
          </div>
          <ChevronRight size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-1" />
        </div>
      </div>
    </div>
  );
};

// Main Screen
export const BuzzScreen: React.FC = () => {

  const {
    venues,
    userProfile,
    onToggleMenu,
    onClockIn: handleClockIn,
    clockedInVenue,
    isLoading,
    onToggleWeeklyBuzz,
    clockInHistory = [],
    vibeCheckHistory = []
  } = useOutletContext<{
    venues: Venue[];
    userProfile: UserProfile;
    onToggleMenu: () => void;
    onClockIn: (v: Venue) => void;
    clockedInVenue?: string | null;
    onVibeCheck: (v: Venue, hasConsent?: boolean, photoUrl?: string) => void;
    isLoading?: boolean;
    onToggleWeeklyBuzz?: () => void;
    clockInHistory?: ClockInRecord[];
    vibeCheckHistory?: VibeCheckRecord[];
  }>();

  const userPoints = userProfile.stats?.seasonPoints || 0;
  const isGuest = userProfile.role === 'guest';
  const navigate = useNavigate();
  const {
    searchQuery,
    filterKind, setFilterKind,
    statusFilter, setStatusFilter,
    sceneFilter, setSceneFilter,
    playFilter, setPlayFilter,
    featureFilter, setFeatureFilter,
    eventFilter, setEventFilter,
    selectedDate, setSelectedDate,
    viewMode, setViewMode,
    isToday, clearAllFilters,
    mapRegion, // Get mapRegion here
    searchParams
  } = useDiscovery();

  const isNextStopMode = searchParams.get('mode') === 'next-stop';
  const [showPulseMenu, setShowPulseMenu] = useState(false);
  const [showSceneMenu, setShowSceneMenu] = useState(false);
  const [showPlayMenu, setShowPlayMenu] = useState(false);
  const [showFeatureMenu, setShowFeatureMenu] = useState(false);
  const [showEventMenu, setShowEventMenu] = useState(false);
  const [showMakersMenu, setShowMakersMenu] = useState(false);

  const { coords, requestLocation } = useGeolocation({ shouldPrompt: true });

  // Auto-request location on mount
  React.useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Rotation Logic (shifts every 5 minutes) ensures global fairness
  const rotationOffset = React.useMemo(() => {
    const rotationInterval = 5 * 60 * 1000;
    return Math.floor(Date.now() / rotationInterval);
  }, []);
  const applyFilter = useCallback((v: Venue): boolean => {
    // Region Filter (Mental Model: "Near: [Region]")
    if (mapRegion !== 'all') {
      const regionMap: Record<string, string> = {
        'downtown': 'Downtown_Walkable',
        'tumwater': 'Warehouse_Tumwater',
        'lacey': 'Destination_Quest', // Simplification for MVP
        'yelm': 'Destination_Quest'
      };

      const targetLoop = regionMap[mapRegion];
      if (targetLoop && v.geoLoop !== targetLoop) {
        // If it's a search, we might ignore region, but for default list we enforce it
        if (!searchQuery) return false;
      }
    }

    // Search Filter ("God Mode")
    if (searchQuery) {
      const q = searchQuery.toLowerCase();

      // 1. Name & Nicknames
      const nameMatch = v.name.toLowerCase().includes(q) || (v.nicknames?.some(n => n.toLowerCase().includes(q)) ?? false);

      // 2. Events (Weekly, Special, League)
      const eventTypeMatch = v.leagueEvent?.toLowerCase().includes(q) || (v.special_events?.some(e => e.type.toLowerCase().includes(q) || e.title.toLowerCase().includes(q)) ?? false);
      const scheduleMatch = v.weekly_schedule && Object.values(v.weekly_schedule).flat().some(ev => (ev as string).toLowerCase().includes(q));
      const eventMatch = eventTypeMatch || scheduleMatch;

      // 3. Games & Amenities
      const gameMatch = v.gameFeatures?.some(f => (f.name?.toLowerCase() || f.type?.toLowerCase() || '').includes(q)) ?? false;
      const amenityMatch = v.amenities?.some(a => a.toLowerCase().includes(q)) ?? false;
      const playMatch = gameMatch || amenityMatch;

      // 4. Features & Vibes (Scene)
      const featureMatch = (v.vibe?.toLowerCase().includes(q) ?? false) ||
        (v.sceneTags?.some(tag => tag.replace('_', ' ').toLowerCase().includes(q)) ?? false) ||
        (v.isAllAges && 'all ages'.includes(q)) ||
        (v.isDogFriendly && 'dog friendly'.includes(q)) ||
        (v.hasOutdoorSeating && 'patio'.includes(q)) ||
        ((v.privateSpaces && v.privateSpaces.length > 0) && (q.includes('private') || q.includes('room') || q.includes('back room')));

      const isMatch = nameMatch || eventMatch || playMatch || featureMatch;

      if (!isMatch) return false;
      return true;
    }

    // Date Context Filter
    if (!isToday) {
      const dayName = format(selectedDate, 'eeee').toLowerCase();
      const hasEvents = (v.weekly_schedule?.[dayName]?.length ?? 0) > 0 ||
        (v.special_events?.some(e => isSameDay(new Date(e.date), selectedDate)) ?? false);

      // Check if open on that day
      const isOpenOnDay = v.hours && typeof v.hours === 'object' && (v.hours as any)[dayName];

      if (!isOpenOnDay && !hasEvents) return false;
    }

    if (filterKind === 'all') return true;

    if (filterKind === 'status') {
      if (statusFilter === 'all') return true;
      return v.status === statusFilter;
    }

    if (filterKind === 'deals') {
      // 1. Flash Bounty (Always Active)
      const hasActiveBounty = v.activeFlashBounty?.isActive && (v.activeFlashBounty.endTime || 0) > Date.now();
      if (hasActiveBounty) return true;

      // 2. Explicit Deal Tag
      if (v.deal) return true;

      // 3. Active OR Upcoming Happy Hour (Strictly Matches Buzz Clock Logic)
      const now = new Date();
      const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const rules = getEffectiveRules(v);
      const hasRelevantRule = rules.some(r => {
        if (r.days && r.days.length > 0 && !r.days.includes(currentDay)) return false;
        const start = timeToMinutes(r.startTime);
        const end = timeToMinutes(r.endTime);

        // Match Active OR Upcoming (start > current)
        return (currentMinutes >= start && currentMinutes < end) || (start > currentMinutes);
      });

      if (hasRelevantRule) return true;

      return false;
    }

    if (filterKind === 'scene' && sceneFilter !== 'all') {
      const q = sceneFilter.toLowerCase();
      return (v.venueType || '').toLowerCase().includes(q) ||
        (v.sceneTags?.some(tag => tag.toLowerCase().includes(q)) ?? false) ||
        (v.vibe?.toLowerCase().includes(q) ?? false);
    }

    if (filterKind === 'play' && playFilter !== 'all') {
      const q = playFilter.toLowerCase();
      return (v.gameFeatures?.some(f => f.type.toLowerCase().includes(q) || (f.name || '').toLowerCase().includes(q)) ?? false) ||
        (v.amenities?.some(a => a.toLowerCase().includes(q)) ?? false);
    }

    if (filterKind === 'makers') {
      return v.isLocalMaker === true;
    }

    if (filterKind === 'features' && featureFilter !== 'all') {
      const q = featureFilter.toLowerCase();
      if (q === 'all_ages') return v.isAllAges === true || v.attributes?.minors_allowed === true;
      if (q === 'dog_friendly') return v.isDogFriendly === true;
      if (q === 'patio') return v.hasOutdoorSeating === true || (v.amenities?.some(a => a.toLowerCase().includes('patio')) ?? false);
      return v.amenities?.some(a => a.toLowerCase().includes(q)) ?? false;
    }

    if (filterKind === 'events') {
      if (eventFilter === 'all') {
        const hasWeekly = v.weekly_schedule && Object.keys(v.weekly_schedule).length > 0;
        const hasSpecial = (v.special_events?.length ?? 0) > 0;
        const hasLeague = !!v.leagueEvent;
        return !!(hasWeekly || hasSpecial || hasLeague);
      }

      const q = eventFilter.toLowerCase();
      const eventMatch = v.special_events?.some(e => e.type.toLowerCase().includes(q) || e.title.toLowerCase().includes(q)) ?? false;
      const leagueMatch = v.leagueEvent?.toLowerCase().includes(q) ?? false;
      const scheduleMatch = v.weekly_schedule && Object.values(v.weekly_schedule).flat().some(ev => (ev as string).toLowerCase().includes(q));

      if (eventFilter === 'other') {
        const hasAnyEvent = (v.special_events?.length ?? 0) > 0 ||
          (v.weekly_schedule && Object.keys(v.weekly_schedule).length > 0) ||
          !!v.leagueEvent;

        const isMainEvent = TAXONOMY_EVENTS.some(main =>
          v.leagueEvent?.toLowerCase().includes(main.toLowerCase()) ||
          v.special_events?.some(e => e.title.toLowerCase().includes(main.toLowerCase()) || e.type.toLowerCase().includes(main.toLowerCase())) ||
          (v.weekly_schedule && Object.values(v.weekly_schedule).flat().some(ev => (ev as string).toLowerCase().includes(main.toLowerCase())))
        );
        return hasAnyEvent && !isMainEvent;
      }

      return !!(eventMatch || leagueMatch || scheduleMatch);
    }

    // Global Visibility Check
    if (v.tier_config?.is_directory_listed === false || v.isActive === false) return false;

    // NEXT STOP EXCLUSION LOGIC
    if (isNextStopMode) {
      // 1. Hide current clocked in venue
      if (clockedInVenue === v.id) return false;

      // 2. Hide venues visited/vibe-checked in the compliance window
      const windowMs = (PULSE_CONFIG.WINDOWS.LCB_WINDOW || 12) * 60 * 60 * 1000;
      const twelveHoursAgo = Date.now() - windowMs;

      const wasClockedInRecently = clockInHistory.some(h => h.venueId === v.id && h.timestamp > twelveHoursAgo);
      const wasVibeCheckedRecently = vibeCheckHistory.some(h => h.venueId === v.id && h.timestamp > twelveHoursAgo);

      if (wasClockedInRecently || wasVibeCheckedRecently) return false;
    }

    // Home Pulse Specific: Hide closed bars unless part of the league or has flash bounty (List view only)
    const open = isVenueOpen(v);
    const hasActiveBounty = !!(v.activeFlashBounty?.isActive && (v.activeFlashBounty.endTime || 0) > Date.now());
    if (viewMode !== 'map' && !open && !v.isPaidLeagueMember && !hasActiveBounty) return false;

    return true;
  }, [searchQuery, filterKind, statusFilter, sceneFilter, playFilter, featureFilter, eventFilter, selectedDate, mapRegion, isNextStopMode, clockedInVenue, clockInHistory]);

  const venuesWithDistance = React.useMemo(() => venues.map(v => ({
    ...v,
    isOpen: isVenueOpen(v, selectedDate),
    hourStatus: getVenueStatus(v, selectedDate),
    distance: coords && v.location ? metersToMiles(calculateDistance(coords.latitude, coords.longitude, v.location.lat, v.location.lng)) : null
  })), [venues, coords, selectedDate]);

  const filteredVenues = React.useMemo(() => [...venuesWithDistance]
    .filter(applyFilter)
    .sort((a, b) => {
      // 0. Distance-based Auto-sort (If known and within 15 miles)
      if (!searchQuery && coords && a.distance !== null && b.distance !== null) {
        const within15Miles = a.distance <= 15 || b.distance <= 15;
        if (within15Miles) {
          if (a.distance !== b.distance) {
            return (a.distance || 0) - (b.distance || 0);
          }
        }
      }

      // 0. Deals Sort (Syncs with Buzz Clock)
      if (filterKind === 'deals') {
        const now = new Date();
        const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const getSortMetric = (v: Venue) => {
          // Priority 1: Flash Bounty (Active) - Score: -3000
          if (v.activeFlashBounty?.isActive && (v.activeFlashBounty.endTime || 0) > Date.now()) {
            return -3000;
          }

          const rules = getEffectiveRules(v);

          // Priority 2: Active Happy Hour (Ending Soonest)
          // Score: Minutes until end (0 to 1440)
          const activeRule = rules.find(r => {
            if (r.days && r.days.length > 0 && !r.days.includes(currentDay)) return false;
            const start = timeToMinutes(r.startTime);
            const end = timeToMinutes(r.endTime);
            return currentMinutes >= start && currentMinutes < end;
          });

          if (activeRule) {
            const end = timeToMinutes(activeRule.endTime);
            return end - currentMinutes; // 10 mins left < 60 mins left
          }

          // Priority 3: Upcoming Happy Hour (Starting Soonest)
          // Score: 5000 + Minutes until start
          const upcomingRule = rules
            .filter(r => {
              if (r.days && r.days.length > 0 && !r.days.includes(currentDay)) return false;
              return timeToMinutes(r.startTime) > currentMinutes;
            })
            .sort((r1, r2) => timeToMinutes(r1.startTime) - timeToMinutes(r2.startTime))[0];

          if (upcomingRule) {
            const start = timeToMinutes(upcomingRule.startTime);
            return 5000 + (start - currentMinutes);
          }

          // Fallback
          return 10000;
        };

        const scoreA = getSortMetric(a);
        const scoreB = getSortMetric(b);
        return scoreA - scoreB;
      }

      if (filterKind === 'events') {
        const getEventScore = (v: Venue) => {
          const dayName = format(selectedDate, 'eeee').toLowerCase();

          // Check special events
          const specialHours = v.special_events
            ?.filter(e => isSameDay(new Date(e.date), selectedDate))
            .map(e => {
              const [h, m] = e.startTime.split(':').map(Number);
              return h * 60 + m;
            }) || [];

          // Check weekly schedule
          const hasWeekly = v.weekly_schedule?.[dayName]?.length;
          // Weekly schedule items are usually just strings like "Trivia @ 7PM".
          // Extracting time from strings is messy, so let's assume special_events is the source of truth for "Time" ordering.
          // Or if it's weekly, just put it at 1000 mins if we can't parse it.
          const weeklyScore = hasWeekly ? 1000 : 2000;

          const minSpecial = specialHours.length > 0 ? Math.min(...specialHours) : 2000;
          return Math.min(minSpecial, weeklyScore);
        };

        return getEventScore(a) - getEventScore(b);
      }

      // 1. Bounty Pinned
      const aBounty = !!(a.activeFlashBounty && a.activeFlashBounty.isActive);
      const bBounty = !!(b.activeFlashBounty && b.activeFlashBounty.isActive);
      if (aBounty !== bBounty) return aBounty ? -1 : 1;

      // 2. Partner Priority (League Members) with Rotating Order
      const isAPartner = !!a.isPaidLeagueMember;
      const isBPartner = !!b.isPaidLeagueMember;

      if (isAPartner !== isBPartner) return isAPartner ? -1 : 1;

      if (isAPartner && isBPartner) {
        const aHash = a.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const bHash = b.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return ((aHash + rotationOffset) % 100) - ((bHash + rotationOffset) % 100);
      }

      // 3. Open Status (Open > Last Call > Closed)
      if (a.hourStatus === 'open' && b.hourStatus !== 'open') return -1;
      if (a.hourStatus !== 'open' && b.hourStatus === 'open') return 1;
      if (a.hourStatus === 'last_call' && b.hourStatus === 'closed') return -1;
      if (a.hourStatus === 'closed' && b.hourStatus === 'last_call') return 1;

      // Next Stop Sort: Bounty > Loaded > Distance
      if (isNextStopMode) {
        if (aBounty !== bBounty) return aBounty ? -1 : 1;
        const statusOrder: Record<string, number> = { packed: 0, buzzing: 1, chill: 2, mellow: 3 };
        const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
        if (statusDiff !== 0) return statusDiff;
      }

      return (STATUS_ORDER[a.status] || 99) - (STATUS_ORDER[b.status] || 99);
    }), [venuesWithDistance, filterKind, statusFilter, sceneFilter, playFilter, featureFilter, eventFilter, applyFilter, rotationOffset, searchQuery, isNextStopMode]);

  const flashBountyVenues = venues.filter(v => {
    const hasFlatDeal = !!v.deal && (v.dealEndsIn || 0) > 0;
    const hasStructuredDeal = v.activeFlashBounty?.isActive && (v.activeFlashBounty.endTime || 0) > Date.now();
    return hasFlatDeal || hasStructuredDeal;
  });

  const isFallbackActive = filteredVenues.length === 0 && venuesWithDistance.length > 0;

  const displayVenues = isFallbackActive
    ? [...venuesWithDistance]
      .filter(v => v.tier_config?.is_directory_listed !== false && v.isActive !== false)
      .sort((a, b) => {
        if (a.isPaidLeagueMember && !b.isPaidLeagueMember) return -1;
        if (!a.isPaidLeagueMember && b.isPaidLeagueMember) return 1;
        return 0;
      }).map((v, i, arr) => {
        const shiftedIndex = (i + (rotationOffset % (arr.length || 1))) % (arr.length || 1);
        return arr[shiftedIndex];
      })
    : filteredVenues;

  const displayItems = useMemo(() => {
    if (filterKind !== 'events') return displayVenues;

    const dayName = format(selectedDate, 'eeee').toLowerCase();

    return displayVenues.flatMap(v => {
      const items: any[] = [];

      // 1. Special Events
      v.special_events?.filter(e => isSameDay(new Date(e.date), selectedDate)).forEach(e => {
        // If eventFilter is set, check if e.type or e.title matches
        const matchesEventFilter = eventFilter === 'all' ||
          e.type.toLowerCase().includes(eventFilter.toLowerCase()) ||
          e.title.toLowerCase().includes(eventFilter.toLowerCase());

        if (matchesEventFilter || eventFilter === 'other') {
          items.push({ ...e, isEvent: true, venue: v });
        }
      });

      // 2. Weekly Schedule
      const weekly = v.weekly_schedule?.[dayName] || [];
      weekly.forEach(title => {
        const matchesEventFilter = eventFilter === 'all' || title.toLowerCase().includes(eventFilter.toLowerCase());
        if (matchesEventFilter || eventFilter === 'other') {
          items.push({ title, isEvent: true, venue: v, type: 'Weekly Event' });
        }
      });

      // 3. League Event
      if (v.leagueEvent) {
        const matchesEventFilter = eventFilter === 'all' || v.leagueEvent.toLowerCase().includes(eventFilter.toLowerCase());
        if (matchesEventFilter || eventFilter === 'other') {
          items.push({ title: v.leagueEvent, isEvent: true, venue: v, type: 'League Event' });
        }
      }

      return items;
    }).sort((a, b) => {
      const timeA = a.startTime || '20:00';
      const timeB = b.startTime || '20:00';
      return timeA.localeCompare(timeB);
    });
  }, [displayVenues, filterKind, selectedDate, eventFilter]);

  const statusActive = filterKind === 'status' || filterKind === 'all';
  const sceneActive = filterKind === 'scene';
  const playActive = filterKind === 'play';
  const featuresActive = filterKind === 'features';
  const eventsActive = filterKind === 'events';

  const baseChipClasses = 'px-3 py-1.5 text-xs font-bold rounded-full border transition-all whitespace-nowrap';


  return (
    <div className="bg-background min-h-screen pb-24 font-sans text-slate-100">
      <SEO
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "OlyBars",
          "url": "https://olybars.com",
          "logo": "https://olybars.com/og-image.png",
          "description": "The Nightlife Operating System for Thurston County, WA.",
          "sameAs": ["https://instagram.com/olybars"]
        }}
      />

      {/* Structural SEO: H1 accessibility */}
      <h1 className="sr-only">OlyBars Pulse: Real-Time Thurston County Nightlife Vibe Map</h1>

      <div className="space-y-6">
        <div className="relative group/list px-4">
          {isNextStopMode && (
            <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
              <div className="bg-gradient-to-br from-primary/20 via-background to-background border-2 border-primary/30 p-6 rounded-3xl relative overflow-hidden shadow-[0_0_30px_rgba(251,191,36,0.1)]">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Artesian Flight Plan</span>
                  </div>
                  <h2 className="text-3xl font-black text-white font-league uppercase italic leading-tight mb-2">
                    Your Next <span className="text-primary text-4xl">Stop</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed max-w-[280px]">
                    We've filtered {clockedInVenue ? 'your current spot and ' : ''}recent stops to keep your run moving.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isLoading && isGuest && !searchQuery && !isNextStopMode && (
            <div className="mb-6 px-1">
              <button
                onClick={() => navigate('/league')}
                className="w-full bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 p-4 rounded-xl flex items-center justify-between group/cta hover:from-primary/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary p-2 rounded-lg text-black">
                    <Crown size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">League Member?</p>
                    <p className="text-xs font-bold text-white">Join the Artesian Bar League</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-primary group-hover/cta:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* List/Map View Content */}
          {viewMode === 'map' ? (
            <div className="h-[60vh] rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
              <VenueMap
                venues={filteredVenues}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {isLoading ? (
                [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
              ) : displayItems.length > 0 ? (
                displayItems.map((item) => {
                  if (item.isEvent) {
                    return (
                      <EventCard
                        key={`${item.venue.id}-${item.id || item.title}`}
                        event={item}
                        onClick={() => navigate(`/bars/${item.venue.id}`)}
                      />
                    );
                  }

                  const venue = item;
                  const hasActiveBounty = !!(venue.activeFlashBounty && venue.activeFlashBounty.isActive);
                  const bountyTitle = venue.activeFlashBounty?.title || venue.deal;

                  return (
                    <div
                      key={venue.id}
                      onClick={() => navigate(`/bars/${venue.id}`)}
                      className={`p-4 rounded-2xl flex gap-4 transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-4 duration-500 border ${hasActiveBounty
                        ? 'bg-red-950/20 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:bg-red-950/30'
                        : 'bg-surface/50 border-white/5 hover:bg-surface'
                        }`}
                    >
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={venue.photos?.[0]?.url || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=100&auto=format&fit=crop'}
                          alt={venue.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-1 right-1">
                          <PulseMeter status={venue.status} />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className={`text-lg font-black uppercase font-league leading-tight truncate transition-colors ${hasActiveBounty ? 'text-white' : 'group-hover:text-primary'
                            }`}>
                            {venue.name}
                          </h3>
                          {venue.distance && (
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{venue.distance}mi</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest italic truncate">{venue.vibe}</span>
                          <span className="text-slate-700">•</span>
                          <span className="text-[10px] font-black text-slate-500 uppercase mb-[1px]">{venue.venueType.replace(/_/g, ' ')}</span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {venue.sceneTags?.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="text-[8px] font-black bg-white/5 text-slate-400 px-1.5 py-0.5 rounded border border-white/5 uppercase tracking-tighter">
                              {tag}
                            </span>
                          ))}
                        </div>

                        {bountyTitle && (
                          <div className={`mt-2 flex items-center gap-1.5 p-2 rounded-lg border ${hasActiveBounty ? 'bg-red-500 text-white border-red-400 font-black' : 'text-red-500 border-transparent'}`}>
                            <Zap size={hasActiveBounty ? 12 : 10} className={`${hasActiveBounty ? 'fill-white' : 'fill-red-500'}`} />
                            <span className={`text-[10px] uppercase tracking-tighter line-clamp-1 ${hasActiveBounty ? 'font-black' : 'font-bold'}`}>
                              {hasActiveBounty ? 'FLASH BOUNTY: ' : ''}{bountyTitle.replace(/⚡/g, '').trim()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 bg-surface/30 rounded-3xl border-2 border-dashed border-white/5 mx-4">
                  <Flame className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold uppercase tracking-widest italic">
                    {isNextStopMode ? "Run Complete! You've cleared the list." : "No Spots Found"}
                  </p>
                  {isNextStopMode ? (
                    <button
                      onClick={() => navigate('/')}
                      className="mt-4 text-primary text-xs font-black uppercase hover:underline"
                    >
                      Return to Full Feed
                    </button>
                  ) : (
                    <button onClick={clearAllFilters} className="mt-4 text-primary text-xs font-black uppercase hover:underline">Clear Filters</button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

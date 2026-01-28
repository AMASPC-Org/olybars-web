import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ArenaLayout } from '../../../components/layout/ArenaLayout';
import { UniversalEventCard } from '../../../components/ui/UniversalEventCard';
import { Venue } from '../../../types';
import { Ticket, Plus, Sparkles, Loader2, List, Music, Mic, Star } from 'lucide-react';
import { EventSubmissionModal } from '../components/EventSubmissionModal';
import { useDiscovery } from '../../venues/contexts/DiscoveryContext';

// Local Helper Type (Flexible source of truth)
export interface UnifiedEvent {
  id: string;
  venueId: string;
  venueName: string;
  title: string;
  date: string; // ISO Date "2023-10-31"
  time: string; // "20:00"
  description: string;
  type: 'live' | 'play' | 'event' | 'karaoke'; // Changed 'live_music' to 'live' to match UniversalEventCard prop
  is_featured?: boolean;
  score?: number;
  is_ritual?: boolean;
}

export const EventsScreen: React.FC = () => {
  const { allVenues: venues, isLoading: isVenuesLoading } = useDiscovery();
  const { id: venueId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const eventTypeFilter = (searchParams.get('type') as 'all' | 'music' | 'activities') || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // --- UNIFIED FEED ENGINE ---
  useEffect(() => {
    // If venues are still loading, wait
    if (isVenuesLoading && venues.length === 0) return;

    const generateFeed = async () => {
      setIsLoading(true);
      const today = new Date();
      const normalizeDate = (d: Date) => d.toISOString().split('T')[0];
      const todayStr = normalizeDate(today);

      // 1. Fetch One-Time Events (Flatten from Venues)
      const specialEvents: UnifiedEvent[] = venues.flatMap(v =>
        (v.special_events || []).map(evt => ({
          id: evt.id,
          venueId: v.id,
          venueName: v.name,
          title: evt.title,
          date: evt.date,
          time: evt.startTime,
          description: evt.description || '',
          type: (evt.type === 'music' ? 'live' : 'event') as UnifiedEvent['type'], // Map music -> live
          is_featured: evt.is_featured,
          score: evt.is_featured ? 100 : 10,
          is_ritual: false
        }))
      ).filter(e => e.date >= todayStr);

      // 2. Generate Ritual Instances (Next 7 Days)
      const rituals: UnifiedEvent[] = [];
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

      venues.forEach(v => {
        if (v.weekly_schedule) {
          Object.entries(v.weekly_schedule).forEach(([day, activities]) => {
            const dayIndex = days.indexOf(day.toLowerCase());
            if (dayIndex === -1) return;

            // Find next occurrence
            const instanceDate = new Date();
            const dayDiff = (dayIndex - today.getDay() + 7) % 7;
            instanceDate.setDate(today.getDate() + dayDiff);
            const dateStr = normalizeDate(instanceDate);

            // Determine rough category
            const getActivityType = (act: string): UnifiedEvent['type'] => {
              const lower = act.toLowerCase();
              if (lower.includes('trivia') || lower.includes('bingo') || lower.includes('quiz')) return 'play';
              if (lower.includes('karaoke')) return 'karaoke';
              if (lower.includes('music') || lower.includes('jazz')) return 'live';
              return 'event';
            };

            activities.forEach(act => {
              rituals.push({
                id: `ritual-${v.id}-${day}-${act}`,
                venueId: v.id,
                venueName: v.name,
                title: act + ' ' + (dayDiff === 0 ? '(Tonight)' : ''),
                date: dateStr,
                time: v.triviaTime || '19:00',
                description: `Weekly ${act} at ${v.name}`,
                type: getActivityType(act),
                is_featured: false,
                score: 5,
                is_ritual: true
              });
            });
          });
        }
      });

      // 3. Merge & Sort
      const allEvents = [...specialEvents, ...rituals].sort((a, b) => {
        // Boost featured items
        if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
        // Then by Date
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        // Then by Time
        return a.time.localeCompare(b.time);
      });

      setEvents(allEvents);
      setIsLoading(false);
    };

    generateFeed();
  }, [venues, isVenuesLoading]);

  const setFilterAndUrl = (type: string) => {
    setSearchParams(prev => {
      prev.set('type', type);
      return prev;
    });
  };

  const filteredEvents = events.filter(e => {
    // 1. Venue Filter (URL context)
    if (venueId && e.venueId !== venueId) return false;

    // 2. Search Filter
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venueName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // 3. Type Filter
    if (eventTypeFilter === 'all') return true;
    const isMusic = e.type === 'live';
    const isActivity = e.type === 'play' || e.type === 'karaoke';

    if (eventTypeFilter === 'music') return isMusic;
    if (eventTypeFilter === 'activities') return isActivity;

    return true;
  });

  return (
    <ArenaLayout
      title="The Citywire"
      subtitle="Chronological Citywide Feed"
      activeCategory="events"
      artieTip="Thurston County is always on. Featured events and weekly rituals, all in one timeline."
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search the wire..."
    >
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'All Events', icon: List },
          { id: 'music', label: 'Live Music', icon: Music },
          { id: 'activities', label: 'Activities', icon: Mic },
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => setFilterAndUrl(type.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${eventTypeFilter === type.id
              ? 'bg-primary text-black shadow-[0_0_15px_rgba(251,191,36,0.5)]'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
              }`}
          >
            <type.icon size={14} />
            {type.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* Submit Event Trigger */}
        <button
          onClick={() => setShowSubmitModal(true)}
          className="w-full bg-primary/10 border border-primary/30 text-primary font-black px-6 py-4 rounded-3xl uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/20 transition-all font-league text-sm shadow-[0_4px_20px_-5px_rgba(251,191,36,0.1)] group mb-4"
        >
          <Plus className="w-5 h-5 group-hover:scale-125 transition-transform" /> Submit New Event
        </button>

        {isLoading || (isVenuesLoading && events.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="font-black uppercase tracking-widest text-xs animate-pulse">refreshing the wire...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {filteredEvents.map(event => (
              <div key={event.id} className="relative group">
                {event.is_featured && (
                  <div className="absolute -top-3 left-4 z-20 bg-primary text-black text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 border border-black/10">
                    <Star size={10} className="fill-black" />
                    Featured
                  </div>
                )}
                <div className={event.is_featured ? "border-2 border-primary/50  rounded-[2.2rem] shadow-[0_0_30px_rgba(251,191,36,0.1)]" : ""}>
                  <UniversalEventCard
                    // Pass specific props to bypass strict AppEvent requirement
                    title={event.title}
                    time={`${event.date} @ ${event.time}`}
                    venue={venues.find(v => v.id === event.venueId)}
                    category={event.type}
                    points={event.score}
                    contextSlot={
                      <div className="flex items-center gap-2">
                        <Ticket size={14} className={event.is_ritual ? "text-slate-500" : "text-primary"} />
                        <span className={`text-[10px] font-black uppercase font-league ${event.is_ritual ? "text-slate-500" : "text-white"}`}>
                          {event.is_ritual ? 'Weekly Ritual' : 'Special Event'}
                        </span>
                      </div>
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-[#1e293b]/30 rounded-[2rem] border border-dashed border-white/5 space-y-4">
            <Sparkles className="w-10 h-10 text-slate-700 mx-auto" />
            <p className="text-slate-500 font-black uppercase tracking-widest font-league">Wire is Silent</p>
            <p className="text-[10px] text-slate-600 font-bold uppercase">Be the first to share what's happening</p>
          </div>
        )}
      </div>

      <EventSubmissionModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        venues={venues}
      />
    </ArenaLayout >
  );
};

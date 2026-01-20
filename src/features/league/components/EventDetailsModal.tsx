import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, MapPin, Sparkles, Trophy } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { UnifiedEvent } from '../screens/EventsScreen';
import { AppEvent } from '../../../types/event';
import { Maker } from '../../../types/sponsorship';
import { UserProfile } from '../../../types';
import { SponsorReservationComponent } from '../../../features/makers/components/SponsorReservationComponent';
import { FormatCurrency } from '../../../utils/formatCurrency';

interface EventDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventData: UnifiedEvent | null; // The summary data we have
    userProfile?: UserProfile;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ isOpen, onClose, eventData, userProfile }) => {
    const [fullEvent, setFullEvent] = useState<AppEvent | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [userMakers, setUserMakers] = useState<Maker[]>([]);

    useEffect(() => {
        const loadData = async () => {
            if (!eventData?.venueId || !eventData?.id) return;

            setIsLoading(true);
            try {
                // 1. Fetch Full Event Document
                // The ID in UnifiedEvent might be composite for rituals "ritual-venue-day-activity".
                // If it's a ritual, we can't fetch a doc because it doesn't exist as a single event.
                // Sponsorships are only typically supported on "Create Event" aka "Special Events" for now.
                // Re-read task: "EventCreationWizard" adds sponsorships. This creates a concrete document.
                // So if eventData.is_ritual is true, it likely has no sponsorship package unless we lazily create one (JIT) which is out of scope.
                // So we only fetch availability for non-ritual events.

                if (!eventData.is_ritual) {
                    const docRef = doc(db, 'venues', eventData.venueId, 'events', eventData.id);
                    const snap = await getDoc(docRef);
                    if (snap.exists()) {
                        setFullEvent({ id: snap.id, ...snap.data() } as AppEvent);
                    }
                }

                // 2. Fetch User's Makers (if Maker)
                if (userProfile?.role === 'maker' || userProfile?.role === 'admin') {
                    // Admins might also want to see the view
                    const makersQ = query(collection(db, 'makers'), where('ownerId', '==', userProfile.uid));
                    const makerSnaps = await getDocs(makersQ);
                    const loadedMakers = makerSnaps.docs.map(d => ({ id: d.id, ...d.data() } as Maker));
                    setUserMakers(loadedMakers);
                }
            } catch (err) {
                console.error("Failed to load event details", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            setFullEvent(null); // Reset
            loadData();
        }
    }, [isOpen, eventData, userProfile]);

    if (!isOpen || !eventData) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="bg-[#1e293b] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">

                {/* Header Image / Pattern */}
                <div className="h-48 bg-gradient-to-r from-slate-900 to-slate-800 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md transition-all z-20"
                    >
                        <X size={20} />
                    </button>

                    <div className="absolute bottom-6 left-6 right-6">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${eventData.type === 'live' ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' :
                                        eventData.type === 'play' ? 'bg-green-500/20 border-green-500/50 text-green-300' :
                                            'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                        }`}>
                                        {eventData.type}
                                    </span>
                                    {eventData.is_ritual && (
                                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-700/50 border border-slate-600 text-slate-300">
                                            Weekly Ritual
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black text-white font-league uppercase tracking-tight leading-none mb-1">
                                    {eventData.title}
                                </h2>
                                <div className="flex items-center gap-2 text-slate-400 font-medium text-sm">
                                    <MapPin size={14} className="text-primary" />
                                    <span>{eventData.venueName}</span>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur border border-white/10 px-4 py-3 rounded-xl">
                                    <div>
                                        <Calendar size={16} className="text-slate-400 mb-1 mx-auto" />
                                        <div className="text-xs font-bold text-white uppercase">{new Date(eventData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                    </div>
                                    <div className="w-px h-8 bg-white/10 mx-2"></div>
                                    <div>
                                        <Clock size={16} className="text-slate-400 mb-1 mx-auto" />
                                        <div className="text-xs font-bold text-white uppercase">{eventData.time}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                    {/* Description */}
                    <div>
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">About The Vibe</h3>
                        <p className="text-slate-300 leading-relaxed text-lg">
                            {fullEvent?.description || eventData.description || "Join us for a night of good times and community vibes."}
                        </p>
                    </div>

                    {/* Rich Features (if full event loaded) */}
                    {fullEvent && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {fullEvent.prizes && (
                                <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl">
                                    <Trophy className="text-yellow-500 mb-2" size={20} />
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prizes</div>
                                    <div className="text-white font-bold">{fullEvent.prizes}</div>
                                </div>
                            )}
                            {fullEvent.eventSpecials && (
                                <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl">
                                    <Sparkles className="text-purple-500 mb-2" size={20} />
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Specials</div>
                                    <div className="text-white font-bold">{fullEvent.eventSpecials}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sponsorship Section - Only for Makers & Non-Rituals */}
                    {!eventData.is_ritual && isLoading ? (
                        <div className="py-8 text-center text-slate-500 animate-pulse">
                            Checking sponsorship availability...
                        </div>
                    ) : fullEvent && (userProfile?.role === 'maker' || userProfile?.role === 'admin') ? (
                        <SponsorReservationComponent
                            event={fullEvent}
                            makers={userMakers}
                            userEmail={userProfile?.uid || ''}
                        />
                    ) : null}

                    {eventData.is_ritual && userProfile?.role === 'maker' && (
                        <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-xl text-center">
                            <p className="text-slate-400 text-sm">
                                Sponsorships for Weekly Rituals are managed via the venue directly.
                                <br />Please contact {eventData.venueName} to inquire about "Series Sponsorship".
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

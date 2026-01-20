import React, { useMemo } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import {
    Key, Users, Info, ChevronRight, ExternalLink, MapPin,
    Sparkles, Bot, ShieldCheck, Heart
} from 'lucide-react';
import { Venue, PrivateSpace, UserProfile } from '../../../types';
import { SEO } from '../../../components/common/SEO';

export const BackRoomScreen: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const venueIdFilter = searchParams.get('venueId');

    // Supporting both props and context for maximum flexibility
    const context = useOutletContext<{
        venues: Venue[];
        userProfile?: UserProfile;
    }>();

    const venues = context?.venues || [];

    const roomsWithVenue = useMemo(() => {
        const allRooms = venues.flatMap(v =>
            (v.privateSpaces || []).map(space => ({
                ...space,
                venueId: v.id,
                venueName: v.name,
                venueVibe: v.vibe,
                venueAddress: v.address,
                venuePhoto: v.photos?.[0]?.url
            }))
        );

        if (venueIdFilter) {
            return allRooms.filter(r => r.venueId === venueIdFilter);
        }
        return allRooms;
    }, [venues, venueIdFilter]);

    return (
        <div className="bg-background min-h-screen pb-32 font-sans text-slate-100">
            <SEO
                title="The Back Room | OlyBars"
                description="Private inventory for squads, parties, and secret meetings in Olympia, WA."
            />

            {/* Header Section */}
            <div className="p-8 space-y-2 text-center relative overflow-hidden">
                {/* Decorative Background Element */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[120px] -z-10" />

                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    <Key size={12} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Exclusive Inventory</span>
                </div>

                <h1 className="text-5xl font-black italic uppercase font-league tracking-tighter leading-none text-white animate-in fade-in slide-in-from-bottom-4 duration-700">
                    THE <span className="text-primary">BACK ROOM</span>
                </h1>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    {venueIdFilter && roomsWithVenue.length > 0
                        ? `Exclusive inventory for ${roomsWithVenue[0].venueName}`
                        : 'Private inventory for squads & parties'}
                </p>
                {venueIdFilter && (
                    <button
                        onClick={() => navigate('/back-room')}
                        className="mt-4 text-[10px] font-black uppercase text-primary tracking-widest hover:underline"
                    >
                        View All Rooms
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="px-6 space-y-6">
                {roomsWithVenue.length === 0 ? (
                    <div className="text-center py-20 bg-surface/30 rounded-3xl border-2 border-dashed border-slate-800">
                        <Bot className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest font-league italic">No private rooms available right now</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {roomsWithVenue.map((room, idx) => (
                            <div
                                key={`${room.venueId}-${room.name}-${idx}`}
                                className="bg-surface border-2 border-slate-800 rounded-[2.5rem] overflow-hidden hover:border-primary/50 transition-all group shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700"
                                style={{ animationDelay: `${idx * 150}ms` }}
                            >
                                <div className="relative min-h-[16rem] overflow-hidden text-center">
                                    <img
                                        src={room.venuePhoto || 'https://images.unsplash.com/photo-1574096079513-d8259312b785?w=500&auto=format&fit=crop'}
                                        alt={room.name}
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60"
                                    />

                                    {/* FLUID OVERLAY: Replaces old gradient and header stack */}
                                    <div className="text-overlay-container relative z-10 pt-24">
                                        <div className="flex justify-center mb-2">
                                            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full">
                                                <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none block">{room.venueName}</span>
                                            </div>
                                        </div>

                                        <h2 className="display-title-fluid text-white font-league uppercase italic">
                                            {room.name}
                                        </h2>

                                        <div className="flex items-center justify-center gap-2 text-slate-300 mt-2 mb-2">
                                            <Users size={14} className="text-primary" />
                                            <span className="text-xs font-bold uppercase tracking-wide">Capacity: {room.capacity} Squad Members</span>
                                        </div>

                                        <p className="text-sm text-slate-400 leading-relaxed font-medium mb-1 px-6 line-clamp-2 italic">
                                            "{room.description}"
                                        </p>
                                    </div>
                                </div>

                                <div className="px-6 pb-6 pt-4 bg-surface">

                                    <div className="flex flex-col gap-3">
                                        {room.bookingLink ? (
                                            <a
                                                href={room.bookingLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full bg-white text-black py-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs hover:bg-primary transition-all active:scale-95 shadow-lg shadow-white/5"
                                            >
                                                <ExternalLink size={14} />
                                                Get a Room
                                            </a>
                                        ) : (
                                            <button
                                                onClick={() => navigate(`/bars/${room.venueId}`)}
                                                className="w-full bg-slate-800 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs hover:bg-slate-700 transition-all active:scale-95 border border-white/5"
                                            >
                                                <Info size={14} />
                                                View Venue Details
                                            </button>
                                        )}

                                        <button
                                            onClick={() => navigate(`/bars/${room.venueId}`)}
                                            className="w-full py-2 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] hover:text-primary transition-colors"
                                        >
                                            Visit {room.venueName} Profile
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* CTA for Venue Owners */}
                <PrivateSpaceCTA userProfile={context?.userProfile} />

                {/* Info Card */}
                <div className="mt-12 bg-primary/5 border border-primary/20 rounded-3xl p-8 text-center space-y-4">
                    <ShieldCheck className="w-8 h-8 text-primary mx-auto" />
                    <h3 className="text-lg font-black uppercase font-league text-primary">Back Room Protocol</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-bold italic">
                        All bookings are handled directly by the venue. OlyBars is a discovery layer for
                        private inventory. For special requests, please contact the venue coordinator directly.
                    </p>
                </div>
            </div>

            {/* Legend / Credits */}
            <div className="mt-12 mb-20 px-8 text-center">
                <div className="flex items-center justify-center gap-2 text-slate-700 whitespace-nowrap overflow-hidden">
                    <div className="h-[1px] flex-1 bg-slate-800" />
                    <span className="text-[10px] font-black tracking-[0.3em] uppercase italic px-4">Powered by Well 80</span>
                    <div className="h-[1px] flex-1 bg-slate-800" />
                </div>
            </div>
        </div>
    );
};

const PrivateSpaceCTA: React.FC<{ userProfile?: UserProfile }> = ({ userProfile }) => {
    const navigate = useNavigate();

    // 1. OWNER: Manage Inventory
    if (userProfile?.role === 'owner' || userProfile?.role === 'manager') {
        return (
            <div className="mt-8 mx-6 bg-gradient-to-r from-slate-900 to-slate-800 border border-primary/30 rounded-3xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10 transition-all group-hover:bg-primary/20" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/20 p-3 rounded-full text-primary">
                            <Key size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white italic uppercase">Got a Hidden Gem?</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">
                                Add your private space to The Back Room inventory.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/owner')}
                        className="w-full md:w-auto px-6 py-3 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white transition-colors shadow-lg active:scale-95 whitespace-nowrap"
                    >
                        Manage My Back Room
                    </button>
                </div>
            </div>
        );
    }

    // 2. PUBLIC / PLAYER: Claim or Join
    return (
        <div className="mt-8 mx-6 bg-slate-900/50 border border-slate-700/50 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-800 p-3 rounded-full text-slate-400">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white italic uppercase">Host a Private Space?</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                            {userProfile
                                ? "Claim your venue to list your room."
                                : "Log in or claim your venue to list your room."}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate(userProfile ? '/partners/claim' : '/login')}
                    className="w-full md:w-auto px-6 py-3 bg-slate-800 text-white border border-slate-700 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-primary hover:text-black hover:border-primary transition-all shadow-lg active:scale-95 whitespace-nowrap"
                >
                    {userProfile ? "Claim Venue" : "Log In / Claim"}
                </button>
            </div>
        </div>
    );
};

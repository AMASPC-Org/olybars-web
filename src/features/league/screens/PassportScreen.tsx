import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Calendar, Clock, MapPin, Search, Zap, Activity } from 'lucide-react';
import { Venue, UserProfile, ClockInRecord, VibeCheckRecord } from '../../../types';
import { PULSE_CONFIG } from '../../../config/pulse';
import { format } from 'date-fns';

interface PassportScreenProps {
    venues: Venue[];
    userProfile: UserProfile;
    clockInHistory: ClockInRecord[];
    vibeCheckHistory: VibeCheckRecord[];
}

export const PassportScreen: React.FC<PassportScreenProps> = ({ venues, userProfile, clockInHistory, vibeCheckHistory }) => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<'all' | 'stamps' | 'vibes'>('all');

    // Rule of Two Calculation
    const { recentClockIns, availableSlots, resetTime } = useMemo(() => {
        const now = Date.now();
        const lcbWindow = PULSE_CONFIG.WINDOWS.LCB_WINDOW;
        const windowStart = now - lcbWindow;

        const recent = clockInHistory
            .filter(record => record.timestamp > windowStart)
            .sort((a, b) => b.timestamp - a.timestamp); // Newest first

        const count = recent.length;
        const slots = Math.max(0, 2 - count);

        // Calculate when the oldest active clock-in expires
        let reset = null;
        if (recent.length > 0) {
            // The time when the *oldest* relevant clock-in falls out of the window
            // Actually, we want to know when the *next* slot frees up. 
            // If we have 1, we have 1 slot. If we have 2, we have 0 slots until the oldest one expires.
            // So strictly speaking, we care about the expiration of the *oldest* entry in the window.
            // But let's just show time until the oldest one expires if count > 0.
            const oldestActive = recent[recent.length - 1];
            reset = oldestActive.timestamp + lcbWindow;
        }

        return { recentClockIns: recent, availableSlots: slots, resetTime: reset };
    }, [clockInHistory]);

    // Enriched History for Grid
    // Enriched History for Grid
    const unifiedHistory = useMemo(() => {
        const stamps = clockInHistory.map(r => ({ ...r, type: 'clockin' as const }));
        const vibes = vibeCheckHistory.map(r => ({ ...r, type: 'vibe' as const }));

        return [...stamps, ...vibes]
            .sort((a, b) => b.timestamp - a.timestamp)
            .map(record => {
                const venue = venues.find(v => v.id === record.venueId);
                return {
                    ...record,
                    venueName: venue ? venue.name : 'Unknown Venue',
                    formattedDate: format(record.timestamp, 'MMM d, yyyy'),
                    formattedTime: format(record.timestamp, 'h:mm a')
                };
            })
            .filter(item => {
                if (filter === 'stamps') return item.type === 'clockin';
                if (filter === 'vibes') return item.type === 'vibe';
                return true;
            });
    }, [clockInHistory, vibeCheckHistory, venues, filter]);

    return (
        <div className="bg-background text-white min-h-screen p-4 font-sans pb-24">

            {/* Header */}
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-league font-black text-primary uppercase tracking-tight">League Passport</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Official Member Identification</p>
                </div>
                <ShieldCheck className="text-primary w-8 h-8" />
            </header>

            {/* Identity Card */}
            <div className="bg-gradient-to-br from-slate-900 to-black border border-slate-800 rounded-2xl p-6 mb-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <ShieldCheck size={120} />
                </div>

                <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-16 h-16 bg-slate-800 rounded-full border-2 border-primary flex items-center justify-center">
                        <span className="text-2xl">👤</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-league font-black text-white uppercase tracking-wide">
                            {userProfile.handle || "Guest User"}
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="bg-primary text-black text-[10px] font-black uppercase px-2 py-0.5 rounded">
                                Level {Math.floor((userProfile.stats?.seasonPoints || 0) / 1000) + 1}
                            </span>
                            <span className="text-slate-500 text-[10px] font-bold uppercase">
                                Member ID: {userProfile.uid.slice(0, 8)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 relative z-10">
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Check-ins</p>
                        <p className="font-mono text-xl text-white">{clockInHistory.length}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Member Since</p>
                        <p className="font-mono text-xl text-white">
                            {userProfile.createdAt ? format(userProfile.createdAt, 'yyyy') : '2024'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Rule of Two Standard */}
            <div className="mb-8">
                <div className="flex justify-between items-end mb-3">
                    <h3 className="text-lg font-league font-black text-white uppercase tracking-wide">Daily Allowance</h3>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${availableSlots > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                        {availableSlots > 0 ? 'Clock-in Available' : 'Limit Reached'}
                    </span>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        <span>Window Usage (12hr)</span>
                        <span>{recentClockIns.length} / 2 Used</span>
                    </div>

                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden mb-3 flex">
                        {[0, 1].map((i) => (
                            <div key={i} className={`flex-1 border-r last:border-r-0 border-slate-900 ${i < recentClockIns.length ? 'bg-primary' : 'bg-transparent'}`} />
                        ))}
                    </div>

                    {resetTime && availableSlots < 2 && (
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            <Clock size={12} />
                            <span>Next slot available: {format(resetTime, 'h:mm a')}</span>
                        </div>
                    )}

                    {availableSlots > 0 && (
                        <button
                            onClick={() => navigate('/?mode=next-stop')}
                            className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-white font-league font-black text-xs uppercase py-3 rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-700"
                        >
                            <Search size={14} /> Find a Venue
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Control */}
            <div className="flex justify-center mb-6">
                <div className="bg-slate-900/80 p-1 rounded-lg flex gap-1 border border-slate-800">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-1.5 rounded text-xs font-black uppercase tracking-wider transition-all ${filter === 'all' ? 'bg-primary text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('stamps')}
                        className={`px-4 py-1.5 rounded text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${filter === 'stamps' ? 'bg-amber-400 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <ShieldCheck size={12} /> Stamps
                    </button>
                    <button
                        onClick={() => setFilter('vibes')}
                        className={`px-4 py-1.5 rounded text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${filter === 'vibes' ? 'bg-fuchsia-400 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Zap size={12} /> Vibes
                    </button>
                </div>
            </div>

            {/* Stamp Collection */}
            <div>
                <h3 className="text-lg font-league font-black text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Calendar size={18} className="text-primary" /> History Log
                </h3>

                <div className="space-y-3">
                    {unifiedHistory.length === 0 ? (
                        <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
                            <Activity size={48} className="text-slate-700 mx-auto mb-3" />
                            <p className="text-slate-500 font-bold text-sm">No activity recorded yet.</p>
                        </div>
                    ) : (
                        unifiedHistory.map((item, idx) => (
                            <div key={`${item.venueId}-${item.timestamp}-${idx}`} className="bg-surface border border-slate-800 p-4 rounded-xl flex items-center justify-between group hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full border border-opacity-20 ${item.type === 'clockin' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-fuchsia-500/10 border-fuchsia-500 text-fuchsia-500'}`}>
                                        {item.type === 'clockin' ? <MapPin size={20} /> : <Zap size={20} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-league font-black text-white text-lg uppercase tracking-tight leading-none">
                                                {item.venueName}
                                            </h4>
                                            {item.type === 'vibe' && (
                                                <span className="text-[10px] font-black uppercase bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                                                    {(item as VibeCheckRecord).status}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                            {item.formattedDate} • {item.formattedTime}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {item.type === 'vibe' && (
                                        <span className="block text-fuchsia-400 font-black text-sm">+{(item as VibeCheckRecord).points} PTS</span>
                                    )}
                                    {item.type === 'clockin' && (
                                        <div className="opacity-20 group-hover:opacity-100 transition-opacity">
                                            <ShieldCheck className="text-amber-500 w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
};

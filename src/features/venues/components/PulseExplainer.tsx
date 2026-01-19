import React from 'react';
import { Flame, Users, Zap, Clock, Star, Info, MapPin } from 'lucide-react';
import { PULSE_CONFIG } from '../../../config/pulse';

export const PulseExplainer: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header section explains the overall goal */}
            <header className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                    <Zap className="w-5 h-5 fill-current" />
                    <h2 className="text-2xl font-black uppercase tracking-tight font-league">THE ECOSYSTEM</h2>
                </div>
                <p className="text-base text-slate-300 font-bold leading-tight">
                    One Action. Two Results.
                </p>
                <p className="text-sm text-slate-400 font-medium">
                    The Oly Pulse isn't just a count—it's a real-time "Vibe Engine" powered by your presence.
                </p>
            </header>

            {/* Step 1: The Signal */}
            <section className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                    <MapPin className="w-24 h-24" />
                </div>

                <div className="flex items-start gap-4 mb-4">
                    <div className="bg-primary/20 p-3 rounded-xl">
                        <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Step 1: The Signal</h3>
                        <h4 className="text-xl font-black uppercase tracking-tight font-league text-white italic">YOU CLOCK IN</h4>
                    </div>
                </div>

                <p className="text-sm text-slate-400 font-medium leading-relaxed mb-4">
                    Verifying you are physically at a venue. This is the seed that grows the map.
                </p>
            </section>

            {/* RESULTS SPLIT */}
            <div className="flex justify-center -my-4 relative z-10">
                <div className="flex flex-col items-center">
                    <div className="w-1 h-8 bg-gradient-to-b from-primary/50 to-orange-500/50" />
                    <div className="flex gap-16 -mt-1">
                        <div className="w-4 h-4 border-b-2 border-l-2 border-orange-500/50 rounded-bl-lg" />
                        <div className="w-4 h-4 border-b-2 border-r-2 border-yellow-400/50 rounded-br-lg" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Step 2: Result A - The Buzz */}
                <section className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Flame className="w-24 h-24" />
                    </div>

                    <div className="flex items-start gap-4 mb-4">
                        <div className="bg-orange-500/20 p-3 rounded-xl">
                            <Flame className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-[9px] font-black text-orange-500 uppercase tracking-[0.15em] mb-1">Step 2: The Buzz (Map)</h3>
                            <h4 className="text-lg font-black uppercase tracking-tight font-league text-white leading-tight">THE MAP GETS <br />UPDATED</h4>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            Your presence validates the vibe. Clock-ins combine with <span className="text-orange-400 font-bold">Density</span> and <span className="text-orange-400 font-bold">Decay</span> to increase the Venue's Heat.
                        </p>

                        <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2">
                            <div className="flex items-center gap-2">
                                <Users className="w-3 h-3 text-blue-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DENSITY VARIABLE</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium leading-normal italic">
                                Live Occupancy reported by Players impacts the total Buzz Level. The Bar turns "Red/Hot" when it's popping.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Step 3: Result B - The League */}
                <section className="bg-yellow-400/5 border border-yellow-400/10 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Star className="w-24 h-24" />
                    </div>

                    <div className="flex items-start gap-4 mb-4">
                        <div className="bg-yellow-400/20 p-3 rounded-xl">
                            <Star className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div>
                            <h3 className="text-[9px] font-black text-yellow-500 uppercase tracking-[0.15em] mb-1">Step 3: The League (Personal)</h3>
                            <h4 className="text-lg font-black uppercase tracking-tight font-league text-white leading-tight">YOU GET PAID <br />IN DROPS</h4>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            Every data signal you provide has a value. Your Drops earn you Status, Badges, and Weekly Prizes.
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Clock In</span>
                                <span className="text-sm font-black text-white font-league">+{PULSE_CONFIG.POINTS.CLOCK_IN} Drops</span>
                            </div>
                            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Vibe Check</span>
                                <span className="text-sm font-black text-white font-league">+{PULSE_CONFIG.POINTS.VIBE_REPORT} Drops</span>
                            </div>
                            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Flash Bounty</span>
                                <span className="text-sm font-black text-white font-league">Points Vary</span>
                            </div>
                            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Game Vibe Check</span>
                                <span className="text-sm font-black text-white font-league">+1 Drop</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* FADE NOTICE */}
            <div className="flex items-center gap-3 p-4 bg-blue-900/10 rounded-2xl border border-blue-500/20">
                <Clock className="w-5 h-5 text-blue-400 shrink-0" />
                <p className="text-[11px] font-bold text-blue-200 leading-tight">
                    BUZZ DECAY: High levels require constant movement. Buzz fades by 50% every {PULSE_CONFIG.WINDOWS.DECAY_HALFLIFE / 3600000} hour if no signals are received.
                </p>
            </div>


            {/* Status Thresholds */}
            <section className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-600 pl-1">Thresholds</h3>
                <div className="space-y-3">
                    {[
                        { label: 'Packed', icon: Zap, color: 'text-pink-500', score: `> ${PULSE_CONFIG.THRESHOLDS.PACKED * 100}% Full`, meaning: PULSE_CONFIG.DESCRIPTIONS.PACKED_MEANING },
                        { label: 'Buzzing', icon: Flame, color: 'text-orange-500', score: `> ${PULSE_CONFIG.THRESHOLDS.BUZZING * 100}% Full`, meaning: PULSE_CONFIG.DESCRIPTIONS.BUZZING_MEANING },
                        { label: 'Chill', icon: Users, color: 'text-blue-500', score: `> ${PULSE_CONFIG.THRESHOLDS.CHILL * 100}% Full`, meaning: PULSE_CONFIG.DESCRIPTIONS.CHILL_MEANING },
                        { label: 'Mellow', icon: Clock, color: 'text-emerald-400', score: `Base State`, meaning: PULSE_CONFIG.DESCRIPTIONS.MELLOW_MEANING },
                    ].map((status) => (
                        <div key={status.label} className="flex items-center justify-between p-4 bg-surface border border-white/10 rounded-2xl group hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-3">
                                <status.icon className={`w-5 h-5 ${status.color}`} />
                                <div>
                                    <span className="text-xs font-black uppercase tracking-tight text-white mb-0.5 block">{status.label}</span>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase leading-none">{status.meaning}</p>
                                </div>
                            </div>
                            <span className="font-league font-black text-primary italic uppercase tracking-tighter">{status.score}</span>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex gap-3">
                <Info className="w-5 h-5 text-primary shrink-0" />
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
                    Rules are strictly enforced by the WA State LCB Compliance Layer. Clock-ins are limited to 2 per 12-hour window.
                </p>
            </footer>
        </div>
    );
};

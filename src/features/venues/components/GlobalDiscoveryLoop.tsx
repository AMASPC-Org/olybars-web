import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Trophy, ChevronRight, Zap, Bot, Sparkles } from 'lucide-react';
import artieHead from '/artie-head.png';

interface GlobalDiscoveryLoopProps {
    isGuest: boolean;
    onAskArtie: (mode?: 'visitor' | 'ops') => void;
    onToggleWeeklyBuzz?: () => void;
    isNoResults?: boolean;
}

export const GlobalDiscoveryLoop: React.FC<GlobalDiscoveryLoopProps> = ({
    isGuest,
    onAskArtie,
    onToggleWeeklyBuzz,
    isNoResults = false
}) => {
    const navigate = useNavigate();

    return (
        <div className="space-y-4 pt-4 pb-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* ... Sanctioned League Play Aesthetic Banner ... */}
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-black border-2 border-[#fbbf24] rounded-2xl p-6 shadow-2xl overflow-hidden">
                    {/* Background Decorative Element */}
                    <div className="absolute -right-8 -bottom-8 opacity-10 transform rotate-12">
                        <Crown size={120} className="text-[#fbbf24]" />
                    </div>

                    <div className="relative z-10">
                        {isGuest ? (
                            <>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-[#fbbf24] p-2 rounded-lg text-black">
                                        <Crown size={24} />
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none font-league">
                                        Don't just find the vibe—bank it.
                                    </h3>
                                </div>
                                <p className="text-sm text-slate-300 font-medium mb-6 leading-relaxed">
                                    Join the League to earn Drops on every Clock In. Turn your night out into sanctioned progress.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => navigate('/league-membership')}
                                        className="flex-1 bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-black uppercase py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_4px_0_0_#b45309]"
                                    >
                                        Join the League <ChevronRight size={18} />
                                    </button>
                                    {onToggleWeeklyBuzz && (
                                        <button
                                            onClick={onToggleWeeklyBuzz}
                                            className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black uppercase py-4 rounded-xl border border-white/10 transition-all active:scale-95"
                                        >
                                            Weekly Buzz Email
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-[#fbbf24] p-2 rounded-lg text-black shadow-lg">
                                        <Trophy size={24} />
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none font-league">
                                        Found the spot? Get the Drops.
                                    </h3>
                                </div>
                                <p className="text-sm text-slate-300 font-medium mb-6 leading-relaxed">
                                    How do you rank in the city tonight? Your legend is built one venue at a time.
                                </p>
                                <button
                                    onClick={() => navigate('/league?tab=standings')}
                                    className="w-full bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-black uppercase py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_4px_0_0_#b45309]"
                                >
                                    View Standings <Trophy size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Global Pivot (The Artie Catch-All) */}
            <button
                onClick={() => onAskArtie()}
                className="w-full bg-slate-900/50 hover:bg-slate-900 border border-white/10 hover:border-primary/50 p-5 rounded-2xl flex items-center gap-4 group transition-all"
            >
                <div className="bg-oly-navy p-1 rounded-xl border border-oly-gold/30 group-hover:border-oly-gold group-hover:bg-black transition-all overflow-hidden w-12 h-12 flex-shrink-0">
                    <img
                        src={artieHead}
                        alt="Artie"
                        className="w-full h-full object-contain"
                    />
                </div>
                <div className="text-left flex-1">
                    <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">Custom Intel</p>
                    <p className="text-sm text-white font-bold leading-tight">
                        Still looking for the perfect match? <span className="text-primary italic">Ask Artie.</span>
                    </p>
                </div>
                <Sparkles size={20} className="text-primary opacity-0 group-hover:opacity-100 transition-all animate-pulse" />
            </button>

        </div>
    );
};

import React, { useEffect, useState } from 'react';
import { ArrowLeft, History, MapPin, Receipt, Sparkles, Trophy, LogIn, UserPlus, Info, Clock, X } from 'lucide-react';
import { fetchUserPointHistory } from '../../../services/userService';
import { ActivityLog, UserProfile } from '../../../types/user';
import { format } from 'date-fns';

interface PointHistoryScreenProps {
    onBack: () => void;
    userProfile: UserProfile;
    onLogin?: () => void;
}

export const PointHistoryScreen: React.FC<PointHistoryScreenProps> = ({ onBack, userProfile, onLogin }) => {
    const [history, setHistory] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    const isNonLoggedIn = userProfile.uid === 'guest';
    const isGuest = userProfile.role === 'guest';
    const isPlayer = userProfile.role === 'PLAYER' || userProfile.role === 'user'; // Supporting both legacy 'user' and new 'PLAYER'

    useEffect(() => {
        if (isNonLoggedIn) {
            setLoading(false);
            return;
        }

        const loadHistory = async () => {
            try {
                const data = await fetchUserPointHistory();
                setHistory(data);
            } catch (e) {
                console.error('Failed to load history:', e);
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, [isNonLoggedIn]);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'clock_in': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'vibe': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'photo': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'play': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const getArtieNote = (item: ActivityLog) => {
        if ((item as any).status === 'PENDING') return "Verification in progress... The Commissioner is reviewing your proof! ??";
        if (item.type === 'clock_in') return "You clocked in and joined the Pulse! ??";
        if (item.type === 'vibe') return "Thanks for the heads-up on the vibe! ???";
        if (item.type === 'play') return `Game on! Verified at ${item.metadata?.amenityName || 'the venue'}. ??`;
        if (item.type === 'photo') return "Visual proof! Your photo is rocking the feed. ??";
        return "Great activity for the League! ??";
    };

    if (isNonLoggedIn) {
        return (
            <div className="min-h-screen bg-[#020617] text-slate-200">
                <div className="sticky top-0 z-10 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold font-display tracking-tight">Point History</h1>
                </div>
                <div className="p-8 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
                        <Trophy className="w-24 h-24 text-amber-500 relative z-10 animate-bounce" strokeWidth={1} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black text-white uppercase font-league">Join the League</h2>
                        <p className="text-slate-400 leading-relaxed">
                            Points are essentially the currency of Olympia's nightlife.
                            Track your clock-ins, unlock badges, and climb the leaderboard.
                        </p>
                    </div>
                    <button
                        onClick={onLogin}
                        className="w-full bg-primary text-black font-black py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
                    >
                        <LogIn className="w-5 h-5" />
                        Login to Start Tracking
                    </button>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                        Consulting Artie's Archives...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-amber-400" />
                    <h1 className="text-xl font-bold font-display tracking-tight">Point History</h1>
                </div>
            </div>

            <div className="p-4 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar / Left Column on Desktop */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Stats Summary */}
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col items-center lg:items-start justify-center space-y-1">
                                <span className="text-slate-500 text-[10px] uppercase tracking-widest font-black">Season Points</span>
                                <div className="flex items-center gap-2 pt-2">
                                    <Trophy className="w-6 h-6 text-amber-500" />
                                    <span className="text-3xl font-black text-white font-league">
                                        {history.filter(i => (i as any).status !== 'PENDING').reduce((acc, item) => acc + item.points, 0)}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col items-center lg:items-start justify-center space-y-1">
                                <span className="text-slate-500 text-[10px] uppercase tracking-widest font-black">Total Activities</span>
                                <div className="flex items-center gap-2 pt-2">
                                    <Sparkles className="w-6 h-6 text-purple-400" />
                                    <span className="text-3xl font-black text-white font-league">{history.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Artie's Stats Corner (Desktop Only) */}
                        <div className="hidden lg:block bg-surface p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Sparkles className="w-24 h-24 text-primary" />
                            </div>
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Artie's Insight
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed italic">
                                "Every clock-in is a soul added to the collective pulse of the South Sound. Your activity history is more than just points—it's a receipt for a life lived well in Olympia."
                            </p>
                            {isGuest && (
                                <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl space-y-3">
                                    <p className="text-[10px] font-black text-primary uppercase">Player Status Required</p>
                                    <p className="text-[11px] text-slate-300">You are currently a Guest. Join the League to unlock exclusive rewards and seasonal badges.</p>
                                    <button className="w-full py-2 bg-primary text-black text-[10px] font-black uppercase rounded-lg">Upgrade Now</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Ledger Content */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Detailed Activity Ledger</h2>

                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center space-y-4">
                                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing the Artesian Well...</p>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl space-y-6">
                                <Receipt className="w-16 h-16 text-slate-800 mx-auto" />
                                <div className="space-y-2">
                                    <p className="text-lg font-bold text-slate-400 uppercase tracking-tight">The ledger is silent...</p>
                                    <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Clock in at your favorite spot to earn points!</p>
                                </div>
                                <button onClick={onBack} className="bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase px-6 py-3 rounded-xl border border-white/10 transition-all">
                                    Go to Map
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {history.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-4 lg:p-6 hover:border-slate-700 transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-3 lg:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Receipt className="w-12 h-12 lg:w-16 lg:h-16" />
                                        </div>

                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider">
                                                <span>{format(item.timestamp, 'MMM d, h:mm a')}</span>
                                            </div>
                                            <div className="text-2xl font-black text-white font-league">
                                                +{item.points}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`px-2 py-1 rounded-md text-[9px] uppercase font-black border tracking-tighter ${getTypeColor(item.type)}`}>
                                                {item.type.replace('_', ' ')}
                                            </div>
                                            {item.venueId && (
                                                <div className="flex items-center gap-1.5 text-xs text-amber-200/60 font-bold">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    <span>{item.metadata?.venueName || item.venueId}</span>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-slate-400 text-sm italic leading-relaxed font-medium mb-4">
                                            “{getArtieNote(item)}”
                                        </p>

                                        <div className="pt-4 border-t border-white/5 flex flex-wrap justify-between items-center gap-4">
                                            <span className="text-[9px] text-slate-700 font-mono font-bold tracking-widest">TX_ID: {item.id.slice(0, 12).toUpperCase()}</span>
                                            <div className="flex gap-2">
                                                {(item as any).status === 'PENDING' && (
                                                    <div className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[8px] text-slate-400 font-black tracking-widest uppercase flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Verification Pending
                                                    </div>
                                                )}
                                                {(item as any).status === 'REJECTED' && (
                                                    <div className="px-2 py-1 bg-red-900/20 border border-red-800/40 rounded text-[8px] text-red-400 font-black tracking-widest uppercase flex items-center gap-1">
                                                        <X className="w-3 h-3" />
                                                        Bounty Rejected
                                                    </div>
                                                )}
                                                {item.verificationMethod === 'qr' && (
                                                    <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[8px] text-amber-500 font-black tracking-widest uppercase flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3" />
                                                        QR Verified
                                                    </div>
                                                )}
                                                {item.verificationMethod === 'gps' && (
                                                    <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[8px] text-blue-500 font-black tracking-widest uppercase flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        GPS Hardened
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

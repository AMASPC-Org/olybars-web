import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Trophy, Zap, Beer,
    Star, Gift, Search, Crown,
    MapPin, MessageCircle
} from 'lucide-react';
// Correcting imports if they existed. I will actually CHECK the file content again because the previous view didn't show skills imports.

export const LeaguePerksScreen: React.FC = () => {
    const navigate = useNavigate();

    const perks = [
        {
            icon: MapPin,
            title: "Clock-in Points",
            desc: "Clock in at any league bar to collect 10+ drops towards the season leaderboard.",
            color: "text-blue-400",
            bg: "bg-blue-400/10"
        },
        {
            icon: Zap,
            title: "Buzz Multipliers",
            desc: "Collect bonus drops at 'Buzzing' venues or for being the first to report the vibe.",
            color: "text-amber-500",
            bg: "bg-amber-500/10"
        },
        {
            icon: Search,
            title: "Trivia Cheat Codes",
            desc: "League members get direct links to the Oly History Blog for trivia answers.",
            color: "text-primary",
            bg: "bg-primary/10"
        },
        {
            icon: Gift,
            title: "Seasonal Rewards",
            desc: "Redeem your drops for local gift cards, exclusive merch, and 'Artisan' perks.",
            color: "text-purple-400",
            bg: "bg-purple-400/10"
        },
        {
            icon: Star,
            title: "Vibe Verification",
            desc: "Verify your location with a selfie to earn social badges and extra clout.",
            color: "text-green-400",
            bg: "bg-green-400/10"
        },
        {
            icon: Crown,
            title: "Elite Status",
            desc: "Climb the ranks from 'Guest' to 'League Legend' and unlock hidden Artie skills.",
            color: "text-red-500",
            bg: "bg-red-500/10"
        }
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-6 pb-24 font-body animate-in fade-in duration-500">
            {/* Header */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-primary mb-8 hover:opacity-80 transition-opacity uppercase font-black tracking-widest text-[10px]"
            >
                <ChevronLeft className="w-4 h-4" /> BACK
            </button>

            <div className="max-w-xl mx-auto space-y-12">
                <header className="text-center space-y-4">
                    <div className="bg-primary/20 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto border-2 border-primary/30 shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                        <Trophy className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter font-league leading-none">
                            LEAGUE <span className="text-primary">PERKS</span>
                        </h1>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2 px-8">
                            Why joining the 98501's official bar circuit is the smartest move you'll make tonight.
                        </p>
                    </div>
                </header>

                {/* Perks Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {perks.map((perk, idx) => (
                        <div
                            key={idx}
                            className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex items-start gap-4 group hover:border-primary/30 transition-all"
                        >
                            <div className={`${perk.bg} p-3 rounded-2xl shrink-0 group-hover:scale-110 transition-transform`}>
                                <perk.icon className={`w-6 h-6 ${perk.color}`} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-league font-black text-lg uppercase tracking-tight text-white group-hover:text-primary transition-colors">
                                    {perk.title}
                                </h3>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                    {perk.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Rewards Preview Carousel */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-league font-black text-xl uppercase tracking-tight text-white flex items-center gap-2">
                            <Gift className="w-5 h-5 text-primary" /> Recent Rewards
                        </h3>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Live Updates</span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 px-2 snap-x">
                        {[
                            { title: "$20 Well 80 Card", pts: "200 DROPS", date: "2m ago", img: "bg-gradient-to-br from-blue-600 to-blue-900" },
                            { title: "League Snapback", pts: "150 DROPS", date: "15m ago", img: "bg-gradient-to-br from-slate-700 to-black" },
                            { title: "$10 Oly Taproom", pts: "100 DROPS", date: "1h ago", img: "bg-gradient-to-br from-amber-600 to-amber-900" },
                            { title: "Early Access Pass", pts: "50 DROPS", date: "3h ago", img: "bg-gradient-to-br from-purple-600 to-purple-900" },
                        ].map((reward, i) => (
                            <div key={i} className="min-w-[160px] snap-center bg-slate-900/80 border border-white/5 rounded-2xl overflow-hidden group hover:border-primary/20 transition-all">
                                <div className={`h-24 ${reward.img} flex items-center justify-center relative overflow-hidden`}>
                                    <Trophy className="w-8 h-8 text-white/20 absolute -right-2 -bottom-2 rotate-12" />
                                    <Gift className="w-6 h-6 text-white" />
                                </div>
                                <div className="p-3 space-y-1">
                                    <p className="text-[10px] font-black text-white uppercase truncate">{reward.title}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-primary">{reward.pts}</span>
                                        <span className="text-[8px] text-slate-500 font-bold uppercase">{reward.date}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Call to Action */}
                <div className="bg-gradient-to-br from-primary/20 to-transparent border-2 border-primary/40 p-8 rounded-[2.5rem] text-center space-y-6 shadow-2xl">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black uppercase font-league tracking-tight">Ready to play?</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Setup your OlyBars ID in 30 seconds.</p>
                    </div>
                    <button
                        onClick={() => navigate('/league')}
                        className="w-full bg-primary text-black font-black py-4 rounded-2xl uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20"
                    >
                        JOIN THE LEAGUE
                    </button>
                </div>

                <footer className="text-center pt-8 opacity-40">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-500">
                        Powered by the Artesian Well • 98501
                    </p>
                </footer>
            </div>
        </div>
    );
};

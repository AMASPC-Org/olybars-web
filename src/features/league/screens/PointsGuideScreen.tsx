import React from 'react';
import { ChevronLeft, Zap, Target, Camera, Share2, Award, Info, Sparkles, Trophy, Star, ShieldCheck, Crown, Droplets, Waves } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GAMIFICATION_CONFIG } from '../../../config/gamification';

const PointsGuideScreen: React.FC = () => {
    const navigate = useNavigate();

    const activities = [
        {
            category: 'Source Taps',
            items: [
                {
                    name: 'Clock In',
                    points: '10-100 Drops',
                    desc: 'Deepen your well based on volume (Mellow: 100, Chill: 50, Buzzing: 25, Packed: 10). Support local makers for a 1.5x flow boost!',
                    icon: Target,
                    color: 'bg-blue-500/20 text-blue-400'
                },
                {
                    name: 'Check the Flow',
                    points: '5-20 Drops',
                    desc: 'Report the current vibe. Earn +10 for data signals and +5 for verifying the source with a photo.',
                    icon: Zap,
                    color: 'bg-cyan-500/20 text-cyan-400'
                },
                {
                    name: 'Surge Bonus',
                    points: '+50 Drops',
                    desc: 'Clock in during a scheduled, approved League Event to catch the surge.',
                    icon: Award,
                    color: 'bg-purple-500/20 text-purple-400'
                }
            ]
        },
        {
            category: 'Flow Multipliers',
            items: [
                {
                    name: 'Flash Bounties',
                    points: '+50-200 Drops',
                    desc: 'Capture a specific moment requested by the venue (receipts, specials, vibes) to claim high-value rewards.',
                    icon: Camera,
                    color: 'bg-amber-500/20 text-amber-500'
                },
                {
                    name: 'Game Status',
                    points: '+2 Drops',
                    desc: 'Update the live status (Open/Taken) for Pool, Darts, or Shuffleboard. Keep the water moving.',
                    icon: Target,
                    color: 'bg-green-500/20 text-green-400'
                },
            ]
        },
        {
            category: 'Ripple Effects',
            items: [
                {
                    name: 'Social Share',
                    points: '5 Drops',
                    desc: 'Share your flow report to social channels. Spread the 98501 spirit.',
                    icon: Share2,
                    color: 'bg-pink-500/20 text-pink-400'
                }
            ]
        },
        {
            category: 'Depth Markers (Guaranteed)',
            items: [
                {
                    name: '1,000 ft: League Sticker',
                    points: 'Sticker Unlock',
                    desc: 'The mark of a true local. Slap it on your laptop or bumper.',
                    icon: Award,
                    color: 'bg-yellow-500/20 text-yellow-400'
                },
                {
                    name: '2,500 ft: The Shirt',
                    points: 'Apparel Unlock',
                    desc: 'Limited edition Season 4 Tee. Not sold in stores. Earned only.',
                    icon: ShieldCheck,
                    color: 'bg-blue-500/20 text-blue-400'
                },
                {
                    name: '5,000 ft: The Plaque',
                    points: 'Legend Status',
                    desc: 'Custom Bar Stool Plaque at your favorite HQ. "Mayor of the Well" status.',
                    icon: Crown,
                    color: 'bg-primary/20 text-primary'
                }
            ]
        },
        {
            category: 'The Secret Menu',
            items: [
                {
                    name: 'Status Unlocks',
                    points: 'Tier 3+',
                    desc: 'Residents (1k+ ft) unlock hidden menu items at partner venues. Flashing your badge flows the goods.',
                    icon: Sparkles,
                    color: 'bg-purple-500/20 text-purple-400'
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-background text-white p-6 pb-24 font-body overflow-x-hidden">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-primary mb-8 hover:opacity-80 transition-opacity uppercase font-black tracking-widest text-xs"
            >
                <ChevronLeft className="w-4 h-4" />
                Back
            </button>

            <div className="max-w-2xl mx-auto">
                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-2">
                        <Droplets className="w-6 h-6 text-primary" />
                        <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px]">Incentive Protocol</span>
                    </div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter font-league italic leading-none">
                        THE WATER <span className="text-primary block">GUIDE</span>
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-4 leading-relaxed">
                        Deepen your well with every contribution. Flow through the standings, unlock exclusive perks, and prove your dedication to the 98501.
                    </p>
                </header>

                <div className="space-y-12">
                    {activities.map((group) => (
                        <section key={group.category}>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-6 flex items-center gap-3">
                                {group.category}
                                <div className="h-px flex-1 bg-white/5" />
                            </h2>
                            <div className="grid gap-4">
                                {group.items.map((item) => (
                                    <div key={item.name} className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl group hover:border-primary/20 transition-all">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`${item.color} p-3 rounded-2xl`}>
                                                <item.icon className="w-6 h-6" />
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-black font-league text-white uppercase italic tracking-tight">{item.points}</div>
                                                <div className="text-[10px] font-black text-primary uppercase tracking-widest">Added to Well</div>
                                            </div>
                                        </div>
                                        <h3 className="font-league font-black text-lg uppercase tracking-tight text-white mb-2">{item.name}</h3>
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                <div className="mt-16 bg-primary/10 border-2 border-primary/20 p-8 rounded-[2rem] relative overflow-hidden">
                    <Waves className="absolute -right-4 -top-4 w-32 h-32 text-primary/10 -rotate-12" />
                    <h3 className="text-2xl font-black uppercase tracking-tighter font-league mb-2">Why Deepen the Well?</h3>
                    <p className="text-sm text-slate-300 font-medium mb-6 leading-relaxed">
                        Depth determines your rank in the <span className="text-primary font-bold italic">OlyBars Season Standings</span>. High-ranking Residents get first access to limited releases, exclusive League merchandise, and invitations to private Artesian parties.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {['Limited Merch', 'Event Invites', 'Early Access', 'Status'].map(tag => (
                            <span key={tag} className="bg-black/40 text-[10px] font-black uppercase tracking-widest text-primary px-3 py-1.5 rounded-full border border-primary/20">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <footer className="mt-16 pt-12 border-t border-white/5 text-center">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-loose">
                        Drop values are subject to League governance.<br />
                        Abuse of the Flow system leads to disqualification.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default PointsGuideScreen;

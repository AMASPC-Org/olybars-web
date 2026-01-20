import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, TrendingUp, Users, ShieldCheck, Sparkles } from 'lucide-react';
import { SEO } from '../../../components/common/SEO';

const OwnerPortal: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-y-auto pb-20">
            <SEO
                title="Owner Portal | OlyBars"
                description="Manage your venue, track real-time buzz, and engage with the Artesian Bar League community."
            />

            {/* Hero Section */}
            <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 grayscale" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 text-primary mb-8 hover:opacity-80 transition-opacity uppercase font-black tracking-widest text-[10px] bg-slate-900/80 px-4 py-2 rounded-full border border-white/10"
                    >
                        <ArrowLeft className="w-4 h-4" /> BACK TO LEAGUE
                    </button>

                    <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter font-league mb-4">
                        COMMAND <span className="text-primary">THE VIBE</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-300 font-medium max-w-2xl mx-auto mb-10 leading-relaxed font-body">
                        The definitive operating system for Olympia's nightlife. Grow your crowd, track your stats, and master the 98501.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/partners/claim')}
                            className="bg-primary text-black font-black uppercase tracking-widest px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(251,191,36,0.2)]"
                        >
                            Claim Your Venue
                        </button>
                        <button
                            onClick={() => window.location.href = 'mailto:ryan@amaspc.com'}
                            className="bg-white/5 border-2 border-white/10 text-white font-black uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-white/10 transition-all backdrop-blur-md"
                        >
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            icon: TrendingUp,
                            title: "Real-Time Buzz",
                            desc: "See exactly how busy your venue is compared to the rest of downtown in real-time."
                        },
                        {
                            icon: Users,
                            title: "League Engagement",
                            desc: "Connect with thousands of active League members who are looking for their next spot."
                        },
                        {
                            icon: ShieldCheck,
                            title: "LCB Compliance",
                            desc: "Our AI-powered 'Artie' helps ensure your marketing stays within state regulations."
                        }
                    ].map((feature, i) => (
                        <div key={i} className="bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl hover:border-primary/30 transition-all group">
                            <feature.icon className="w-10 h-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
                            <h3 className="text-xl font-black uppercase tracking-wide mb-3 font-league">{feature.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed font-body">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Integration Section */}
            <section className="max-w-5xl mx-auto px-6 py-24 text-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full mb-8">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Powered by Coach AI</span>
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tight font-league mb-6">
                    Marketing on <span className="text-primary italic underline decoration-2 underline-offset-8">Autopilot</span>
                </h2>
                <p className="text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed font-body">
                    Coach Schmidt isn't just a mascot. He's your 24/7 digital operations manager that drafts social posts, suggests Flash Bounties during slow hours, and keeps your venue at the top of the feed.
                </p>
                <div className="mt-12 p-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent rounded-full" />
            </section>

            {/* Final CTA */}
            <section className="max-w-4xl mx-auto px-6 pb-24">
                <div className="bg-primary p-12 rounded-[3rem] text-black text-center relative overflow-hidden group">
                    <Building2 className="absolute -right-10 -bottom-10 w-64 h-64 text-black/10 group-hover:scale-110 transition-transform duration-700" />
                    <h2 className="text-4xl font-black uppercase tracking-tight font-league mb-4 relative z-10">Start Growing Your League Attendance</h2>
                    <p className="text-black/80 font-bold max-w-xl mx-auto mb-8 relative z-10">
                        Join the 40+ venues already using OlyBars to power their nightlife operations.
                    </p>
                    <button
                        onClick={() => navigate('/partners/claim')}
                        className="bg-black text-white font-black uppercase tracking-widest px-10 py-4 rounded-2xl hover:scale-105 transition-all shadow-2xl relative z-10"
                    >
                        Get Started Now
                    </button>
                </div>
            </section>
        </div>
    );
};

export default OwnerPortal;

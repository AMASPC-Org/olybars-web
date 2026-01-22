import React, { useState, useEffect, useMemo } from 'react';
import {
    ShieldCheck, Users, Trophy, ChevronRight, Mail, ExternalLink,
    Star, Loader2, Gamepad2, MapPin, Award, Zap, Clock,
    Sparkles, Anchor, Map, Info, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Venue } from '../../../types';
import { fetchVenues } from '../../../services/venueService';
import { isVenueOpen } from '../../../utils/venueUtils';
import { SEO } from '../../../components/common/SEO';

// Assets
// import heroArena from '../../../assets/hero-arena.png';
import leagueBadge from '../../../assets/league-badge.png';
import artieCoachBg from '../../../assets/artie-coach-bg.png';
// import venuePartnerBg from '../../../assets/venue-partner-bg.png';

import { API_BASE_URL } from '../../../lib/api-config';

const AboutPage = () => {
    const navigate = useNavigate();
    const [showContact, setShowContact] = useState(false);
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [hpValue, setHpValue] = useState(''); // Honeypot
    const [loading, setLoading] = useState(false);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [fetchingVenues, setFetchingVenues] = useState(true);

    useEffect(() => {
        const loadVenues = async () => {
            try {
                const data = await fetchVenues();
                setVenues(data);
            } catch (err) {
                console.error("Failed to load venues for handbook", err);
            } finally {
                setFetchingVenues(false);
            }
        };
        loadVenues();
    }, []);

    const buzzingVenues = useMemo(() =>
        venues.filter(v => (v.status === 'buzzing' || v.status === 'packed') && v.isActive !== false).slice(0, 2),
        [venues]);

    const activeHappyHours = useMemo(() =>
        venues.filter(v => (v.deal || (v.flashBounties && v.flashBounties.length > 0)) && isVenueOpen(v)).slice(0, 3),
        [venues]);

    const handleSend = async () => {
        if (!email || !message) {
            alert("Please fill in both fields");
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'CONTACT',
                    contactEmail: email,
                    payload: { message },
                    _hp_id: hpValue // [SECURITY] Honeypot
                })
            });
            if (response.ok) {
                alert("Message Sent! Artie will get back to you soon.");
                setShowContact(false);
                setEmail('');
                setMessage('');
            } else {
                alert("Error sending message.");
            }
        } catch (e) {
            console.error(e);
            alert("Network error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-full bg-background text-white p-6 pb-24 font-body animate-in fade-in duration-500">
            <SEO
                title="About The League"
                description="OlyBars is the Nightlife Operating System for Thurston County. Join the Artesian Bar League and discover local makers."
                jsonLd={{
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "Home",
                            "item": "https://olybars.com/"
                        },
                        {
                            "@type": "ListItem",
                            "position": 2,
                            "name": "About",
                            "item": "https://olybars.com/about"
                        }
                    ]
                }}
            />
            {/* Structural SEO: Visual H1 is sometimes stylized, providing a clear reference point */}
            <h1 className="sr-only">About OlyBars & The Artesian Bar League in Thurston County</h1>
            {/* Contact Modal */}
            {showContact && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowContact(false)}>
                    <div className="bg-surface border-2 border-primary/20 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative group" onClick={e => e.stopPropagation()}>
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />

                        <h2 className="text-2xl font-black text-primary uppercase tracking-tight mb-6 font-league italic">Drop a Line</h2>

                        <div className="space-y-4 relative z-10">
                            <p className="text-sm text-slate-300 font-medium leading-relaxed mb-2">
                                Artie is usually at the tap or checking the lines, but he'll get back to you within 24 hours.
                            </p>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-500">Your Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="ryan@amaspc.com"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-primary/50"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-500">Message</label>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="What's on your mind?"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-primary/50 min-h-[100px]"
                                />
                            </div>

                            {/* Honeypot Field (Invisible to humans) */}
                            <div style={{ display: 'none' }} aria-hidden="true">
                                <input
                                    type="text"
                                    name="_hp_id"
                                    value={hpValue}
                                    onChange={(e) => setHpValue(e.target.value)}
                                    tabIndex={-1}
                                    autoComplete="off"
                                />
                            </div>

                            <button
                                onClick={handleSend}
                                disabled={loading}
                                className="block w-full bg-primary text-black font-black uppercase text-center py-4 rounded-xl text-sm tracking-widest hover:scale-[1.02] transition-transform disabled:opacity-50 flex justify-center gap-2 font-league"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {loading ? 'SENDING...' : 'SEND MESSAGE'}
                            </button>

                            <button
                                onClick={() => setShowContact(false)}
                                className="w-full text-slate-500 font-black uppercase text-[10px] tracking-widest mt-2 hover:text-white transition-colors"
                            >
                                NEVERMIND
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header / Nav Back */}
            <div className="relative z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center gap-2 text-primary/80 hover:text-primary transition-all uppercase font-black tracking-widest text-[10px]"
                >
                    <span className="text-xl">←</span>
                    <span>EXIT THE FIELD</span>
                </button>
            </div>

            {/* HERO SECTION */}
            <header className="relative mb-12 -mx-6 -mt-6">
                <div className="relative h-[35vh] md:h-[45vh] overflow-hidden">
                    <img
                        // src={heroArena}
                        src="" // TODO: Restore hero-arena.png
                        alt="The Arena - Thurston County"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

                    <div className="absolute bottom-6 left-6 right-6">
                        <button onClick={() => navigate('/glossary')} className="inline-block bg-primary text-black px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] mb-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                            <Trophy size={12} /> PLAYER'S HANDBOOK
                        </button>
                        <h1 className="text-5xl font-black uppercase tracking-tighter font-league leading-[0.9]">
                            NEVER ASK <span className="text-white block">&quot;WHERE NEXT?&quot; AGAIN.</span>
                        </h1>
                        <p className="text-sm text-primary font-bold uppercase tracking-widest mt-2 drop-shadow-lg flex items-center gap-2">
                            <Sparkles size={14} /> Happy Hours. Live Music. Real-Time Vibe Checks.
                        </p>
                    </div>
                </div>
            </header>

            <div className="space-y-16 max-w-2xl mx-auto">
                {/* Discovery Focus */}
                <section className="relative">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-[2px] w-8 bg-primary/30" />
                        <h2 className="text-primary font-black text-xs uppercase tracking-[0.3em] flex items-center gap-2">
                            <Activity size={12} /> THE SCOUT REPORT
                        </h2>
                    </div>

                    <div className="bg-surface/40 backdrop-blur-sm border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
                        <h3 className="text-white font-black text-2xl uppercase tracking-tight mb-4 font-league italic">YOUR ALL-ACCESS PASS TO THURSTON COUNTY</h3>
                        <div className="space-y-4 text-slate-300 leading-relaxed text-sm font-body">
                            <p>
                                OlyBars is the central nervous system of Thurston County. Whether you're looking for a quiet corner for a craft cocktail or a packed house for a Friday night set, we give you the live intel to make the choice.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                <div className="flex items-center gap-3 text-white font-black uppercase text-[10px] tracking-widest">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary"><Clock size={16} /></div>
                                    Active Happy Hours
                                </div>
                                <div className="flex items-center gap-3 text-white font-black uppercase text-[10px] tracking-widest">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary"><Zap size={16} /></div>
                                    Live Event Feed
                                </div>
                                <div className="flex items-center gap-3 text-white font-black uppercase text-[10px] tracking-widest">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary"><Map size={16} /></div>
                                    Verified Vibe Maps
                                </div>
                                <div className="flex items-center gap-3 text-white font-black uppercase text-[10px] tracking-widest">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary"><Users size={16} /></div>
                                    Real-Time Crowd Stats
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How The League Works */}
                <section className="space-y-8">
                    <div className="flex items-center gap-2">
                        <div className="h-[2px] w-8 bg-primary/30" />
                        <h2 className="text-primary font-black text-xs uppercase tracking-[0.3em] flex items-center gap-2">
                            <Zap size={12} /> HOW TO PLAY
                        </h2>
                    </div>

                    <div className="relative bg-slate-900 border-2 border-primary/20 p-8 rounded-[3rem] overflow-hidden group">
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-start gap-6">
                                <div className="bg-primary text-black w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0 shadow-xl font-league italic text-xl">1</div>
                                <div>
                                    <h4 className="text-white font-black text-xl uppercase font-league mb-2 flex items-center gap-2 italic">Clock In <ChevronRight size={18} className="text-primary" /></h4>
                                    <p className="text-sm text-slate-400 font-body leading-relaxed">
                                        When you arrive at a partner venue, clock in to confirm your presence. GPS verification ensures the data stays pure.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-6">
                                <div className="bg-primary text-black w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0 shadow-xl font-league italic text-xl">2</div>
                                <div>
                                    <h4 className="text-white font-black text-xl uppercase font-league mb-2 flex items-center gap-2 italic">Report the Vibe <ChevronRight size={18} className="text-primary" /></h4>
                                    <p className="text-sm text-slate-400 font-body leading-relaxed">
                                        Tell the League what the energy is. Trickle? Gushing? Flooded? Your qualitative input feeds the real-time "Pulse" for the whole city.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-6">
                                <div className="bg-primary text-black w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0 shadow-xl font-league italic text-xl">3</div>
                                <div>
                                    <h4 className="text-white font-black text-xl uppercase font-league mb-2 flex items-center gap-2 italic">Earn League Points <ChevronRight size={18} className="text-primary" /></h4>
                                    <p className="text-sm text-slate-400 font-body leading-relaxed">
                                        Your participation is the product. Level up to unlock exclusive merch and "Mayor" status at your favorite haunts.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Meet Artie */}
                <section className="relative">
                    <div className="bg-black/60 rounded-[3rem] overflow-hidden border border-white/10 relative min-h-[400px] flex flex-col justify-end p-8 group">
                        <img
                            src={artieCoachBg}
                            alt="Artie's Office"
                            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover:scale-105 transition-transform duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                        <div className="relative z-10">
                            <h2 className="text-primary font-black text-2xl uppercase tracking-tight mb-4 font-league flex items-center gap-3 italic">
                                <Gamepad2 className="w-6 h-6" /> THE COACH: ARTIE WELLS
                            </h2>
                            <div className="space-y-4 text-slate-300 leading-relaxed text-sm font-body mb-6">
                                <p>
                                    To navigate the city, you need a guide. Meet Artie Wells. Artie is our AI-powered concierge with a singular mission: ensuring you're never bored in the state capital.
                                </p>
                                <p>
                                    Need a plan? Artie knows every happy hour and live set in Olympia. Whether you're looking for pool at Hannah's or a tap takeover at Well 80, Artie has the scout report.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/meet-artie')}
                                className="w-full bg-surface text-white font-black uppercase text-xs tracking-widest py-4 rounded-2xl border border-white/10 flex items-center justify-center gap-3 hover:border-primary/50 transition-all shadow-xl font-league italic"
                            >
                                LEARN MORE ABOUT ARTIE <ChevronRight size={18} className="text-primary" />
                            </button>
                        </div>
                    </div>
                </section>

                {/* The Artesian Bar League Mission */}
                <section className="relative">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-[2px] w-8 bg-primary/30" />
                        <h2 className="text-primary font-black text-xs uppercase tracking-[0.3em] flex items-center gap-2">
                            <Anchor size={12} /> THE ARTESIAN BAR LEAGUE
                        </h2>
                    </div>
                    <div className="bg-surface/40 backdrop-blur-sm border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
                        <h3 className="text-white font-black text-2xl uppercase tracking-tight mb-4 font-league italic">REVITALIZING THROUGH COMMUNITY</h3>
                        <div className="space-y-4 text-slate-300 leading-relaxed text-sm font-body">
                            <p>
                                The <strong>Artesian Bar League</strong> was born from a simple realization: when our local venues thrive, our city comes alive. We cover independent bars across Thurston County, with the heart in Downtown Olympia.
                            </p>
                            <p className="font-bold text-white italic bg-primary/10 border-l-2 border-primary px-3 py-2">
                                We believe in the "Artesian Energy" of the 98501.
                            </p>
                            <p>
                                By gamifying attendance and creating a shared digital infrastructure, we bridge the gap between "wanting to go out" and "actually being there." Every clock-in is a vote for local business.
                            </p>
                        </div>
                    </div>
                </section>

                {/* The Three-Point Test */}
                <section className="relative">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-[2px] w-8 bg-primary/30" />
                        <h2 className="text-primary font-black text-xs uppercase tracking-[0.3em] flex items-center gap-2">
                            <Info size={12} /> WHAT MAKES A BAR?
                        </h2>
                    </div>
                    <div className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem]">
                        <h3 className="text-white font-black text-xl uppercase font-league mb-6 italic tracking-wide">THE OLYBARS MEMBERSHIP STANDARD</h3>
                        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                            OlyBars includes every licensed venue in the City of Olympia. If you are on the map, you are in the League. But to be a featured <strong>Partner Venue</strong>, a location must pass our three-point test:
                        </p>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black italic font-league">1</div>
                                <span className="text-sm text-white font-black uppercase tracking-widest">A dedicated place to sit.</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black italic font-league">2</div>
                                <span className="text-sm text-white font-black uppercase tracking-widest">Someone there to serve you.</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black italic font-league">3</div>
                                <span className="text-sm text-white font-black uppercase tracking-widest">A vibe that belongs in Oly.</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Partner Co-Op */}
                <section className="relative">
                    <div className="bg-primary/5 border border-primary/20 rounded-[3rem] overflow-hidden relative p-8">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            {/* <img src={venuePartnerBg} alt="" className="w-full h-full object-cover grayscale" /> */}
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-white font-black text-2xl uppercase tracking-tight mb-4 font-league italic">PARTNER CO-OP FOR VENUES</h2>
                            <p className="text-sm text-slate-400 font-body leading-relaxed mb-6">
                                For venue partners, the League is your fractional marketing team. We package our city as a premier destination. By driving "butts in seats" on slow Tuesdays and packing the floor for weekend shows, we ensure the 98501 stays buzzing.
                            </p>
                            <div className="flex flex-col gap-3">
                                <div className="text-[10px] font-black uppercase text-primary tracking-widest text-center mb-1 font-league italic">NO FRICTION. NO LOGIN FATIGUE. JUST RESULTS.</div>
                                <button
                                    onClick={() => {
                                        navigate('/venue-handover');
                                    }}
                                    className="bg-primary text-black font-black uppercase text-xs tracking-[0.2em] py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all font-league italic"
                                >
                                    JOIN THE LEAGUE AS A PARTNER
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA SECTION - Dual Path */}
                <section className="pt-16 border-t border-white/5 space-y-16">
                    {/* Path A: The Player */}
                    <div className="text-center">
                        <h2 className="font-league text-2xl font-black uppercase italic tracking-widest mb-4 opacity-60 italic">START YOUR SEASON</h2>
                        <button
                            onClick={() => navigate('/league')}
                            className="bg-white text-black font-black uppercase text-sm tracking-widest py-4 px-10 rounded-full hover:scale-105 transition-transform flex items-center gap-3 mx-auto shadow-xl font-league italic"
                        >
                            ASK ARTIE &quot;WHERE TO GO?&quot; <Star className="w-5 h-5 fill-primary text-primary" />
                        </button>
                    </div>

                    {/* Path B: The Partner (High Pop / Owner Conversion) */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 rounded-[3rem] blur-3xl -z-10 animate-pulse" />
                        <div className="bg-slate-900/80 backdrop-blur-md border-2 border-primary/40 rounded-[3rem] p-10 text-center relative overflow-hidden">
                            {/* Spotlight */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/30 transition-all duration-700" />

                            <div className="relative z-10 space-y-6">
                                <h2 className="text-white font-black text-3xl md:text-5xl uppercase tracking-tighter font-league italic leading-none">
                                    OWN A <span className="text-primary">VENUE?</span>
                                </h2>
                                <p className="text-sm md:text-lg text-slate-300 max-w-md mx-auto leading-relaxed font-medium">
                                    Artie has already built your profile. You just need to unlock it. Instant setup. Zero friction.
                                </p>
                                <button
                                    onClick={() => navigate('/venue-handover')}
                                    className="group relative inline-flex items-center justify-center px-10 py-5 bg-[#fbbf24] text-black font-black uppercase text-sm tracking-[0.15em] rounded-2xl transition-all hover:scale-110 shadow-[0_0_50px_-10px_rgba(251,191,36,0.8)] hover:shadow-[0_0_70px_0px_rgba(251,191,36,1)] border-b-4 border-yellow-700 active:translate-y-1 active:border-b-0 font-league italic mt-4"
                                >
                                    <Zap className="w-5 h-5 mr-2 fill-black" />
                                    CLAIM YOUR VENUE NOW
                                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                                </button>

                                <p className="text-[10px] text-primary font-black uppercase tracking-[0.4em] pt-4 opacity-80">
                                    NO LOGIN FATIGUE • JUST RESULTS
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center gap-8 pt-4">
                        <button
                            onClick={() => setShowContact(true)}
                            className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:text-white transition-colors font-league"
                        >
                            <Mail size={14} /> CONTACT THE OPS TEAM
                        </button>
                    </div>
                </section>

                {/* Footer Attribution */}
                <footer className="pt-12 pb-8 text-center">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] font-league">
                        EST. 98501 • THURSTON COUNTY • WA
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default AboutPage;

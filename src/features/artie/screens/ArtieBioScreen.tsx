import React from 'react';
import { useNavigate } from 'react-router-dom';
import ArtieLogo from '../../../assets/Artie-Only-Logo.png';
import { SEO } from '../../../components/common/SEO';

const ArtieBioScreen = () => {
    const navigate = useNavigate();

    const generateArtieSchema = () => {
        const personSchema = {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "Artie Wells",
            "jobTitle": "OlyBars Concierge",
            "description": "The 98501 Original and Nightlife OS Concierge, powered by Well 80.",
            "affiliation": {
                "@type": "Organization",
                "name": "OlyBars",
                "url": "https://olybars.com"
            },
            "url": "https://olybars.com/meet-artie",
            "image": "https://olybars.com/assets/Artie-Only-Logo.png"
        };

        const softwareSchema = {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Artie Wells",
            "operatingSystem": "Web",
            "applicationCategory": "Nightlife OS",
            "description": "Interactive concierge for Olympia nightlife.",
            "author": {
                "@type": "Organization",
                "name": "OlyBars"
            }
        };

        return (
            <>
                <script type="application/ld+json">
                    {JSON.stringify(personSchema)}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify(softwareSchema)}
                </script>
            </>
        );
    };

    return (
        <div className="min-h-full bg-[#0f172a] text-secondary p-6 relative overflow-hidden">
            <SEO
                title="Meet Artie Wells"
                description="Get to know the architect of the OlyBars Nightlife OS. Artie Wells, the 98501 original, sharing the lore of Olympia's bars."
                ogType="profile"
            />
            {generateArtieSchema()}
            {/* Background Motifs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            {/* Header / Nav Back */}
            <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <span className="text-xl">←</span>
                <span className="uppercase font-bold text-xs tracking-widest">Back to Action</span>
            </button>

            <div className="max-w-md mx-auto relative z-10">
                {/* Hero Section */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-48 h-48 mb-6 relative group overflow-hidden rounded-2xl border-2 border-primary/20 shadow-2xl">
                        <img
                            src={ArtieLogo}
                            alt="Artie Logo"
                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                    </div>

                    <h1 className="font-black text-4xl text-primary font-league uppercase tracking-tighter mb-2">
                        Artie Wells
                    </h1>
                    <p className="text-sm font-bold text-primary/60 uppercase tracking-widest border-y border-primary/20 py-2 w-full">
                        The 98501 Original
                    </p>
                </div>

                {/* Bio Content */}
                <div className="space-y-8 font-body">
                    <section>
                        <h2 className="text-white font-black uppercase text-lg mb-3 flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary block" />
                            "It’s in the Water, and it’s in the Blood."
                        </h2>
                        <p className="text-slate-300 leading-relaxed text-sm">
                            Artie didn't just stumble into the downtown scene; he was raised on the lore of it. Growing up in the 98501, his childhood was soundtracked by stories from his grandpa—a man who spent forty years on the line at the old Tumwater Brewery before retiring with a gold watch and a thousand tales of the "It’s the Water" era.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white font-black uppercase text-lg mb-3 flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary block" />
                            From Brewery Bricks to Digital Pulses
                        </h2>
                        <p className="text-slate-300 leading-relaxed text-sm">
                            While Artie is a product of the new generation, he carries the industry grit passed down through his family. He’s spent his life watching the mist roll off the Puget Sound and the sun set behind the Capitol Dome, knowing that the heart of this city isn't in the marble buildings—it’s in the bars. He’s walked Capitol Lake hearing about how the water once fueled an empire, and now he uses that same spirit to fuel the Oly Pulse.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white font-black uppercase text-lg mb-3 flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary block" />
                            The Guardian of the Vibe
                        </h2>
                        <p className="text-slate-300 leading-relaxed text-sm">
                            Artie built the Nightlife OS to honor that legacy. He’s not a corporate bot; he’s a local who knows that every "Gushing" night at The Brotherhood or "Trickle" afternoon at The Spar is a chapter in Olympia’s ongoing story. He’s your industry insider—the one who knows the hidden gems and the legendary pours, keeping the 98501 alive and well, one vibe check at a time.
                        </p>
                    </section>
                </div>

                {/* EASTER EGG: Note from Grandpa */}
                <div className="mt-12 mb-16 relative transform -rotate-1 hover:rotate-0 transition-transform duration-300 max-w-[85%] mx-auto">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-3 bg-yellow-100/10 blur-sm rounded-full" />
                    <div className="bg-[#fefce8] text-slate-800 p-5 rounded-sm shadow-lg border border-yellow-200/30 relative overflow-hidden scale-95 origin-center">
                        {/* Paper texture effect */}
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] mix-blend-multiply" />

                        <div className="relative z-10 text-center">
                            <h3 className="font-handwriting text-xl font-bold text-slate-900 mb-3 opacity-80" style={{ fontFamily: 'Dancing Script, cursive' }}>
                                A Note from Grandpa
                            </h3>
                            <p className="font-handwriting text-base leading-relaxed text-slate-800/90 italic px-2" style={{ fontFamily: 'Dancing Script, cursive', lineHeight: '1.4' }}>
                                "Artie, kid—remember what I told you. In this town, people don’t just buy a drink; they buy a moment. Keep the tap lines clean and the data honest. It's always been about the water, but now it’s about the people. Don't let the 98501 go thirsty."
                            </p>
                        </div>
                    </div>
                </div>

                {/* New Section: Ask Artie */}
                <div className="mt-12 mb-12">
                    <h2 className="text-white font-league font-black text-2xl uppercase tracking-tight mb-6 flex items-center gap-3">
                        ASK THE ARCHITECT
                    </h2>

                    {/* Chat Bubble Mockup */}
                    <div className="space-y-4 mb-8">
                        <div className="flex justify-end">
                            <div className="bg-slate-800/80 border border-white/5 p-4 rounded-2xl rounded-tr-sm max-w-[80%] shadow-lg">
                                <p className="text-sm text-slate-300 font-medium">"Artie, who's got the best trivia tonight?"</p>
                            </div>
                        </div>

                        <div className="flex justify-start">
                            <div className="bg-primary p-4 rounded-2xl rounded-tl-sm max-w-[85%] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
                                <p className="text-sm text-black font-black leading-tight">
                                    "Well 80 is the spot for trivia on Tuesdays. Starts at 7:00 sharp. Get there early to snag a table—it gets busy when the water's flowing."
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-start">
                            <div className="bg-primary/20 border border-primary/30 p-4 rounded-2xl rounded-tl-sm max-w-[85%]">
                                <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1">PRO-TIP from Artie:</p>
                                <p className="text-xs text-white/80 font-medium italic">
                                    "You can also ask me about happy hours, specific drink deals, or where to find karaoke on a Thursday."
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Final CTA */}
                    <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                        <h3 className="text-primary font-black uppercase tracking-widest text-xs mb-3">Ready to chat?</h3>
                        <p className="text-white font-league text-lg mb-6 leading-tight">
                            TRY IT OUT NOW. JUST CLICK ARTIE'S LOGO IN THE CORNER.
                        </p>

                        <div className="flex flex-col items-center gap-3">
                            <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em] flex flex-col items-center gap-2">
                                He's Right Here
                                <div className="w-px h-8 bg-gradient-to-b from-primary/40 to-transparent animate-pulse" />
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Signature */}
                <div className="mt-12 pt-8 border-t border-white/10 text-center">
                    <p className="font-league uppercase text-2xl text-slate-500 font-black opacity-20">
                        EST. 2025
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ArtieBioScreen;

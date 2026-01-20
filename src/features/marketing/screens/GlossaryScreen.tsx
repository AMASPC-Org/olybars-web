import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Search, Zap } from 'lucide-react';
import { SEO } from '../../../components/common/SEO';
import { barGames } from '../../../data/barGames';

import { glossaryTerms } from '../../../data/glossary';


const GlossaryScreen = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20">
            <SEO title="League Glossary" description="Decode the lingo of the OlyBars League." />

            {/* Header */}
            <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 py-4 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-black uppercase tracking-tighter font-league">
                    League <span className="text-primary">Glossary</span>
                </h1>
            </div>

            <div className="p-6 max-w-2xl mx-auto space-y-8">

                {/* Intro Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <BookOpen className="w-24 h-24 text-white" />
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed font-body relative z-10">
                        Welcome to the Manual. Here you'll find the official definitions for everything from
                        <span className="text-primary font-bold"> Buzz</span> to
                        <span className="text-primary font-bold"> Badges</span>.
                        Detailed knowledge of these terms is key to maximizing your reservoir level.
                    </p>
                </div>

                {/* Terms List */}
                <div className="space-y-10">
                    {glossaryTerms.map((section) => (
                        <div key={section.category}>
                            <h2 className="text-lg font-black uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-800 pb-2">
                                {section.category}
                            </h2>
                            <div className="grid gap-4">
                                {section.terms.map((item) => (
                                    <div key={item.term} className="bg-surface border border-white/5 p-4 rounded-xl hover:border-primary/30 transition-colors group">
                                        <h3 className="text-base font-black uppercase tracking-tight font-league text-primary mb-1 group-hover:text-amber-400 transition-colors">
                                            {item.term}
                                        </h3>
                                        <p className="text-sm text-slate-400 font-medium leading-normal">
                                            {item.def}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Games & Activities Section */}
                    <div className="pt-8 border-t border-white/10">
                        <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-4 rounded-lg mb-8 border-l-4 border-amber-500">
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-1 font-league">
                                Games & <span className="text-primary">Activities</span>
                            </h2>
                            <p className="text-sm text-slate-400">
                                The official OlyBars reference for competitive socializing.
                            </p>
                        </div>

                        <div className="space-y-10">
                            {barGames.map((section) => (
                                <div key={section.category}>
                                    <h2 className="text-lg font-black uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-800 pb-2">
                                        {section.category}
                                    </h2>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {section.games.map((game) => (
                                            <div key={game.name} className="bg-surface border border-white/5 p-4 rounded-xl hover:border-primary/30 transition-colors group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-base font-black uppercase tracking-tight font-league text-primary group-hover:text-amber-400 transition-colors">
                                                        {game.name}
                                                    </h3>
                                                </div>
                                                <p className="text-sm text-slate-400 font-medium leading-normal mb-3">
                                                    {game.description}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {game.tags.map(tag => (
                                                        <span key={tag} className="text-[10px] items-center px-1.5 py-0.5 rounded border border-white/10 text-slate-500 bg-black/20 uppercase tracking-wider font-bold">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-8 opacity-50">
                    <Zap className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                    <p className="text-[10px] uppercase tracking-widest text-slate-600">
                        Official League Rules & Definitions<br />v2025.1.3
                    </p>
                </div>

            </div>
        </div>
    );
};

export default GlossaryScreen;

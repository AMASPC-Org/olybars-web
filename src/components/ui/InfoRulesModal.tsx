import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, Trophy, Star, AlertTriangle, Zap, Info } from 'lucide-react';

interface InfoRulesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const InfoRulesModal: React.FC<InfoRulesModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'rules' | 'prizes'>('rules');

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-slate-900 border-2 border-primary w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(251,191,36,0.2)] flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-primary p-4 flex justify-between items-center border-b-2 border-black">
                    <div className="flex items-center gap-2">
                        <Info className="w-6 h-6 text-black" strokeWidth={3} />
                        <h2 className="font-league font-black text-xl text-black uppercase tracking-tighter">LEAGUE INTEL</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-black/10 rounded-full transition-colors text-black"
                    >
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('rules')}
                        className={`flex-1 py-3 font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'rules'
                            ? 'bg-white/5 text-primary border-b-2 border-primary'
                            : 'text-slate-500 hover:text-white'
                            }`}
                    >
                        Official Rules
                    </button>
                    <button
                        onClick={() => setActiveTab('prizes')}
                        className={`flex-1 py-3 font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'prizes'
                            ? 'bg-white/5 text-primary border-b-2 border-primary'
                            : 'text-slate-500 hover:text-white'
                            }`}
                    >
                        Season 4 Prizes
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeTab === 'rules' ? (
                        <div className="space-y-6 animate-in slide-in-from-left duration-300">
                            <div className="flex gap-4">
                                <div className="mt-1 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                    <Shield className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase text-sm tracking-wide mb-1">Code of Conduct</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">"Bartenders are Referees. Decisions are final."</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="mt-1 bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                                    <Trophy className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase text-sm tracking-wide mb-1">Scoring</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">"Max 2 Clock-Ins per 12 hours. No Ghosting (Must be physically present)."</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="mt-1 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase text-sm tracking-wide mb-1">Vibe Checks</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">"Real-time data only. Fake signals = Ban."</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="mt-1 bg-primary/10 p-2 rounded-lg border border-primary/20">
                                    <Star className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase text-sm tracking-wide mb-1">Flash Bounties</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">"Photos must be taken on-site within the 2-hour active window. Commission reserves right to reject blurry/fake photos."</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-right duration-300">
                            <div className="bg-slate-800/50 border border-white/5 p-4 rounded-xl">
                                <h3 className="font-black text-white uppercase text-xs tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-primary" /> Championship
                                </h3>
                                <ul className="space-y-3">
                                    <li className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                        <span className="text-slate-400 font-bold">1st Place</span>
                                        <span className="text-white font-black">Grand Prize (Cash + Trophy)</span>
                                    </li>
                                    <li className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                        <span className="text-slate-400 font-bold">2nd Place</span>
                                        <span className="text-white font-black">Silver Package</span>
                                    </li>
                                    <li className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400 font-bold">3rd Place</span>
                                        <span className="text-white font-black">Bronze Honors</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-slate-800/50 border border-white/5 p-4 rounded-xl">
                                <h3 className="font-black text-white uppercase text-xs tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-400" /> Milestones
                                </h3>
                                <div className="grid grid-cols-1 gap-3 text-sm">
                                    <div className="flex justify-between items-center bg-black/30 p-2 rounded-lg border border-white/5">
                                        <span className="text-primary font-black">1,000 Pts</span>
                                        <span className="text-white font-bold">League Sticker</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-black/30 p-2 rounded-lg border border-white/5">
                                        <span className="text-primary font-black">2,500 Pts</span>
                                        <span className="text-white font-bold">League Tee</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-black/30 p-2 rounded-lg border border-white/5">
                                        <span className="text-primary font-black">5,000 Pts</span>
                                        <span className="text-white font-bold">Mayor Plaque</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 p-4 rounded-xl">
                                <AlertTriangle className="w-5 h-5 text-primary shrink-0" />
                                <p className="text-xs font-bold text-primary leading-tight">
                                    "Note: Points can also be used in the Redemption Menu."
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-black/40 border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-[0.2em] py-3 rounded-xl transition-all active:scale-[0.98]"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

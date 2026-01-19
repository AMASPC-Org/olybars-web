import React from 'react';
import { createPortal } from 'react-dom';
import { Shield, X, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Venue } from '../../../types';

interface GatekeeperModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAcknowledge: () => void;
    venue: Venue;
}

export const GatekeeperModal: React.FC<GatekeeperModalProps> = ({
    isOpen,
    onClose,
    onAcknowledge,
    venue
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div
                className="relative w-full max-w-md bg-slate-900 border-2 border-primary/30 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(251,191,36,0.2)] animate-in zoom-in-95 duration-300"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-slate-400"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 space-y-6 pt-12">
                    {/* Icon Header */}
                    <div className="flex justify-center">
                        <div className="p-5 bg-primary/20 rounded-3xl border border-primary/30 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
                            <Shield className="w-10 h-10 text-primary animate-pulse" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-black text-white uppercase font-league italic tracking-wider">
                            Members Only Venue
                        </h2>
                        <div className="h-1 w-12 bg-primary mx-auto rounded-full" />
                    </div>

                    <div className="space-y-4 bg-black/40 p-6 rounded-2xl border border-white/5">
                        <p className="text-sm font-bold text-slate-200 leading-relaxed text-center">
                            This venue (<span className="text-primary italic">{venue.name}</span>) is a Private Club. You must be a current member or the guest of a member to enter.
                        </p>

                        {venue.guestPolicy && (
                            <div className="pt-4 border-t border-white/5">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 text-center">Guest Policy</p>
                                <p className="text-xs font-bold text-slate-400 text-center italic">
                                    "{venue.guestPolicy}"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-2">
                        <button
                            onClick={onAcknowledge}
                            className="w-full py-4 bg-primary text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            I am a Member / Guest
                        </button>

                        {venue.website && (
                            <a
                                href={venue.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-4 bg-slate-800 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2 border border-white/5"
                            >
                                <HelpCircle className="w-4 h-4 text-primary" />
                                How do I join?
                            </a>
                        )}

                        <button
                            onClick={onClose}
                            className="w-full py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Footer Legal */}
                <div className="bg-black/60 p-4 border-t border-white/5 text-center px-8">
                    <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest leading-normal">
                        WSLCB Compliance: Private club regulations supersede OlyBars League Rules. You must legally be allowed to enter the premises to earn points.
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};

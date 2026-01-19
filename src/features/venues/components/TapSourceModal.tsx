import React, { useState } from 'react';
import { X, Sparkles, Smartphone, Loader2, CheckCircle2, Droplets } from 'lucide-react';
import { Venue } from '../../../types';
import { GAMIFICATION_CONFIG } from '../../../config/gamification';
import { FormatCurrency } from '../../../utils/formatCurrency';

interface TapSourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    venue: Venue;
    onSubmit: (phone: string) => Promise<void>;
}

export const TapSourceModal: React.FC<TapSourceModalProps> = ({ isOpen, onClose, venue, onSubmit }) => {
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(phone);
            setIsSuccess(true);
            setTimeout(onClose, 2500);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-surface w-full max-w-sm rounded-2xl border-2 border-cyan-500 shadow-[0_0_50px_-12px_rgba(6,182,212,0.5)] p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto animate-bounce border-2 border-cyan-500">
                        <CheckCircle2 className="w-10 h-10 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter font-league italic">Source Tapped!</h2>
                        <div className="mt-2 flex items-center justify-center gap-2">
                            <span className="text-cyan-400 font-black uppercase tracking-widest text-sm">Reward Unlocked:</span>
                            <FormatCurrency amount={25} />
                        </div>
                        <p className="text-slate-400 text-xs font-medium italic mt-2">You'll get a text when {venue.name} drops a bounty.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
            <div className="bg-surface w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="bg-primary/10 p-6 text-center border-b border-primary/20 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-3 border border-primary/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                        <Sparkles className="w-7 h-7 text-primary animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-wider font-league italic">Tap The Source</h2>
                    <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-1">Don't Depend on Luck</p>
                </div>

                <div className="p-6 space-y-6">
                    <p className="text-sm text-slate-300 font-medium leading-relaxed text-center">
                        You just favorited <span className="text-white font-bold">{venue.name}</span>. <br />
                        Give us your digits, and we'll text you the moment they <span className="text-primary italic">Drop a Bounty</span>.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Mobile Number</label>
                            <div className="relative">
                                <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                                <input
                                    type="tel"
                                    placeholder="(360) 555-0123"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-primary transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-3 flex items-center gap-3">
                            <div className="bg-cyan-500/20 p-2 rounded-full">
                                <Droplets className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">Instant Reward</p>
                                <p className="text-[9px] text-cyan-100 font-bold uppercase">+25 Drops for Connecting</p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || phone.length < 10}
                            className="w-full bg-primary hover:bg-yellow-400 disabled:bg-slate-700 disabled:text-slate-500 text-black font-black py-4 rounded-xl uppercase tracking-wider font-league transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                            ) : (
                                'Confirm & Collect'
                            )}
                        </button>
                    </form>

                    <p className="text-[8px] text-slate-500 text-center uppercase tracking-wide">
                        We only text for confirmed bounties. No spam.
                    </p>
                </div>
            </div>
        </div>
    );
};

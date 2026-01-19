import React, { useState, useEffect } from 'react';
import { Smartphone, X, Check, Droplets } from 'lucide-react';
import { useToast } from '../../../components/ui/BrandedToast';
import { GAMIFICATION_CONFIG } from '../../../config/gamification';

interface TapSourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    venueName: string;
    onSuccess?: (phone: string) => void;
}

export const TapSourceModal: React.FC<TapSourceModalProps> = ({ isOpen, onClose, venueName, onSuccess }) => {
    const { showToast } = useToast();
    const [step, setStep] = useState<'ask' | 'input' | 'verify'>('ask');
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset state on open
    useEffect(() => {
        if (isOpen) setStep('ask');
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        setStep('input');
    };

    const handleSubmitPhone = async () => {
        if (phone.length < 10) {
            showToast("Enter a valid mobile number", 'error');
            return;
        }
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setStep('verify');
            // Optimistic success
            showToast("Verification code sen to " + phone, 'success');
        }, 1500);
    };

    const handleVerify = () => {
        // Mock verification
        onSuccess?.(phone);
        onClose();
        showToast("Source Tapped! Alerts Enabled.", 'success');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Background FX */}
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                {step === 'ask' && (
                    <div className="text-center space-y-6 pt-4">
                        <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto border border-cyan-500/20">
                            <Droplets className="w-8 h-8 text-cyan-400 animate-pulse" />
                        </div>

                        <div>
                            <h3 className="text-2xl font-black uppercase font-league text-white mb-2 leading-none">
                                Tap the Source
                            </h3>
                            <p className="text-sm text-slate-300 font-medium leading-relaxed max-w-[80%] mx-auto">
                                You just starred <span className="text-cyan-400 font-bold">{venueName}</span>.
                                Want a text when the {GAMIFICATION_CONFIG.CURRENCY.NAME} start flowing?
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleConfirm}
                                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-wider py-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-95"
                            >
                                Get Flash Deal Alerts
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors py-2"
                            >
                                No thanks, just keep it silent
                            </button>
                        </div>

                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                            We only text you for your Favorites.
                        </p>
                    </div>
                )}

                {step === 'input' && (
                    <div className="space-y-6 pt-4">
                        <div className="text-center">
                            <h3 className="text-xl font-black uppercase font-league text-white mb-1">
                                Secure Dispatch Line
                            </h3>
                            <p className="text-xs text-slate-400 font-bold uppercase">
                                Where should we send the alerts?
                            </p>
                        </div>

                        <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                            <input
                                type="tel"
                                autoFocus
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="(555) 000-0000"
                                className="w-full bg-black/50 border border-slate-700 focus:border-cyan-500 rounded-xl py-4 pl-12 pr-4 text-lg font-mono font-bold text-white outline-none transition-colors"
                            />
                        </div>

                        <button
                            onClick={handleSubmitPhone}
                            disabled={isSubmitting}
                            className="w-full bg-white text-black font-black uppercase tracking-wider py-4 rounded-xl shadow-xl hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Securing Line...' : 'Send Verification Code'}
                        </button>
                    </div>
                )}

                {step === 'verify' && (
                    <div className="space-y-6 pt-4 text-center">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                            <Check className="w-8 h-8 text-green-400" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-black uppercase font-league text-white mb-1">
                                Link Established
                            </h3>
                            <p className="text-xs text-slate-400 font-bold uppercase">
                                (Mock) Verification Successful
                            </p>
                        </div>
                        <button
                            onClick={handleVerify}
                            className="w-full bg-green-500 text-black font-black uppercase tracking-wider py-4 rounded-xl shadow-xl hover:bg-green-400 transition-all active:scale-95"
                        >
                            Complete Setup
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

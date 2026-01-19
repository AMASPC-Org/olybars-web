import React from 'react';
import { Lock, RefreshCw, X, MapPinOff } from 'lucide-react';

interface PermissionRecoveryViewProps {
    onCancel: () => void;
    onRetry: () => void;
}

export const PermissionRecoveryView: React.FC<PermissionRecoveryViewProps> = ({ onCancel, onRetry }) => {
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-surface w-full max-w-sm rounded-2xl border-2 border-red-900/50 shadow-[0_0_50px_-12px_rgba(239,68,68,0.2)] overflow-hidden text-center p-6 space-y-6 relative">

                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                    <MapPinOff className="w-10 h-10 text-red-400" />
                </div>

                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter font-league italic">
                        Location Blocked
                    </h2>
                    <p className="text-sm text-slate-400 font-medium mt-2 leading-relaxed px-2">
                        Your browser is blocking access to your location, so we can't verify you're at the venue.
                    </p>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-5 border border-white/5 text-left space-y-4">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">
                        How to fix this:
                    </p>

                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                            <Lock className="w-3 h-3 text-white" />
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                            Tap the <span className="text-white font-bold">Lock Icon 🔒</span> in your address bar (top left or bottom).
                        </p>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                            <span className="text-[10px] font-black text-white">2</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                            Set <strong>Location</strong> permissions to <span className="text-green-400 font-bold">'Allow'</span>.
                        </p>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                            <RefreshCw className="w-3 h-3 text-white" />
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                            Refresh the page to try again.
                        </p>
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-primary text-black font-black py-4 rounded-xl uppercase tracking-wider font-league hover:bg-yellow-400 transition-colors shadow-lg shadow-primary/10 flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" /> Refresh Page
                    </button>

                    <button
                        onClick={onCancel}
                        className="text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                    >
                        Cancel & Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
};

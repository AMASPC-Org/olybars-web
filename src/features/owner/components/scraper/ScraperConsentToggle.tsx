import React from 'react';
import { ToggleLeft, ToggleRight, ShieldCheck } from 'lucide-react';

interface ScraperConsentToggleProps {
    isEnabled: boolean;
    onToggle: (enabled: boolean) => void;
}

export const ScraperConsentToggle: React.FC<ScraperConsentToggleProps> = ({ isEnabled, onToggle }) => {
    return (
        <div className={`border rounded-2xl p-6 transition-all ${isEnabled ? 'bg-primary/5 border-primary/20' : 'bg-black/20 border-white/5'}`}>
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isEnabled ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-500'}`}>
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className={`text-sm font-black uppercase tracking-wide leading-none mb-1 ${isEnabled ? 'text-primary' : 'text-slate-400'}`}>
                            Auto-Sync Permission
                        </h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed max-w-sm">
                            Connect your digital presence. Allow Coach AI to automatically sync events, menus, and updates from your official public channels.
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => onToggle(!isEnabled)}
                    className="group"
                >
                    {isEnabled ? (
                        <div className="flex items-center gap-2 text-primary">
                            <span className="text-[10px] font-black uppercase tracking-widest">Enabled</span>
                            <ToggleRight className="w-8 h-8 fill-primary/20" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-600 group-hover:text-slate-400 transition-colors">
                            <span className="text-[10px] font-black uppercase tracking-widest">Disabled</span>
                            <ToggleLeft className="w-8 h-8" />
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
};

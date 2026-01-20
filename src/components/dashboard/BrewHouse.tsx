import React, { useState } from 'react';
import { Beer, Sparkles } from 'lucide-react';
import { VenueStatus } from '../../types/venue';

interface BrewHouseProps {
    currentStatus: VenueStatus | string;
    onStatusChange: (status: VenueStatus) => void;
    isLoading?: boolean;
}

/**
 * BrewHouse: Interactive Vibe Control for Venue Operators.
 * Features 4 distinct cards with a "glass fill" animation.
 */
export const BrewHouse: React.FC<BrewHouseProps> = ({
    currentStatus,
    onStatusChange,
    isLoading = false
}) => {
    // Local state to handle animation "optimistically"
    const [hovered, setHovered] = useState<string | null>(null);

    // Normalize current status for comparison
    const normalizedCurrent = currentStatus.toLowerCase() === 'dead' ? 'mellow' : currentStatus.toLowerCase();

    const options = [
        { id: 'mellow', label: 'Mellow', mugs: 1, color: 'slate', fill: 'bg-slate-500/20', border: 'border-slate-500/50', text: 'text-slate-400', height: 'h-[25%]' },
        { id: 'chill', label: 'Chill', mugs: 2, color: 'amber', fill: 'bg-amber-500/30', border: 'border-amber-500/50', text: 'text-amber-400', height: 'h-[50%]' },
        { id: 'buzzing', label: 'Buzzing', mugs: 3, color: 'orange', fill: 'bg-orange-500/40', border: 'border-orange-500/50', text: 'text-orange-500', height: 'h-[75%]' },
        { id: 'packed', label: 'Packed', mugs: 4, color: 'red', fill: 'bg-red-600/50', border: 'border-red-600/50', text: 'text-red-600', height: 'h-[100%]' }
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Beer size={16} />
                    Vibe Control (Write Mode)
                </h3>
                {normalizedCurrent === 'mellow' && (
                    <span className="text-[10px] bg-slate-500/10 text-slate-400 px-2 py-0.5 rounded-full border border-slate-500/20 flex items-center gap-1 animate-pulse">
                        <Sparkles size={10} />
                        PIONEER BOUNTY ACTIVE
                    </span>
                )}
            </div>

            <div className="grid grid-cols-4 gap-3">
                {options.map((opt) => {
                    const isActive = normalizedCurrent === opt.id;

                    return (
                        <button
                            key={opt.id}
                            onClick={() => onStatusChange(opt.id as VenueStatus)}
                            onMouseEnter={() => setHovered(opt.id)}
                            onMouseLeave={() => setHovered(null)}
                            disabled={isLoading}
                            className={`
                relative group overflow-hidden rounded-xl border-2 transition-all duration-300
                h-32 flex flex-col items-center justify-end p-3
                ${isActive ? `${opt.border} shadow-lg shadow-${opt.color}-500/20 scale-[1.02]` : 'border-slate-800 hover:border-slate-700 bg-slate-900/50'}
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
                        >
                            {/* Glass Fill Effect */}
                            <div
                                className={`
                  absolute bottom-0 left-0 w-full transition-all duration-700 ease-out
                  ${opt.fill}
                  ${isActive ? opt.height : 'h-0'}
                  group-hover:opacity-100
                `}
                                style={{
                                    height: isActive || hovered === opt.id ? opt.height : '0%'
                                }}
                            />

                            {/* Bubbles Animation (if active or hovered) */}
                            {(isActive || hovered === opt.id) && (
                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    {[...Array(3)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`absolute bottom-0 w-1 h-1 rounded-full bg-white/20 animate-bubble-${i}`}
                                            style={{
                                                left: `${20 + (i * 30)}%`,
                                                animationDelay: `${i * 0.5}s`
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Label & Mugs */}
                            <div className="relative z-10 w-full text-center">
                                <div className={`text-[10px] font-black uppercase tracking-tighter mb-1 transition-colors ${isActive ? opt.text : 'text-slate-500 group-hover:text-slate-300'}`}>
                                    {opt.label}
                                </div>
                                <div className="flex justify-center gap-0.5">
                                    {[...Array(opt.mugs)].map((_, i) => (
                                        <Beer
                                            key={i}
                                            size={12}
                                            className={`transition-all duration-300 ${isActive ? `${opt.text} fill-current` : 'text-slate-700'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <style>{`
        @keyframes bubble {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-40px) scale(1.5); opacity: 0; }
        }
        .animate-bubble-0 { animation: bubble 3s infinite ease-in; }
        .animate-bubble-1 { animation: bubble 2.5s infinite ease-in; }
        .animate-bubble-2 { animation: bubble 3.5s infinite ease-in; }
      `}</style>
        </div>
    );
};

export default BrewHouse;

import React from 'react';
import { Beer } from 'lucide-react';
import { VenueStatus } from '../types/venue';

interface VibeMugsProps {
    status: VenueStatus | string; // Handle potentially untyped legacy data
    className?: string;
    showText?: boolean;
    size?: number;
}

/**
 * VibeMugs: Visual representation of a venue's vibe score (1-4 mugs).
 * Implements the "Project Toast" nomenclature and the legacy DEAD->MELLOW adapter.
 */
export const VibeMugs: React.FC<VibeMugsProps> = ({
    status,
    className = "",
    showText = false,
    size = 18
}) => {
    // 1. Legacy Adapter: Normalize 'dead' to 'mellow'
    const normalizedStatus = status.toLowerCase() === 'dead' ? 'mellow' : status.toLowerCase();
    console.log('[VibeMugs] status:', status, 'normalized:', normalizedStatus);

    // 2. Define Mug Counts and Colors
    // 2. Define Mug Counts and Colors
    const config: Record<string, { count: number; color: string; label: string }> = {
        mellow: { count: 1, color: 'text-slate-400', label: 'Mellow' }, // was trickle
        chill: { count: 2, color: 'text-blue-400', label: 'Chill' },   // was flowing
        buzzing: { count: 3, color: 'text-orange-500', label: 'Buzzing' }, // was gushing
        packed: { count: 4, color: 'text-red-500', label: 'Packed' },    // was flooded
        trickle: { count: 1, color: 'text-slate-400', label: 'Mellow' }, // Legacy fallback
        flowing: { count: 2, color: 'text-blue-400', label: 'Chill' },   // Legacy fallback
        gushing: { count: 3, color: 'text-orange-500', label: 'Buzzing' }, // Legacy fallback
        flooded: { count: 4, color: 'text-red-500', label: 'Packed' },     // Legacy fallback
        dead: { count: 1, color: 'text-slate-400', label: 'Mellow' }     // Legacy fallback
    };

    const current = config[normalizedStatus] || config.trickle;

    return (
        <div className={`flex items-center gap-1 ${className}`} aria-label={`${current.label} Vibe`}>
            <div className="flex">
                {[...Array(current.count)].map((_, i) => (
                    <Beer
                        key={i}
                        size={size}
                        className={`${current.color} fill-current`}
                        strokeWidth={2.5}
                    />
                ))}
            </div>

            {showText && (
                <span className={`text-xs font-bold uppercase tracking-wider ml-1 ${current.color}`}>
                    {current.label}
                </span>
            )}
        </div>
    );
};


export default VibeMugs;

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

    // 2. Define Mug Counts and Colors
    const config: Record<string, { count: number; color: string; label: string }> = {
        mellow: { count: 1, color: 'text-slate-400', label: 'Mellow' },
        chill: { count: 2, color: 'text-amber-400', label: 'Chill' },
        buzzing: { count: 3, color: 'text-orange-500', label: 'Buzzing' },
        packed: { count: 4, color: 'text-red-600', label: 'Packed' }
    };

    const current = config[normalizedStatus] || config.mellow;

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

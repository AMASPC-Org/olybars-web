import React from "react";
import { Beer } from "lucide-react";
import { VenueStatus } from "../types/venue";

interface VibeMugsProps {
  status: VenueStatus | string; // Handle potentially untyped legacy data
  className?: string;
  showText?: boolean;
  size?: number;
}

/**
 * VibeMugs: Visual representation of a venue's vibe score (1-4 mugs).
 * Implements the "Project Toast" nomenclature (Hydrology).
 */
export const VibeMugs: React.FC<VibeMugsProps> = ({
  status,
  className = "",
  showText = false,
  size = 18,
}) => {
  // 1. Normalize status
  const raw = status.toLowerCase();
  const normalizedStatus = raw as 'trickle' | 'flowing' | 'gushing' | 'flooded';

  // 2. Define Mug Counts and Colors (LOCKED: DO NOT EDIT)
  const config: Record<
    string,
    { count: number; color: string; label: string }
  > = {
    trickle: { count: 1, color: "text-slate-400", label: "Trickle" },
    flowing: { count: 2, color: "text-blue-400", label: "Flowing" },
    gushing: { count: 3, color: "text-orange-500", label: "Gushing" },
    flooded: { count: 4, color: "text-red-500", label: "Flooded" },
  };

  const current = config[normalizedStatus] || config.trickle;

  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      aria-label={`${current.label} Vibe`}
    >
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
        <span
          className={`text-xs font-bold uppercase tracking-wider ml-1 ${current.color}`}
        >
          {current.label}
        </span>
      )}
    </div>
  );
};

export default VibeMugs;

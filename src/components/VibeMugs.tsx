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
 * Implements the "Project Toast" nomenclature and the legacy DEAD->MELLOW adapter.
 */
export const VibeMugs: React.FC<VibeMugsProps> = ({
  status,
  className = "",
  showText = false,
  size = 18,
}) => {
  // 1. Legacy Adapter: Normalize old/alias statuses to the 4 Pillars
  const raw = status.toLowerCase();
  const normalizedStatus =
    raw === "dead" || raw === "mellow"
      ? "trickle"
      : raw === "chill"
        ? "flowing"
        : raw === "buzzing" || raw === "fire" || raw === "pop"
          ? "gushing"
          : raw === "packed"
            ? "flooded"
            : raw;

  // 2. Define Mug Counts and Colors (LOCKED: DO NOT EDIT)
  const config: Record<
    string,
    { count: number; color: string; label: string }
  > = {
    trickle: { count: 1, color: "text-slate-400", label: "Trickle" },
    flowing: { count: 2, color: "text-blue-400", label: "Flowing" },
    gushing: { count: 3, color: "text-orange-500", label: "Gushing" },
    flooded: { count: 4, color: "text-red-500", label: "Flooded" },
    // Backwards compatibility for exact matches
    mellow: { count: 1, color: "text-slate-400", label: "Trickle" },
    chill: { count: 2, color: "text-blue-400", label: "Flowing" },
    buzzing: { count: 3, color: "text-orange-500", label: "Gushing" },
    packed: { count: 4, color: "text-red-500", label: "Flooded" },
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

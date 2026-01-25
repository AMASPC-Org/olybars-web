import React, { useState } from "react";
import { Venue } from "../../../types";
import { VenueOpsService } from "../../../services/VenueOpsService";
import { useToast } from "../../../components/ui/BrandedToast";
import {
  Users,
  Activity,
  Flame,
  Zap,
  Coffee,
  Droplets,
  ArrowUp,
  ArrowDown,
  Clock,
} from "lucide-react";

interface OperationsTabProps {
  venue: Venue;
}

export const OperationsTab: React.FC<OperationsTabProps> = ({ venue }) => {
  const { showToast } = useToast();
  const [isUpdatingVibe, setIsUpdatingVibe] = useState(false);
  const [isAdjustingHeadcount, setIsAdjustingHeadcount] = useState(false);

  const handleVibeUpdate = async (status: Venue["manualStatus"]) => {
    setIsUpdatingVibe(true);
    try {
      await VenueOpsService.updateVibeStatus(venue.id, status);
      showToast(`Vibe set to ${status?.toUpperCase()} for 45 mins!`, "success");
    } catch (error: any) {
      showToast("Failed to update vibe.", "error");
    } finally {
      setIsUpdatingVibe(false);
    }
  };

  const handleHeadcountAdjust = async (delta: number) => {
    setIsAdjustingHeadcount(true);
    try {
      await VenueOpsService.adjustHeadcount(venue.id, delta);
      const action = delta > 0 ? "Increased" : "Decreased";
      showToast(`${action} headcount by ${Math.abs(delta)}.`, "success");
    } catch (error: any) {
      showToast("Failed to adjust headcount.", "error");
    } finally {
      setIsAdjustingHeadcount(false);
    }
  };

  const vibeOptions = [
    {
      id: "trickle",
      label: "Trickle",
      icon: Droplets,
      color: "text-blue-400",
      bg: "bg-blue-500/20",
      border: "border-blue-500/50",
    },
    {
      id: "flowing",
      label: "Flowing",
      icon: Coffee,
      color: "text-green-400",
      bg: "bg-green-500/20",
      border: "border-green-500/50",
    },
    {
      id: "gushing",
      label: "Gushing",
      icon: Zap,
      color: "text-yellow-400",
      bg: "bg-yellow-500/20",
      border: "border-yellow-500/50",
    },
    {
      id: "flooded",
      label: "Flooded",
      icon: Flame,
      color: "text-red-500",
      bg: "bg-red-500/20",
      border: "border-red-500/50",
    },
  ] as const;

  // Calculate expiration display
  const vibeExpiresIn = venue.manualStatusExpiresAt
    ? Math.max(0, Math.ceil((venue.manualStatusExpiresAt - Date.now()) / 60000))
    : 0;
  const headcountExpiresIn = venue.manualClockInsExpiresAt
    ? Math.max(
        0,
        Math.ceil((venue.manualClockInsExpiresAt - Date.now()) / 60000),
      )
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight font-league">
          Operations Center
        </h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          Real-time Pulse Control
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Live Headcount Terminal */}
        <div className="bg-surface border border-white/10 rounded-3xl p-6 space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-50">
            <Users className="w-24 h-24 text-white/5 -rotate-12" />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wide">
                  Live Headcount
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Capacity: {venue.capacity || "N/A"}
                </p>
              </div>
            </div>
            {headcountExpiresIn > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <Clock className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-[10px] font-bold text-primary tabular-nums">
                  {headcountExpiresIn}m
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center py-4 relative z-10">
            <span className="text-6xl font-black text-white font-league tracking-tighter drop-shadow-2xl">
              {venue.headcount || 0}
            </span>
          </div>

          <div className="flex gap-4 relative z-10">
            <button
              onClick={() => handleHeadcountAdjust(-5)}
              disabled={isAdjustingHeadcount}
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/50 py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <ArrowDown className="w-5 h-5" />
              <span className="font-black text-xs uppercase tracking-widest">
                -5
              </span>
            </button>
            <button
              onClick={() => handleHeadcountAdjust(5)}
              disabled={isAdjustingHeadcount}
              className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 hover:border-green-500/50 py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <ArrowUp className="w-5 h-5" />
              <span className="font-black text-xs uppercase tracking-widest">
                +5
              </span>
            </button>
          </div>
        </div>

        {/* 2. Vibe Status Terminal */}
        <div className="bg-surface border border-white/10 rounded-3xl p-6 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-50">
            <Activity className="w-24 h-24 text-white/5 -rotate-12" />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wide">
                  Vibe Signal
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Broadcast to app
                </p>
              </div>
            </div>
            {vibeExpiresIn > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <Clock className="w-3 h-3 text-purple-400 animate-pulse" />
                <span className="text-[10px] font-bold text-purple-400 tabular-nums">
                  {vibeExpiresIn}m
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10">
            {vibeOptions.map((option) => {
              const isActive = venue.manualStatus === option.id;
              const Icon = option.icon;

              return (
                <button
                  key={option.id}
                  onClick={() => handleVibeUpdate(option.id as any)}
                  disabled={isUpdatingVibe}
                  className={`
                                        relative group p-4 rounded-xl border transition-all duration-300
                                        flex flex-col items-center gap-3
                                        ${
                                          isActive
                                            ? `${option.bg} ${option.border} shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)] scale-[1.02]`
                                            : "bg-slate-900/50 border-white/5 hover:border-white/10 hover:bg-white/5"
                                        }
                                    `}
                >
                  <Icon
                    className={`w-8 h-8 ${isActive ? option.color : "text-slate-600 group-hover:text-slate-400"} transition-colors`}
                  />
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "text-white" : "text-slate-600 group-hover:text-slate-400"} transition-colors`}
                  >
                    {option.label}
                  </span>
                  {isActive && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Helper Context */}
      <div className="bg-blue-500/5 rounded-2xl p-4 border border-blue-500/10 flex gap-4">
        <div className="p-2 bg-blue-500/10 rounded-lg h-fit text-blue-400">
          <Activity size={16} />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider">
            How this works
          </h4>
          <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
            Manual adjustments override Artie's sensors for{" "}
            <span className="text-white font-bold">45-60 minutes</span>. Use
            this when the app is under-reporting (e.g., lots of non-app users)
            or to hype up a sudden rush.
          </p>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { Activity, Radio, Cpu, Smartphone } from "lucide-react";
import { differenceInHours, formatDistanceToNow } from "date-fns";
import { cn } from "../../../../lib/utils";

interface ScraperBrainStatusProps {
  venueId: string;
}

interface AutomationStatus {
  lastSync?: number;
  syncStatus: "idle" | "running" | "error";
  activeScrapers?: number;
  totalEventsFound?: number;
  lastError?: string;
}

export const ScraperBrainStatus: React.FC<ScraperBrainStatusProps> = ({
  venueId,
}) => {
  const [value, loading, error] = useDocument(
    doc(db, `venues/${venueId}/automation/status`)
  );

  const status = (value?.data() as AutomationStatus) || {
    syncStatus: "idle",
  };

  const isRunning = status.syncStatus === "running";
  const hoursSinceSync = status.lastSync
    ? differenceInHours(Date.now(), status.lastSync)
    : 999;

  // Visual Logic
  const isHealthy = hoursSinceSync < 24;
  const isStale = hoursSinceSync >= 24 && hoursSinceSync < 48;
  const isDead = hoursSinceSync >= 48;

  const getPulseColor = () => {
    if (isRunning) return "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.7)]";
    if (isHealthy) return "bg-emerald-500/50";
    if (isStale) return "bg-amber-500/50";
    return "bg-slate-500/30";
  };

  const getStatusText = () => {
    if (isRunning) return "Schmidt is thinking...";
    if (isDead) return "Brain Dormant";
    if (isStale) return "Sync Delayed";
    return "Brain Active";
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-md transition-all hover:border-white/20">
      {/* Background Gradient */}
      <div
        className={cn(
          "absolute -right-10 -top-10 h-32 w-32 rounded-full blur-[60px] transition-all duration-1000",
          isRunning ? "bg-emerald-500/20" : "bg-blue-500/10"
        )}
      />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Icon Container */}
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 shadow-inner">
            <Cpu
              className={cn(
                "h-6 w-6 transition-colors duration-500",
                isRunning ? "text-emerald-400" : "text-slate-400"
              )}
            />
            {/* Pulse Architecture */}
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              {isRunning && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={cn(
                  "relative inline-flex h-3 w-3 rounded-full transition-all duration-500",
                  getPulseColor()
                )}
              ></span>
            </span>
          </div>

          <div>
            <h3 className="flex items-center gap-2 font-display text-lg font-medium text-white/90">
              {getStatusText()}
            </h3>
            <p className="text-sm text-white/50">
              {status.lastSync ? (
                <>
                  Last Sync:{" "}
                  <span className="text-white/70">
                    {formatDistanceToNow(status.lastSync)} ago
                  </span>
                </>
              ) : (
                "Waiting for first sync..."
              )}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="hidden items-center gap-6 sm:flex">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Coverage
            </p>
            <p className="font-mono text-lg font-bold text-white/80">
              {status.activeScrapers || 0} Sources
            </p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Events
            </p>
            <p className="font-mono text-lg font-bold text-emerald-400/80">
              {status.totalEventsFound || 0} Found
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 animate-pulse bg-white/20" />
      )}
    </div>
  );
};

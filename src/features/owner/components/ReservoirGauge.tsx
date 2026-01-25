import React from "react";
import { Venue } from "../../../types/venue";

interface ReservoirGaugeProps {
  venue: Venue;
}

export const ReservoirGauge: React.FC<ReservoirGaugeProps> = ({ venue }) => {
  const pointBank = venue.pointBank || 0;
  const pointCap = venue.pointCap || 5000;
  const percentage = Math.min(100, Math.max(0, (pointBank / pointCap) * 100));

  // Color logic
  let colorClass = "text-emerald-500";
  let strokeColor = "stroke-emerald-500"; // Need specific stroke color for SVG if not using currentColor text inheritance properly or just distinct

  if (pointBank < 500) {
    colorClass = "text-red-500";
    strokeColor = "stroke-red-500";
  } else if (pointBank < 1000) {
    colorClass = "text-amber-400";
    strokeColor = "stroke-amber-400";
  }

  // SVG parameters
  const size = 180;
  const center = size / 2;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-xl relative overflow-hidden">
      {/* Ambient Glow */}
      <div
        className={`absolute inset-0 opacity-10 blur-3xl rounded-full pointer-events-none ${pointBank < 500 ? "bg-red-900" : "bg-emerald-900"}`}
      />

      <h3 className="text-sm font-display font-bold text-white mb-6 z-10 tracking-wide uppercase opacity-80">
        Reservoir Level
      </h3>

      <div className="relative z-10" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-slate-800"
          />
          {/* Progress Arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${colorClass} transition-all duration-1000 ease-out`}
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-3xl font-bold ${colorClass} font-mono tracking-tighter`}
          >
            {pointBank.toLocaleString()}
          </span>
          <div className="h-px w-12 bg-slate-700 my-1"></div>
          <span className="text-slate-500 text-xs font-semibold">
            CAP {pointCap.toLocaleString()}
          </span>
        </div>
      </div>

      {pointBank < 500 ? (
        <div className="mt-6 px-4 py-2 bg-red-950/30 border border-red-500/30 rounded-lg animate-pulse z-10 flex items-center gap-2">
          <span className="text-red-500 text-lg">⚠</span>
          <p className="text-red-400 text-xs font-bold uppercase tracking-wide">
            Fuel Critical
          </p>
        </div>
      ) : (
        <div className="mt-6 px-4 py-2 rounded-lg z-10 min-h-[42px]">
          <p className="text-emerald-500/50 text-xs font-medium uppercase tracking-wide text-center">
            System Nominal
          </p>
        </div>
      )}
    </div>
  );
};

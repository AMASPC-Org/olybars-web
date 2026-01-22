import React from 'react';
import { Sparkles, Bell } from 'lucide-react';
import { VenueStatus } from '../../../types';

interface VibeFallbackBannerProps {
  originalVibe: VenueStatus;
  fallbackVibe: VenueStatus;
  onNotifyPress: () => void;
}

export const VibeFallbackBanner: React.FC<VibeFallbackBannerProps> = ({ originalVibe, fallbackVibe, onNotifyPress }) => {
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="mx-4 mb-4 p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-full shrink-0">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-200">
            No '{capitalize(originalVibe)}' spots right now.
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Showing some great <strong>{capitalize(fallbackVibe)}</strong> spots nearby instead.
          </p>
        </div>
      </div>

      <button
        onClick={onNotifyPress}
        className="shrink-0 flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary-300 text-xs font-bold rounded-lg transition-all active:scale-95 border border-primary/20 group"
      >
        <Bell className="w-3.5 h-3.5 group-hover:swing" />
        <span>Notify me when {capitalize(originalVibe)}</span>
      </button>
    </div>
  );
};

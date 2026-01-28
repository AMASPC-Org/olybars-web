
import React from 'react';
import { Sparkles, Map, RefreshCw } from 'lucide-react';

interface PremiumEmptyStateProps {
  message?: string;
  onClearFilters?: () => void;
  onViewMap?: () => void;
}

export const PremiumEmptyState: React.FC<PremiumEmptyStateProps> = ({
  message = "No spots found in this vibe.",
  onClearFilters,
  onViewMap
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6 bg-surface/30 rounded-3xl border-2 border-dashed border-slate-800/50 backdrop-blur-sm">
      {/* Illustration Composition */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
        <div className="relative bg-slate-900 p-4 rounded-2xl border border-white/10 shadow-2xl transform rotate-3">
          <Sparkles className="w-12 h-12 text-primary animate-pulse" />
        </div>
      </div>

      <div className="space-y-2 max-w-xs mx-auto">
        <h3 className="text-xl font-black text-white font-league uppercase italic tracking-wide">
          It's Quiet... Too Quiet.
        </h3>
        <p className="text-slate-500 font-bold text-sm">
          {message}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all active:scale-95 border border-white/5"
          >
            <RefreshCw size={14} />
            Clear Filters
          </button>
        )}
        {onViewMap && (
          <button
            onClick={onViewMap}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-black rounded-xl font-bold uppercase tracking-wider text-xs transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            <Map size={14} />
            View Map
          </button>
        )}
      </div>
    </div>
  );
};

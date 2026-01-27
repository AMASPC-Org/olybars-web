
import React from 'react';
import { Skeleton } from "../../../components/ui/Skeleton";

export const VenueCardSkeleton = () => {
  return (
    <div className="bg-surface border-2 border-slate-700/50 rounded-3xl p-6 space-y-4">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-2/3">
          {/* Title & Badge */}
          <div className="flex items-center gap-2">
            <Skeleton variant="text" width="60%" height={32} className="bg-slate-700/50" />
            <Skeleton variant="rect" width={40} height={16} className="rounded bg-slate-700/50" />
          </div>
          {/* Rating & Vibe */}
          <Skeleton variant="text" width="40%" height={16} className="bg-slate-700/50" />
        </div>

        {/* Right Status */}
        <div className="flex flex-col items-end gap-2">
          <Skeleton variant="circle" width={14} height={14} className="bg-slate-700/50" />
          <Skeleton variant="rect" width={60} height={20} className="rounded-full bg-slate-700/50" />
        </div>
      </div>

      {/* Gallery / Deal Area (Main Content) */}
      <Skeleton variant="rect" height={200} className="w-full rounded-2xl bg-slate-800/50" />

      {/* Footer Actions */}
      <div className="flex gap-2 pt-2">
        <Skeleton variant="rect" width="100%" height={48} className="rounded-xl flex-1 bg-slate-700/50" />
        <Skeleton variant="rect" width="100%" height={48} className="rounded-xl flex-1 bg-slate-700/50" />
      </div>
    </div>
  );
};

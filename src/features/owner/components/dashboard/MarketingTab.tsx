import React, { useState, useEffect } from "react";
import { Zap, Camera } from "lucide-react";
import { Venue, UserProfile } from "../../../../types";
import { FormatCurrency } from "../../../../utils/formatCurrency";
import { ArtieManagerBriefing } from "../ArtieManagerBriefing";
import { GalleryManager } from "../GalleryManager";
import { useToast } from "../../../../components/ui/BrandedToast";
import { VenueOpsService } from "../../../../services/VenueOpsService";

interface MarketingTabProps {
  venue: Venue;
  updateVenue: (venueId: string, updates: Partial<Venue>) => Promise<void>;
  userProfile: UserProfile;
  privateData: any; // Passed from parent to avoid re-fetching
}

export const MarketingTab = ({
  venue,
  updateVenue,
  userProfile,
  privateData,
}: MarketingTabProps) => {
  const [statsPeriod, setStatsPeriod] = useState<
    "day" | "week" | "month" | "year"
  >("week");
  const [activityStats, setActivityStats] = useState({
    earned: 0,
    redeemed: 0,
    activeUsers: 0,
  });
  const { showToast } = useToast();

  useEffect(() => {
    fetchStats();
  }, [statsPeriod, venue.id]);

  const fetchStats = async () => {
    const { fetchActivityStats } =
      await import("../../../../services/userService");
    const stats = await fetchActivityStats(venue.id, statsPeriod);
    setActivityStats(stats);
  };

  const handleArtieActionApproved = async (insight: any) => {
    try {
      // 1. Execute the skill
      if (insight.actionSkill === "update_flash_deal") {
        await VenueOpsService.updateFlashBounty(venue.id, {
          title: insight.actionParams.summary as string,
          description: insight.actionParams.details as string,
          duration: parseInt(insight.actionParams.duration as string) || 60,
          isActive: true,
        });
      }

      // 2. Deduct points (using privateData passed from parent or fallback)
      const currentBank =
        privateData?.pointBank !== undefined
          ? privateData.pointBank
          : venue.pointBank || 5000;
      const deduction = insight.pointCost || 500;
      const newBank = Math.max(0, currentBank - deduction);

      // 3. Update secure private data
      await VenueOpsService.updatePrivateData(venue.id, {
        pointBank: newBank,
      });

      showToast(
        `${insight.actionLabel.toUpperCase()} - BANK UPDATED`,
        "success",
      );
    } catch (e) {
      console.error("Failed to execute Artie action:", e);
      showToast("ACTION FAILED", "error");
    }
  };

  return (
    <div className="space-y-10">
      {/* Artie Pro Briefing (Hero Section) */}
      <ArtieManagerBriefing
        venue={venue}
        onActionApproved={handleArtieActionApproved}
      />

      {/* Points Reporting Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h3 className="text-2xl font-black text-white uppercase font-league leading-none">
              DROPS ANALYSIS
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">
              Revenue & Engagement metrics
            </p>
          </div>
          <div className="flex bg-black p-1 rounded-lg border border-white/10 w-full sm:w-auto overflow-x-auto no-scrollbar">
            {["day", "week", "month", "year"].map((p) => (
              <button
                key={p}
                onClick={() => setStatsPeriod(p as any)}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${statsPeriod === p ? "bg-primary text-black" : "text-slate-500"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-surface p-4 border border-white/10 rounded-xl">
            <p className="text-[9px] font-black text-slate-500 uppercase font-league mb-1">
              Earned
            </p>
            <FormatCurrency
              amount={activityStats.earned}
              className="text-xl sm:text-2xl"
            />
          </div>
          <div className="bg-surface p-4 border border-white/10 rounded-xl">
            <p className="text-[9px] font-black text-slate-500 uppercase font-league mb-1">
              Redeemed
            </p>
            <FormatCurrency
              amount={-activityStats.redeemed}
              className="text-xl sm:text-2xl"
              variant="warning"
            />
          </div>
          <div className="bg-surface p-4 border border-white/10 rounded-xl">
            <p className="text-[9px] font-black text-slate-500 uppercase font-league mb-1">
              Active
            </p>
            <p className="text-xl sm:text-2xl font-black text-white font-league">
              {activityStats.activeUsers}
            </p>
          </div>
          <div className="bg-primary/5 p-4 border border-primary/20 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-1 opacity-20">
              <Zap className="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
            </div>
            <p className="text-[9px] font-black text-primary uppercase font-league mb-1">
              Reservoir
            </p>
            <FormatCurrency
              amount={
                privateData?.pointBank !== undefined
                  ? privateData.pointBank
                  : venue.pointBank || 5000
              }
              className="text-xl sm:text-2xl"
              hideSign
            />
          </div>
        </div>
      </section>

      {/* Photo Curation Section - Handled by GalleryManager */}
      <GalleryManager
        venue={venue}
        updateVenue={updateVenue}
        userUid={userProfile.uid}
      />
    </div>
  );
};

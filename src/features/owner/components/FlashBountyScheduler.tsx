import React, { useState, useEffect } from "react";
import { Venue, ScheduledDeal } from "../../../types";
import { VenueOpsService } from "../../../services/VenueOpsService";
import { useToast } from "../../../components/ui/BrandedToast";
import { Zap, Shield, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { db } from "../../../lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

interface FlashBountySchedulerProps {
  venue: Venue;
}

export const FlashBountyScheduler: React.FC<FlashBountySchedulerProps> = ({
  venue,
}) => {
  const { showToast } = useToast();
  const [dealText, setDealText] = useState("");
  const [dealDescription, setDealDescription] = useState(""); // Not used in UI but in payload?
  const [dealTaskDescription, setDealTaskDescription] = useState("");
  const [dealDuration, setDealDuration] = useState(60);
  const [dealCategory, setDealCategory] = useState<"food" | "drink" | "other">(
    "drink",
  );
  const [targetDate, setTargetDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [targetTime, setTargetTime] = useState(format(new Date(), "HH:00"));
  const [staffConfirmed, setStaffConfirmed] = useState(false);
  const [scheduledDeals, setScheduledDeals] = useState<ScheduledDeal[]>([]);
  const [isLoadingDeals, setIsLoadingDeals] = useState(false);

  useEffect(() => {
    if (venue) {
      fetchScheduledDeals();
    }
  }, [venue.id]);

  const fetchScheduledDeals = async () => {
    setIsLoadingDeals(true);
    try {
      const q = query(
        collection(db, "venues", venue.id, "scheduledDeals"),
        orderBy("startTime", "asc"),
      );
      const snapshot = await getDocs(q);
      const deals = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as ScheduledDeal,
      );
      setScheduledDeals(deals);
    } catch (e) {
      console.error("Failed to fetch scheduled deals:", e);
    } finally {
      setIsLoadingDeals(false);
    }
  };

  const handleScheduleDeal = async () => {
    if (!dealText) return;
    if (!staffConfirmed) {
      showToast("PLEASE CONFIRM STAFF BRIEFING FIRST", "error");
      return;
    }

    const start = parseISO(`${targetDate}T${targetTime}`);

    try {
      // 1. Validate
      const validation = await VenueOpsService.validateSlot(
        venue,
        start.getTime(),
        dealDuration,
      );
      if (!validation.valid) {
        showToast(validation.reason || "INVALID SLOT", "error");
        return;
      }

      // 2. Schedule
      await VenueOpsService.scheduleFlashBounty(venue.id, {
        venueId: venue.id,
        title: dealText,
        description: dealDescription || dealText,
        bounty_task_description: dealTaskDescription,
        startTime: start.getTime(),
        endTime: start.getTime() + dealDuration * 60 * 1000,
        durationMinutes: dealDuration,
        category: dealCategory,
        status: "PENDING",
        staffBriefingConfirmed: true,
        createdBy: "MANUAL",
        createdAt: Date.now(),
      });

      showToast("FLASH BOUNTY SCHEDULED SUCCESSFULLY", "success");
      setDealText("");
      setDealDescription("");
      setDealTaskDescription("");
      setStaffConfirmed(false);
      fetchScheduledDeals();
    } catch (e: any) {
      showToast(e.message || "FAILED TO SCHEDULE BOUNTY", "error");
    }
  };

  const handleCancelScheduledDeal = async (dealId: string) => {
    if (!dealId) return;
    try {
      const dealRef = doc(db, "venues", venue.id, "scheduledDeals", dealId);
      await updateDoc(dealRef, { status: "CANCELLED" });
      showToast("DEAL CANCELLED", "success");
      fetchScheduledDeals();
    } catch (e) {
      showToast("FAILED TO CANCEL DEAL", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Schedule New Deal Widget */}
      <div className="bg-surface p-6 border border-white/10 border-dashed rounded-lg shadow-2xl relative">
        <div className="absolute -top-4 left-6 bg-[#0f172a] border border-primary px-3 py-1 flex items-center gap-2 rounded-md">
          <Zap className="w-4 h-4 text-primary fill-current" />
          <span className="text-primary text-[10px] font-black uppercase tracking-widest font-league">
            SCHEDULE FLASH BOUNTY
          </span>
        </div>

        <div className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Deal Title
            </label>
            <input
              type="text"
              value={dealText}
              onChange={(e) => setDealText(e.target.value)}
              placeholder="EX: $5 DRAFTS..."
              className="w-full bg-black border border-white/10 rounded-lg p-4 text-primary font-black placeholder:text-slate-900 outline-none font-league"
            />
          </div>

          <div className="space-y-1.5 font-league">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Bounty Category
            </label>
            <div className="flex gap-2">
              {(["drink", "food", "other"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setDealCategory(cat)}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${dealCategory === cat ? "bg-primary text-black border-primary shadow-[2px_2px_0px_0px_#fff]" : "bg-black text-slate-600 border-white/5 hover:border-white/20"}`}
                >
                  {cat === "drink"
                    ? "🍺 Drink bounty"
                    : cat === "food"
                      ? "🍔 Food bounty"
                      : "⚡ Other"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white font-bold outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Start Time
              </label>
              <input
                type="time"
                value={targetTime}
                step="900"
                onChange={(e) => setTargetTime(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white font-bold outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Duration
              </label>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest font-league">
                {dealDuration} Minutes
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="180"
              step="30"
              value={dealDuration}
              onChange={(e) => setDealDuration(parseInt(e.target.value))}
              className="w-full accent-primary h-4 bg-black rounded-lg appearance-none cursor-pointer border border-white/20 hover:border-primary/50 transition-colors"
            />
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Bounty Verification Task
              </label>
              <input
                type="text"
                value={dealTaskDescription}
                onChange={(e) => setDealTaskDescription(e.target.value)}
                placeholder="e.g. Take a photo of your receipt"
                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white font-bold outline-none placeholder:text-slate-700"
              />
              <p className="text-[8px] text-slate-500 italic ml-1">
                Fallback: 'Upload a photo of your purchase'
              </p>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-[8px] text-slate-700 font-bold">30M</span>
              <span className="text-[8px] text-slate-700 font-bold">
                3H (CAP)
              </span>
            </div>
          </div>

          <button
            onClick={() => setStaffConfirmed(!staffConfirmed)}
            className={`w-full p-4 rounded-lg border flex items-center gap-3 transition-all ${staffConfirmed ? "bg-green-500/10 border-green-500/50 text-green-500" : "bg-black border-red-500/20 text-slate-500"}`}
          >
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center ${staffConfirmed ? "bg-green-500 border-green-500" : "border-slate-700"}`}
            >
              {staffConfirmed && (
                <Shield className="w-3 h-3 text-black fill-current" />
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest font-league">
              Staff Briefing Confirmed (PIT Rule)
            </span>
          </button>

          <button
            onClick={handleScheduleDeal}
            disabled={!dealText || !staffConfirmed}
            className="w-full bg-primary text-black font-black py-4 rounded-lg uppercase tracking-widest text-lg font-league shadow-lg shadow-primary/10 disabled:opacity-30 active:scale-[0.98] transition-all"
          >
            Schedule Deal (-1 Token)
          </button>
        </div>
      </div>

      {/* Upcoming Scheduled Deals List */}
      {scheduledDeals.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Upcoming Schedule
          </h4>
          <div className="space-y-3">
            {scheduledDeals
              .filter((d) => d.status === "PENDING")
              .map((deal) => (
                <div
                  key={deal.id}
                  className="bg-surface p-4 border border-white/5 rounded-xl flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-black p-3 rounded-lg border border-white/5 flex flex-col items-center min-w-[60px]">
                      <span className="text-[8px] font-black text-primary uppercase font-league">
                        {format(new Date(deal.startTime), "MMM d")}
                      </span>
                      <span className="text-sm font-black text-white font-league">
                        {format(new Date(deal.startTime), "h:mm a")}
                      </span>
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-white uppercase font-league leading-none">
                        {deal.title}
                      </h5>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-widest">
                        {deal.durationMinutes}M Duration • {deal.createdBy}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      deal.id && handleCancelScheduledDeal(deal.id)
                    }
                    className="p-2 text-slate-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

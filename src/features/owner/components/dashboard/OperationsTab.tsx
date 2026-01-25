import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../../../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import {
  Clock,
  ShoppingBag,
  Gamepad2,
  Minus,
  Plus,
  Zap,
  Shield,
  X,
  ChevronRight,
  Calculator,
  Activity,
} from "lucide-react";
import { Venue, UserProfile, ScheduledDeal } from "../../../../types";
import { format, addHours, parseISO } from "date-fns";
import { useToast } from "../../../../components/ui/BrandedToast";
import { BrewHouse } from "../../../../components/dashboard/BrewHouse";
import { VenueOpsService } from "../../../../services/VenueOpsService";
import { getGameTTL } from "../../../../config/gameConfig";

interface OperationsTabProps {
  venue: Venue;
  updateVenue: (venueId: string, updates: Partial<Venue>) => Promise<void>;
  setDashboardView: (view: any) => void;
  isLoadingPrivate?: boolean;
  userProfile: UserProfile; // Added for context if needed, though mostly for logic in other tabs
}

export default function OperationsTab({
  venue,
  updateVenue,
  setDashboardView,
  isLoadingPrivate = false,
}: OperationsTabProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Local State for Deal Management
  const [dealText, setDealText] = useState("");
  const [dealDescription, setDealDescription] = useState("");
  const [dealTaskDescription, setDealTaskDescription] = useState("");
  const [dealDuration, setDealDuration] = useState(60);
  const [dealCategory, setDealCategory] = useState<"food" | "drink" | "other">(
    "drink",
  );
  const [targetDate, setTargetDate] = useState(
    format(addHours(new Date(), 3), "yyyy-MM-dd"),
  );
  const [targetTime, setTargetTime] = useState(
    format(addHours(new Date(), 3), "HH:00"),
  );
  const [staffConfirmed, setStaffConfirmed] = useState(false);
  const [scheduledDeals, setScheduledDeals] = useState<ScheduledDeal[]>([]);

  useEffect(() => {
    fetchScheduledDeals();
  }, [venue.id]);

  const fetchScheduledDeals = async () => {
    try {
      const { collection, getDocs, orderBy, query } =
        await import("firebase/firestore");
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
    }
  };

  const handleScheduleDeal = async () => {
    if (!dealText || !venue) return;
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
        description: dealDescription,
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
    if (!venue || !dealId) return;
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const dealRef = doc(db, "venues", venue.id, "scheduledDeals", dealId);

      await updateDoc(dealRef, { status: "CANCELLED" });
      showToast("DEAL CANCELLED", "success");
      fetchScheduledDeals();
    } catch (e) {
      showToast("FAILED TO CANCEL DEAL", "error");
    }
  };

  const adjustClockIns = (delta: number) => {
    const newCount = Math.max(0, (venue.clockIns || 0) + delta);
    updateVenue(venue.id, {
      clockIns: newCount,
      manualClockIns: newCount,
      manualClockInsExpiresAt: Date.now() + 60 * 60 * 1000, // 60m TTL
    });
  };

  const setManualVibe = (status: any) => {
    updateVenue(venue.id, {
      status,
      manualStatus: status,
      manualStatusExpiresAt: Date.now() + 45 * 60 * 1000, // 45m TTL
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface p-4 border border-white/10 rounded-lg shadow-xl shrink-0">
          <p className="text-[10px] uppercase font-black text-slate-500 mb-1 font-league">
            Live Clock-ins
          </p>
          <p className="text-4xl font-black text-white font-league">
            {venue.clockIns || 0}
          </p>
        </div>
        <div className="bg-surface p-6 border border-white/10 rounded-lg shadow-xl">
          <BrewHouse
            currentStatus={venue.status || "trickle"}
            onStatusChange={setManualVibe}
            isLoading={isLoadingPrivate}
          />
        </div>
      </div>

      {/* Happy Hour Quick Action */}
      <button
        onClick={() => {
          setDashboardView("listing");
          // Timeout handled in parent if we were passing refs, but simple timeout works for lazy loaded tab if it mounts fast enough?
          // Actually, navigation between tabs might unmount this component.
          // The "scrollIntoView" logic is tricky if the target tab isn't mounted yet.
          // For now, we just switch view. The user can scroll.
          setTimeout(() => {
            const element = document.getElementById("happy-hour-editor");
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            }
          }, 500); // Increased timeout to allow lazy load
        }}
        className="w-full bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-lg p-4 flex items-center justify-between group active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="p-2 bg-primary/20 rounded text-primary">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white">
              RECURRING HAPPY HOUR
            </p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
              Update daily deals & Buzz Clock text
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => {
            setDashboardView("listing");
            setTimeout(() => {
              const element = document.getElementById("hours-section");
              if (element) element.scrollIntoView({ behavior: "smooth" });
            }, 500);
          }}
          className="w-full bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 rounded-lg p-4 flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="p-2 bg-blue-500/20 rounded text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white">
                UPDATE HOURS
              </p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                Manage standard & seasonal operating hours
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => {
            setDashboardView("listing");
            setTimeout(() => {
              const element = document.getElementById("fulfillment-section");
              if (element) element.scrollIntoView({ behavior: "smooth" });
            }, 500);
          }}
          className="w-full bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 rounded-lg p-4 flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="p-2 bg-green-500/20 rounded text-green-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white">
                LINKS & FULFILLMENT
              </p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                Reservations, Ticketing, & External URLs
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-green-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Live Game Status Management */}
      {venue.hasGameVibeCheckEnabled && (
        <div className="bg-surface p-6 border border-white/10 rounded-lg shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Gamepad2 className="w-5 h-5 text-purple-400" />
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-league">
              Live Game Status
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {venue.gameFeatures?.map((feature) => {
              const statusData = venue.liveGameStatus?.[feature.id];
              const isTaken =
                statusData?.status === "taken" &&
                (!statusData?.expiresAt || Date.now() < statusData.expiresAt);

              return (
                <div
                  key={feature.id}
                  className="bg-black/40 p-3 rounded-lg flex items-center justify-between border border-white/5"
                >
                  <span className="text-xs font-bold text-slate-300 uppercase">
                    {feature.name}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        updateVenue(venue.id, {
                          liveGameStatus: {
                            ...venue.liveGameStatus,
                            [feature.id]: {
                              status: "open",
                              timestamp: Date.now(),
                              reportedBy: "owner",
                            },
                          },
                        })
                      }
                      className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-all ${!isTaken ? "bg-green-500 text-black" : "bg-white/5 text-slate-500 hover:text-white"}`}
                    >
                      Open
                    </button>
                    <button
                      onClick={() => {
                        const ttl = getGameTTL(feature.id);
                        updateVenue(venue.id, {
                          liveGameStatus: {
                            ...venue.liveGameStatus,
                            [feature.id]: {
                              status: "taken",
                              timestamp: Date.now(),
                              reportedBy: "owner",
                              expiresAt: Date.now() + ttl * 60 * 1000,
                            },
                          },
                        });
                      }}
                      className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-all ${isTaken ? "bg-red-500 text-white" : "bg-white/5 text-slate-500 hover:text-white"}`}
                    >
                      Taken
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Override Console */}
      <div className="bg-surface p-6 border border-white/10 rounded-lg shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-league">
            Manual Headcount Adjust
          </h3>
          {venue.manualClockInsExpiresAt &&
            Date.now() < venue.manualClockInsExpiresAt && (
              <span className="text-[8px] font-black text-primary uppercase animate-pulse">
                Override Active (
                {Math.ceil(
                  (venue.manualClockInsExpiresAt - Date.now()) / 60000,
                )}
                m)
              </span>
            )}
        </div>
        <div className="flex items-center justify-between max-w-xs mx-auto mb-6">
          <button
            onClick={() => adjustClockIns(-1)}
            className="w-16 h-16 flex items-center justify-center bg-black border border-white/10 text-white rounded-xl active:scale-95 transition-transform"
          >
            <Minus className="w-8 h-8" />
          </button>
          <p className="text-6xl font-black text-white font-league tabular-nums">
            {venue.clockIns || 0}
          </p>
          <button
            onClick={() => adjustClockIns(1)}
            className="w-16 h-16 flex items-center justify-center bg-primary text-black rounded-xl active:scale-95 transition-transform"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>

        {/* Capacity Configuration */}
        <div className="bg-black/40 p-3 rounded-lg border border-white/5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-league">
              Venue Capacity
            </p>
            <p className="text-[9px] text-slate-600 font-bold">
              Denominator for Density Physics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={venue.capacity || 50}
              onChange={(e) =>
                updateVenue(venue.id, {
                  capacity: parseInt(e.target.value) || 50,
                })
              }
              className="w-16 bg-slate-900 border border-slate-700 text-white font-bold text-center rounded py-1 outline-none focus:border-primary"
            />
            <span className="text-[10px] font-black text-slate-500 uppercase">
              MAX
            </span>
          </div>
        </div>
      </div>

      {/* Flash Bounty Management Section */}
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
                className="w-full accent-primary h-1.5 bg-black rounded-lg appearance-none cursor-pointer"
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

      <div className="mt-8 pt-8 border-t border-white/5 flex justify-center pb-8">
        <button
          onClick={() => {
            // onClose(); // We can't close from here directly if we want to navigate. but simple navigate works.
            // Actually parent handles modal, so navigation should just work and unmount this.
            navigate("/security");
          }}
          className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors group"
        >
          <Shield className="w-4 h-4 group-hover:text-primary transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-widest font-league group-hover:text-primary transition-colors">
            Partner Security & Data Protection
          </span>
        </button>
      </div>
    </>
  );
}

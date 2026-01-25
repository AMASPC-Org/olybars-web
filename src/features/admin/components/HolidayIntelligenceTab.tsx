import React, { useState, useEffect } from "react";
import {
  Calendar,
  Sparkles,
  Check,
  X,
  Search,
  Zap,
  CloudSun,
  ChevronRight,
  Plus,
  Trash2,
  Info,
  Clock,
} from "lucide-react";
import { DiscoveredHoliday } from "../../../types/context_system";
import { CalendarAdminService } from "../../../services/CalendarAdminService";
import { useToast } from "../../../components/ui/BrandedToast";

export const HolidayIntelligenceTab: React.FC = () => {
  const [holidays, setHolidays] = useState<DiscoveredHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const data = await CalendarAdminService.getPendingHolidays();
      setHolidays(data);
    } catch (e) {
      showToast("Failed to load discovery queue", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const handlePromote = async (holiday: DiscoveredHoliday) => {
    setProcessingId(holiday.id);
    try {
      await CalendarAdminService.promoteHoliday(holiday, holiday.suggestedTags);
      showToast(`Promoted ${holiday.name} to live calendar!`, "success");
      setHolidays((prev) => prev.filter((h) => h.id !== holiday.id));
    } catch (e) {
      showToast("Promotion failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleIgnore = async (id: string) => {
    setProcessingId(id);
    try {
      await CalendarAdminService.ignoreHoliday(id);
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      showToast("Holiday ignored", "info");
    } catch (e) {
      showToast("Action failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Scanning Chronolayer...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight italic flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Calendar Intelligence
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
            Moderated Ingestion Pipeline (API to OlyBars Live)
          </p>
        </div>
        <button
          onClick={loadHolidays}
          className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
        >
          Refresh Queue
        </button>
      </div>

      {holidays.length === 0 ? (
        <div className="py-24 text-center bg-slate-900/20 border border-dashed border-white/5 rounded-3xl">
          <Sparkles className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-500 uppercase">
            Discovery Queue Empty
          </h3>
          <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-2 pr-4 pl-4 max-w-md mx-auto">
            All discovered holidays have been triaged. Trigger a new API sync to
            find more proactive opportunities.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {holidays.map((holiday) => (
            <div
              key={holiday.id}
              className={`bg-slate-900/40 border rounded-2xl overflow-hidden transition-all duration-300 ${expandedId === holiday.id ? "border-primary ring-1 ring-primary/20" : "border-white/5 hover:border-white/10"}`}
            >
              <div
                className="p-5 flex items-center justify-between cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === holiday.id ? null : holiday.id)
                }
              >
                <div className="flex items-center gap-4">
                  <div className="bg-black border border-white/10 p-2.5 rounded-xl text-primary">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase italic">
                      {holiday.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black text-primary uppercase">
                        {holiday.date}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {holiday.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleIgnore(holiday.id);
                    }}
                    disabled={processingId === holiday.id}
                    className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePromote(holiday);
                    }}
                    disabled={processingId === holiday.id}
                    className="bg-primary text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/10"
                  >
                    Promote
                  </button>
                  <ChevronRight
                    className={`w-5 h-5 text-slate-600 transition-transform ${expandedId === holiday.id ? "rotate-90" : ""}`}
                  />
                </div>
              </div>

              {expandedId === holiday.id && (
                <div className="px-5 pb-5 pt-2 border-t border-white/5 bg-black/20 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                        AI Discovery Metadata
                      </h5>
                      <p className="text-xs text-slate-400 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5 italic">
                        "
                        {holiday.description ||
                          "No description available for this event."}
                        "
                      </p>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {holiday.suggestedTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-widest"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-3 bg-slate-800/50 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <CloudSun className="w-3 h-3 text-slate-400" />
                          <span className="text-[9px] font-black text-white uppercase">
                            Weather Sensitivity
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-none">
                          Standard Thresholds (Indoor/Safe)
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button className="flex-1 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                          Edit Tags
                        </button>
                        <button className="flex-1 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                          Set Weather
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

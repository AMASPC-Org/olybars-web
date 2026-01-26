import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  ClipboardList,
  Target,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Venue, VenueInsight } from "../../../types";
import { API_BASE_URL } from "../../../lib/api-config";

interface SchmidtManagerBriefingProps {
  venue: Venue;
  onActionApproved: (insight: VenueInsight) => Promise<void>;
}

export const SchmidtManagerBriefing: React.FC<SchmidtManagerBriefingProps> = ({
  venue,
  onActionApproved,
}) => {
  const [insights, setInsights] = useState<VenueInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchInsights();
  }, [venue.id]);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${API_BASE_URL}/venues/${venue.id}/insights`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      setInsights(data);
    } catch (error) {
      console.error("Failed to fetch Coach insights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (insight: VenueInsight) => {
    setIsProcessing(insight.message);
    try {
      await onActionApproved(insight);
      setInsights((prev) => prev.filter((i) => i.message !== insight.message));
    } finally {
      setIsProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-surface border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 animate-pulse">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-primary animate-spin" />
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-league text-center">
          Schmidt is analyzing the field...
        </p>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="bg-[#0f172a] border border-green-500/20 rounded-2xl p-6 flex items-center gap-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <ShieldCheck className="w-24 h-24 text-green-500" />
        </div>
        <div className="bg-green-500/10 p-3 rounded-xl border border-green-500/20 z-10">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <div className="z-10">
          <h4 className="text-sm font-black text-white uppercase font-league tracking-wide">
            All Systems Nominal
          </h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
            Schmidt has no new plays for you right now. Keep generic vibe high.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <ClipboardList className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-black text-white italic uppercase font-league tracking-tighter">
          SCHMIDT <span className="text-primary">PRO BRIEFING</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className="bg-[#0B1120] border border-primary/30 rounded-xl p-0 shadow-2xl relative overflow-hidden flex flex-col h-full group transition-all hover:border-primary/50"
          >
            {/* Header Stripe */}
            <div className="h-1 w-full bg-gradient-to-r from-primary via-blue-400 to-primary/50" />

            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-primary/10 px-2 py-1 rounded border border-primary/20 flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-primary" />
                  <span className="text-[8px] font-black text-primary uppercase tracking-widest font-league">
                    STRATEGIC PLAY
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${insight.potentialImpact === "HIGH" ? "bg-green-900/40 text-green-400 border-green-500/30" : "bg-amber-900/40 text-amber-500 border-amber-500/30"}`}
                >
                  {insight.potentialImpact} IMPACT
                </span>
              </div>

              <p className="text-sm font-bold text-white leading-relaxed font-mono flex-1 border-l-2 border-white/10 pl-3 mb-4">
                "{insight.message}"
              </p>

              <div className="bg-black/40 rounded-lg p-3 border border-white/5 mb-4">
                <div className="flex justify-between items-center text-[10px] font-league uppercase">
                  <span className="text-slate-500 font-black">Cost</span>
                  <span className="text-primary font-black">
                    {insight.pointCost || 500} PTS
                  </span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-primary w-2/3 shadow-[0_0_10px_#38bdf8]" />
                </div>
              </div>

              <button
                onClick={() => handleApprove(insight)}
                disabled={!!isProcessing}
                className="w-full bg-primary hover:bg-primary/90 text-[#0B1120] font-black py-4 rounded-lg uppercase tracking-widest text-xs font-league shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
              >
                {isProcessing === insight.message ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {insight.actionLabel}
                    <ArrowRight
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                      strokeWidth={3}
                    />
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

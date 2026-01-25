import React, { useState } from "react";
import { Venue } from "../../../types/venue";

interface RefillSettingsProps {
  venue: Venue;
  onUpdate: (data: Partial<Venue>) => Promise<void>;
}

export const RefillSettings: React.FC<RefillSettingsProps> = ({
  venue,
  onUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(1000);
  // Local state for the mock toggle since we don't have the field in schema yet
  const [autoRefill, setAutoRefill] = useState(false);

  const handleManualRefill = async () => {
    setLoading(true);
    try {
      // Dev Mode: Simple addition to the bank
      const newTotal = (venue.pointBank || 0) + amount;
      // Ensure we don't exceed cap (default 5000)
      const cap = venue.pointCap || 5000;

      await onUpdate({
        pointBank: Math.min(newTotal, cap),
      });
    } catch (err) {
      console.error("Refill failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Refill Operations</h3>
          <p className="text-slate-400 text-xs mt-1">
            Manage point acquisition and automation.
          </p>
        </div>
        <div className="bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
          <span className="text-purple-400 text-[10px] font-bold uppercase tracking-wider">
            Simulated
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Auto-Refill Toggle */}
        <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800">
          <div className="flex flex-col">
            <span className="text-slate-200 text-sm font-medium">
              Auto-Refill
            </span>
            <span className="text-slate-500 text-[10px]">
              Purchase points when &lt; 10%
            </span>
          </div>
          <button
            onClick={() => setAutoRefill(!autoRefill)}
            className={`w-10 h-5 rounded-full transition-colors relative ${autoRefill ? "bg-emerald-500" : "bg-slate-700"}`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${autoRefill ? "left-5.5" : "left-0.5"}`}
              style={{ left: autoRefill ? "22px" : "2px" }}
            />
          </button>
        </div>

        {/* Manual Refill */}
        <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
          <div className="flex flex-col mb-3">
            <span className="text-slate-200 text-sm font-medium">
              Manual Injection
            </span>
            <span className="text-slate-500 text-[10px]">
              Add points existing reservoir.
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {[500, 1000, 2500].map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt)}
                className={`py-1.5 text-xs font-medium rounded transition-all ${
                  amount === amt
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                +{amt}
              </button>
            ))}
          </div>

          <button
            disabled={loading}
            onClick={handleManualRefill}
            className="w-full py-2 bg-slate-200 hover:bg-white text-slate-900 font-bold rounded shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-wide"
          >
            {loading ? "Processing..." : `Inject Points`}
          </button>
        </div>
      </div>
    </div>
  );
};

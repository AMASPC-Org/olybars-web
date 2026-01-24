import React from "react";
import { Clock } from "lucide-react";
import { SHORT_DAYS } from "../../../utils/dayUtils";

interface HoursEditorProps {
  hours?: { [key: string]: { open: string; close: string } } | string;
  onChange: (hours: { [key: string]: { open: string; close: string } }) => void;
}

export const HoursEditor: React.FC<HoursEditorProps> = ({
  hours,
  onChange,
}) => {
  // Initialize structured hours if it's a string or missing
  const structuredHours = React.useMemo(() => {
    if (typeof hours === "object" && hours !== null && !Array.isArray(hours)) {
      return hours;
    }

    // Default empty structure
    const def: { [key: string]: { open: string; close: string } } = {};
    SHORT_DAYS.forEach((day) => {
      def[day.toLowerCase()] = { open: "11:00", close: "02:00" };
    });
    return def;
  }, [hours]);

  const handleTimeChange = (
    day: string,
    type: "open" | "close",
    value: string,
  ) => {
    const newHours = { ...structuredHours };
    newHours[day.toLowerCase()] = {
      ...newHours[day.toLowerCase()],
      [type]: value || "00:00",
    };
    onChange(newHours);
  };

  const handleToggleClosed = (day: string) => {
    const dayKey = day.toLowerCase();
    const newHours = { ...structuredHours };
    if (newHours[dayKey].open === "CLOSED") {
      newHours[dayKey] = { open: "11:00", close: "02:00" };
    } else {
      newHours[dayKey] = { open: "CLOSED", close: "CLOSED" };
    }
    onChange(newHours);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {SHORT_DAYS.map((day) => {
        const dayKey = day.toLowerCase();
        const config = structuredHours[dayKey] || {
          open: "11:00",
          close: "02:00",
        };
        const isClosed = config.open === "CLOSED";

        return (
          <div
            key={day}
            className="flex items-center justify-between bg-black/40 border border-white/5 p-4 rounded-2xl group hover:border-primary/20 transition-all shadow-inner"
          >
            <div className="flex items-center gap-4 flex-1">
              <button
                type="button"
                onClick={() => handleToggleClosed(day)}
                className={`w-10 text-[10px] font-black uppercase tracking-widest transition-colors ${isClosed ? "text-red-500" : "text-slate-400 group-hover:text-primary"}`}
              >
                {day}
              </button>

              {!isClosed ? (
                <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                  <input
                    type="time"
                    value={config.open}
                    onChange={(e) =>
                      handleTimeChange(dayKey, "open", e.target.value)
                    }
                    className="bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-primary/50 outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-600 font-black uppercase tracking-tighter">
                    to
                  </span>
                  <input
                    type="time"
                    value={config.close}
                    onChange={(e) =>
                      handleTimeChange(dayKey, "close", e.target.value)
                    }
                    className="bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-primary/50 outline-none font-mono"
                  />
                </div>
              ) : (
                <div className="flex-1 text-center animate-in fade-in slide-in-from-left-2 duration-200">
                  <span className="text-[10px] font-black text-red-500/50 uppercase tracking-[0.2em] italic">
                    Closed
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleToggleClosed(day)}
              className={`ml-2 p-1.5 rounded-lg transition-colors ${isClosed ? "bg-red-500/10 text-red-500" : "bg-slate-800/50 text-slate-500 hover:text-white"}`}
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

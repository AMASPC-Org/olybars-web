import React, { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarStripProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
  className?: string;
}

export const CalendarStrip: React.FC<CalendarStripProps> = ({
  selectedDate,
  onSelectDate,
  className = "",
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate next 14 days
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const handleSelect = (date: Date) => {
    if (selectedDate && isSameDay(selectedDate, date)) {
      onSelectDate(null); // Deselect
    } else {
      onSelectDate(date);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Scroll Buttons (Desktop) */}
      <button
        onClick={() =>
          scrollRef.current?.scrollBy({ left: -200, behavior: "smooth" })
        }
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() =>
          scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" })
        }
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
      >
        <ChevronRight size={20} />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {days.map((date, index) => {
          const isSelected = selectedDate && isSameDay(selectedDate, date);
          const isToday = isSameDay(new Date(), date);

          return (
            <button
              key={index}
              onClick={() => handleSelect(date)}
              className={`flex flex-col items-center justify-center min-w-[4.5rem] h-20 rounded-2xl border transition-all duration-200 shrink-0 ${
                isSelected
                  ? "bg-primary border-primary text-black shadow-[0_0_15px_-3px_rgba(251,191,36,0.4)] transform scale-105"
                  : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-black/70" : "text-slate-500"}`}
              >
                {isToday
                  ? "Today"
                  : date.toLocaleDateString("en-US", { weekday: "short" })}
              </span>
              <span
                className={`text-2xl font-black font-league ${isSelected ? "text-black" : "text-white"}`}
              >
                {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { formatToAMPM } from '../../utils/timeUtils';
import { SHORT_DAYS, getShortDay, FULL_DAYS } from '../../utils/dayUtils';

interface HoursCardProps {
  hours?: string | { [key: string]: { open: string; close: string } };
  isOpen: boolean;
  nextOpenText?: string; // Optional: "Opens at 4 PM"
}

export const HoursCard: React.FC<HoursCardProps> = ({ hours, isOpen }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse hours if it's a string from Google (Monday: ...\nTuesday: ...)
  let hoursMap: Record<string, string> = {};

  const now = new Date();
  const todayFull = FULL_DAYS[now.getDay()];
  const todayShort = SHORT_DAYS[now.getDay()];

  let todayHours = hours ? (typeof hours === 'string' ? "Check details" : "Hours loaded") : "Hours Pending Sync";

  if (hours) {
    if (typeof hours === 'string') {
      const lines = hours.split('\n');
      lines.forEach(line => {
        const [day, time] = line.split(': ');
        if (day && time) {
          const normalizedDay = getShortDay(day);
          hoursMap[normalizedDay] = time;
          if (normalizedDay === todayShort) todayHours = time;
        }
      });
    } else {
      // Handle structured object (Legacy OlyBars format)
      Object.entries(hours).forEach(([day, range]) => {
        const normalizedDay = getShortDay(day);
        const dayLabel = FULL_DAYS[SHORT_DAYS.indexOf(normalizedDay)] || normalizedDay;
        hoursMap[dayLabel] = `${formatToAMPM(range.open)} - ${formatToAMPM(range.close)}`;
        if (normalizedDay === todayShort) todayHours = hoursMap[dayLabel];
      });
    }
  }

  return (
    <div
      className="bg-surface border border-white/5 rounded-2xl overflow-hidden shadow-lg cursor-pointer group hover:border-white/10 transition-colors"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl relative ${isOpen ? 'bg-green-500/10 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'bg-slate-700/30 text-slate-400'}`}>
            <Clock className="w-5 h-5" />
            {isOpen && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
            )}
          </div>
          <div>
            <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-0.5 ${isOpen ? 'text-green-400' : 'text-slate-500'}`}>
              {isOpen ? 'Open Now' : 'Closed'}
            </h4>
            <p className="text-sm font-bold text-white uppercase font-mono tracking-tight">
              {todayHours}
            </p>
          </div>
        </div>
        {isExpanded ?
          <ChevronUp className="w-4 h-4 text-slate-500" /> :
          <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
        }
      </div>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
          <div className="border-t border-white/5 pt-3 space-y-2">
            {Object.entries(hoursMap).map(([day, time]) => {
              const isToday = day === todayShort || day === todayFull;
              return (
                <div key={day} className={`flex justify-between text-xs font-medium ${isToday ? 'text-primary font-bold' : 'text-slate-400'}`}>
                  <span>{day}</span>
                  <span>{time}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

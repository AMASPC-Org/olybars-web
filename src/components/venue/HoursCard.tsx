import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { formatToAMPM } from '../../utils/timeUtils';

interface HoursCardProps {
  hours?: string | { [key: string]: { open: string; close: string } };
  isOpen: boolean;
  nextOpenText?: string; // Optional: "Opens at 4 PM"
}

export const HoursCard: React.FC<HoursCardProps> = ({ hours, isOpen }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!hours) return null;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // Parse hours if it's a string from Google (Monday: ...\nTuesday: ...)
  let hoursMap: Record<string, string> = {};
  let todayHours = "Check details";

  if (typeof hours === 'string') {
    const lines = hours.split('\n');
    lines.forEach(line => {
      const [day, time] = line.split(': ');
      if (day && time) {
        hoursMap[day] = time;
        if (day === today) todayHours = time;
      }
    });
  } else {
    // Handle structured object (Legacy OlyBars format)
    Object.entries(hours).forEach(([day, range]) => {
      hoursMap[day] = `${formatToAMPM(range.open)} - ${formatToAMPM(range.close)}`;
      if (day === today) todayHours = hoursMap[day];
    });
  }

  return (
    <div
      className="bg-surface border border-white/5 rounded-2xl overflow-hidden shadow-lg cursor-pointer group hover:border-white/10 transition-colors"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isOpen ? 'bg-green-500/10 text-green-400' : 'bg-slate-700/30 text-slate-400'}`}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">
              {isOpen ? 'Open Now' : 'Closed'}
            </h4>
            <p className="text-sm font-bold text-white">
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
            {Object.entries(hoursMap).map(([day, time]) => (
              <div key={day} className={`flex justify-between text-xs font-medium ${day === today ? 'text-primary font-bold' : 'text-slate-400'}`}>
                <span>{day}</span>
                <span>{time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

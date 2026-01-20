import React from 'react';
import { Clock } from 'lucide-react';

// Theme: Cyber-Noir / Graphic Novel
// Colors: Amber/Gold (#fbbf24), Warm Orange (#ffaa00), Black (#000), White (#fff)

export const ActionButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', children, ...props }) => (
  <button
    className={`bg-bar-gold text-black font-['Bangers'] tracking-wider text-xl px-6 py-3 border-2 border-black shadow-[4px_4px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const BarCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 ${className}`}>
    {children}
  </div>
);

export const VibeTag: React.FC<{ label: string }> = ({ label }) => (
  <span className="inline-block bg-black text-white font-['Roboto_Condensed'] text-xs uppercase font-bold px-2 py-1 border border-white/20 transform -skew-x-12 mr-2">
    {label}
  </span>
);

export const HeatIndicator: React.FC<{ level: 'mellow' | 'chill' | 'buzzing' | 'packed' }> = ({ level }) => {
  const config = {
    'mellow': { icon: '🍵', text: 'Mellow', color: 'bg-slate-900/30 text-slate-400' },
    'chill': { icon: '🧊', text: 'Chill', color: 'bg-blue-200 text-black' },
    'buzzing': { icon: '🔥', text: 'Buzzing', color: 'bg-red-500 text-white animate-pulse' },
    'packed': { icon: '⚡', text: 'Packed', color: 'bg-pink-500 text-white animate-pulse' }
  };

  const { icon, text, color } = config[level];

  return (
    <div className={`flex items-center space-x-1 ${color} border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_#000]`}>
      <span className="text-lg">{icon}</span>
      <span className="text-xs font-['Bangers'] tracking-wider">{text}</span>
    </div>
  );
};

export const BuzzClockBadge: React.FC<{ endTime: Date }> = ({ endTime }) => {
  const diff = Math.max(0, Math.floor((endTime.getTime() - new Date().getTime()) / 60000));
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;

  return (
    <div className="flex items-center space-x-1 bg-[#ffaa00] text-black border border-black font-bold text-xs px-2 py-1 shadow-[2px_2px_0px_0px_#000]">
      <Clock size={12} strokeWidth={3} />
      <span className="font-['Roboto_Condensed']">{hours > 0 ? `${hours}h ` : ''}{mins}m left</span>
    </div>
  );
};

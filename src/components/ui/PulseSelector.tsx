import React from 'react';
import { Flame, Waves } from 'lucide-react';

interface PulseSelectorProps {
    onSelect: (vibe: 'buzzing' | 'chill') => void;
    currentVibe?: string;
}

export const PulseSelector: React.FC<PulseSelectorProps> = ({ onSelect, currentVibe }) => {
    return (
        <div className="flex gap-4 p-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl">
            <button
                onClick={() => onSelect('buzzing')}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${currentVibe === 'buzzing' ? 'bg-primary text-black scale-105' : 'hover:bg-white/5 text-slate-400'
                    }`}
            >
                <Flame className={currentVibe === 'buzzing' ? 'animate-pulse' : ''} size={20} strokeWidth={3} />
                <span className="text-[8px] font-black uppercase tracking-widest">Buzzing</span>
            </button>

            <button
                onClick={() => onSelect('chill')}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${currentVibe === 'chill' ? 'bg-slate-700 text-white scale-105' : 'hover:bg-white/5 text-slate-400'
                    }`}
            >
                <Waves size={20} strokeWidth={3} />
                <span className="text-[8px] font-black uppercase tracking-widest">Chill</span>
            </button>
        </div>
    );
};

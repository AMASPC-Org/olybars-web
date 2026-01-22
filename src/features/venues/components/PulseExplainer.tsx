import { Flame, Users, Zap, Clock, Star, Info, MapPin, Droplets, Waves } from 'lucide-react'; // Added Droplets, Waves
import { PULSE_CONFIG } from '../../../config/pulse';

export const PulseExplainer: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header section explains the overall goal */}
// ... (skipping unchanged parts) ...
            {/* Status Thresholds */}
            <section className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-600 pl-1">Thresholds</h3>
                <div className="space-y-3">
                    {[
                        { label: 'Flooded', icon: Zap, color: 'text-red-500', score: `> ${PULSE_CONFIG.THRESHOLDS.FLOODED * 100}% Full`, meaning: PULSE_CONFIG.DESCRIPTIONS.FLOODED_MEANING },
                        { label: 'Gushing', icon: Flame, color: 'text-orange-500', score: `> ${PULSE_CONFIG.THRESHOLDS.GUSHING * 100}% Full`, meaning: PULSE_CONFIG.DESCRIPTIONS.GUSHING_MEANING },
                        { label: 'Flowing', icon: Waves, color: 'text-blue-500', score: `> ${PULSE_CONFIG.THRESHOLDS.FLOWING * 100}% Full`, meaning: PULSE_CONFIG.DESCRIPTIONS.FLOWING_MEANING },
                        { label: 'Trickle', icon: Droplets, color: 'text-emerald-400', score: `Base State`, meaning: PULSE_CONFIG.DESCRIPTIONS.TRICKLE_MEANING },
                    ].map((status) => (
                        <div key={status.label} className="flex items-center justify-between p-4 bg-surface border border-white/10 rounded-2xl group hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-3">
                                <status.icon className={`w-5 h-5 ${status.color}`} />
                                <div>
                                    <span className="text-xs font-black uppercase tracking-tight text-white mb-0.5 block">{status.label}</span>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase leading-none">{status.meaning}</p>
                                </div>
                            </div>
                            <span className="font-league font-black text-primary italic uppercase tracking-tighter">{status.score}</span>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex gap-3">
                <Info className="w-5 h-5 text-primary shrink-0" />
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
                    Rules are strictly enforced by the WA State LCB Compliance Layer. Clock-ins are limited to 2 per 12-hour window.
                </p>
            </footer>
        </div>
    );
};

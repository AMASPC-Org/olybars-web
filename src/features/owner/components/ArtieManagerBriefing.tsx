import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Zap, HelpCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Venue, VenueInsight } from '../../../types';
import { API_BASE_URL } from '../../../lib/api-config';

interface ArtieManagerBriefingProps {
    venue: Venue;
    onActionApproved: (insight: VenueInsight) => Promise<void>;
}

// Renamed component for internal consistency, but kept filename for now
export const ArtieManagerBriefing: React.FC<ArtieManagerBriefingProps> = ({ venue, onActionApproved }) => {
    const [insights, setInsights] = useState<VenueInsight[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchInsights();
    }, [venue.id]);

    const fetchInsights = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/venues/${venue.id}/insights`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setInsights(data);
        } catch (error) {
            console.error('Failed to fetch Coach insights:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (insight: VenueInsight) => {
        setIsProcessing(insight.message);
        try {
            await onActionApproved(insight);
            // Optionally remove the insight from the list after approval
            setInsights(prev => prev.filter(i => i.message !== insight.message));
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
                    Coach is analyzing your traffic...
                </p>
            </div>
        );
    }

    if (insights.length === 0) return null;

    return (
        <div className="space-y-4">
            {insights.map((insight, idx) => (
                <div key={idx} className="bg-surface border border-primary/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all duration-700" />

                    <div className="flex gap-4 items-start relative">
                        <div className="bg-primary/10 p-3 rounded-xl border border-primary/20 shrink-0">
                            {insight.type === 'YIELD_BOOST' ? (
                                <Zap className="w-6 h-6 text-primary fill-current" />
                            ) : (
                                <TrendingUp className="w-6 h-6 text-primary" />
                            )}
                        </div>

                        <div className="flex-1 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest font-league">Coach Pro Briefing</h4>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${insight.potentialImpact === 'HIGH' ? 'bg-green-500/20 text-green-500' :
                                        insight.potentialImpact === 'MEDIUM' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-500/20 text-slate-500'
                                        }`}>
                                        {insight.potentialImpact} IMPACT
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm font-bold text-white leading-relaxed italic">
                                "{insight.message}"
                            </p>

                            <div className="flex items-center gap-6 pt-2">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-500 uppercase">Investment</span>
                                    <span className="text-xs font-black text-primary font-league">{insight.pointCost || 500} DROPS</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-500 uppercase">Reservoir</span>
                                    <span className="text-xs font-black text-white font-league">{venue.pointBank || 5000} AVAIL</span>
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    onClick={() => handleApprove(insight)}
                                    disabled={!!isProcessing}
                                    className="flex-1 bg-primary text-black font-black py-3 rounded-xl uppercase tracking-widest text-[10px] font-league shadow-lg shadow-primary/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {isProcessing === insight.message ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                                    ) : (
                                        <>
                                            {insight.actionLabel}
                                            <ArrowRight className="w-3 h-3" strokeWidth={3} />
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setInsights(prev => prev.filter(i => i.message !== insight.message))}
                                    className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer Tag */}
                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center bg-black/20 -mx-6 -mb-6 px-6 py-3">
                        <div className="flex items-center gap-2">
                            <HelpCircle className="w-3 h-3 text-slate-600" />
                            <span className="text-[8px] font-bold text-slate-600 uppercase">Powered by Well 80 Yield Engine</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

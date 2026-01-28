import React from 'react';
import { Globe, Trash2, AlertTriangle, CheckCircle, Loader2, Calendar, BookOpen, Wine, Share2, Mail } from 'lucide-react';
import { ScraperSource } from '../../../../types/venue';

interface ConnectSourceCardProps {
    source: ScraperSource;
    onDelete: (id: string) => void;
    onToggle: (id: string, enabled: boolean) => void;
}

export const ConnectSourceCard: React.FC<ConnectSourceCardProps> = ({ source, onDelete, onToggle }) => {
    const getStatusIcon = () => {
        switch (source.status) {
            case 'active': return <CheckCircle className="w-3 h-3 text-green-500" />;
            case 'error': return <AlertTriangle className="w-3 h-3 text-red-500" />;
            case 'pending': return <Loader2 className="w-3 h-3 text-primary animate-spin" />;
            default: return null;
        }
    };

    const getTargetIcon = () => {
        switch (source.target) {
            case 'MENU': return <BookOpen className="w-4 h-4 text-primary" />;
            case 'DRINKS': return <Wine className="w-4 h-4 text-primary" />;
            case 'CALENDAR':
            case 'EVENTS': return <Calendar className="w-4 h-4 text-primary" />;
            case 'SOCIAL_FEED': return <Share2 className="w-4 h-4 text-primary" />;
            case 'NEWSLETTER': return <Mail className="w-4 h-4 text-primary" />;
            default: return <Globe className="w-4 h-4 text-primary" />;
        }
    };

    return (
        <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-3 group transition-all hover:border-white/10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                        {getTargetIcon()}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                {source.target.replace('_', ' ')}
                            </span>
                            {getStatusIcon()}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate max-w-[180px] font-mono mt-0.5">
                            {source.url}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onToggle(source.id, !source.isEnabled)}
                        className={`text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-lg transition-colors ${source.isEnabled
                            ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                            : 'bg-slate-800 text-slate-500 hover:text-white font-bold'
                            }`}
                    >
                        {source.isEnabled ? 'Active' : 'Paused'}
                    </button>
                    <button
                        onClick={() => onDelete(source.id)}
                        className="p-3 text-slate-600 hover:text-red-500 transition-colors bg-white/5 rounded-lg hover:bg-red-500/10"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {source.extractionNotes && (
                <div className="bg-black/40 border border-white/5 rounded-lg p-2.5">
                    <p className="text-[9px] text-slate-400 font-medium italic leading-relaxed">
                        <span className="text-primary/70 not-italic font-black uppercase tracking-widest mr-1">Rules:</span>
                        "{source.extractionNotes}"
                    </p>
                </div>
            )}

            {source.status === 'error' && source.errorMsg && (
                <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/10 rounded-lg p-2">
                    <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-[9px] text-red-400 font-bold uppercase tracking-wide leading-tight">{source.errorMsg}</p>
                </div>
            )}
        </div>
    );
};

import React from 'react';
import { Globe, Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { ScraperSource } from '../../../../types/venue';

interface ConnectSourceCardProps {
    source: ScraperSource;
    onDelete: (id: string) => void;
    onToggle: (id: string, enabled: boolean) => void;
}

export const ConnectSourceCard: React.FC<ConnectSourceCardProps> = ({ source, onDelete, onToggle }) => {
    const getIcon = () => {
        switch (source.status) {
            case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case 'pending': return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
            default: return <Globe className="w-4 h-4 text-slate-500" />;
        }
    };

    const getStatusText = () => {
        if (source.status === 'error') return 'Connection Error';
        if (source.status === 'pending') return 'Syncing...';
        return 'Active';
    };

    return (
        <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center justify-between group">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                    {getIcon()}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                            {source.target}
                        </span>
                        {source.status === 'error' && (
                            <span className="text-[9px] text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 font-black uppercase tracking-widest">
                                Failed
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate max-w-[200px] font-mono">
                        {source.url}
                    </p>
                    {source.status === 'error' && source.errorMsg && (
                        <p className="text-[9px] text-red-400 mt-1">{source.errorMsg}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={() => onToggle(source.id, !source.isEnabled)}
                    className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded transition-colors ${source.isEnabled
                            ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                            : 'bg-slate-800 text-slate-500 hover:text-white'
                        }`}
                >
                    {source.isEnabled ? 'ON' : 'OFF'}
                </button>
                <button
                    onClick={() => onDelete(source.id)}
                    className="p-2 text-slate-600 hover:text-red-500 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

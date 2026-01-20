import React, { useState } from 'react';
import { X, Globe, Plus, AlertCircle } from 'lucide-react';
import { ScrapeTarget } from '../../../../types/venue';

interface AddSourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (url: string, target: ScrapeTarget) => void;
    existingUrls: string[];
}

export const AddSourceModal: React.FC<AddSourceModalProps> = ({ isOpen, onClose, onAdd, existingUrls }) => {
    const [url, setUrl] = useState('');
    const [target, setTarget] = useState<ScrapeTarget>('EVENTS');
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation 1: URL Format
        let cleanUrl = url.trim();
        if (!cleanUrl.startsWith('http')) {
            cleanUrl = 'https://' + cleanUrl;
        }

        try {
            new URL(cleanUrl);
        } catch (e) {
            setError('Please enter a valid URL (e.g. https://instagram.com/...)');
            return;
        }

        // Validation 2: Duplication
        if (existingUrls.includes(cleanUrl)) {
            setError('This URL is already connected.');
            return;
        }

        // Validation 3: Limit
        if (existingUrls.length >= 5) {
            setError('Maximum of 5 sources allowed. Please remove one first.');
            return;
        }

        onAdd(cleanUrl, target);
        setUrl('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest font-league">Connect New Source</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Source Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['EVENTS', 'MENU', 'NEWSLETTER', 'WEBSITE'] as ScrapeTarget[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTarget(t)}
                                    className={`px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${target === t
                                        ? 'bg-primary text-black border-primary'
                                        : 'bg-black border-white/10 text-slate-500 hover:border-white/20'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">URL / Web Address</label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder={
                                    target === 'EVENTS' ? 'https://facebook.com/events/...' :
                                        target === 'WEBSITE' ? 'https://yourvenue.com' :
                                            'https://yourvenue.com/menu'
                                }
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-primary/50 outline-none font-medium"
                                autoFocus
                            />
                        </div>
                        {error && (
                            <div className="flex items-center gap-2 mt-2 text-red-400 text-[10px] font-bold uppercase tracking-wide">
                                <AlertCircle className="w-3 h-3" />
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-primary text-black px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
                        >
                            <Plus className="w-3 h-3 stroke-[3]" />
                            Add Source
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

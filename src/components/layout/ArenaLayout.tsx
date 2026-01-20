import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin, ChevronLeft, Bell, X } from 'lucide-react';
import { GlobalSearch } from '../features/search/GlobalSearch';

interface ArenaLayoutProps {
    children: React.ReactNode;
    activeCategory: string;
    artieTip?: string;
    title: string;
    subtitle?: string;
    onSearchChange?: (query: string) => void;
    searchPlaceholder?: string;
}

export const ArenaLayout: React.FC<ArenaLayoutProps> = ({
    children,
    activeCategory,
    artieTip,
    title,
    subtitle,
    onSearchChange,
    searchPlaceholder = "Search the circuit..."
}) => {
    const navigate = useNavigate();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearchChange?.(query);
    };

    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen);
        if (isSearchOpen) {
            setSearchQuery('');
            onSearchChange?.('');
        }
    };

    return (
        <div className="min-h-full bg-[#0f172a] text-slate-100 flex flex-col font-sans">
            {/* Sticky Discovery Header */}
            <div className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
                <div className="p-4 flex items-center justify-between">
                    {!isSearchOpen ? (
                        <>
                            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
                                <ChevronLeft size={24} strokeWidth={3} />
                            </button>
                            <div className="text-center">
                                <h1 className="text-xl font-black text-white font-league uppercase tracking-tighter leading-none">{title}</h1>
                                {subtitle && <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">{subtitle}</p>}
                            </div>
                            <button
                                onClick={toggleSearch}
                                className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors"
                            >
                                <div className="w-8 h-8 bg-primary/10 rounded-full border border-primary/20 flex items-center justify-center">
                                    <Search size={16} className="text-primary" />
                                </div>
                            </button>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1 relative">
                                <GlobalSearch
                                    placeholder={searchPlaceholder}
                                    variant="header"
                                    className="w-full"
                                />
                            </div>
                            <button
                                onClick={toggleSearch}
                                className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Modular Filter Bar */}
                {!isSearchOpen && (
                    <div className="px-4 pb-4 flex gap-2 overflow-x-auto pt-2">
                        <button className="bg-primary text-black px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-black/10">
                            <Calendar size={12} strokeWidth={3} /> Tonight
                        </button>
                        <button className="bg-white/5 text-slate-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/5 hover:border-primary/50 transition-colors">
                            <MapPin size={12} strokeWidth={3} /> CITYWIDE
                        </button>
                        <button className="bg-white/5 text-slate-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/5 hover:border-primary/50 transition-colors">
                            <Search size={12} strokeWidth={3} /> {activeCategory.toUpperCase()}
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 p-4 pb-24 space-y-8">
                {/* Artie's Tip Bubble */}
                {artieTip && (
                    <div className="bg-primary/10 border border-primary/20 p-5 rounded-[2rem] rounded-tl-sm relative group mb-8">
                        <div className="absolute -top-3 -left-3 w-10 h-10 bg-primary rounded-2xl flex items-center justify-center font-black text-black text-xl shadow-lg group-hover:scale-110 transition-transform">
                            !
                        </div>
                        <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-2 px-6">ARTIE'S FIELD NOTE:</p>
                        <p className="text-xs text-white font-medium leading-relaxed italic px-6">
                            "{artieTip}"
                        </p>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="relative">
                    {children}
                </div>

                {/* Weekly Buzz Footer */}
                <div className="mt-12 bg-gradient-to-br from-slate-900 to-black border-2 border-primary/20 rounded-[2.5rem] p-8 text-center shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 space-y-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
                            <Bell size={32} className="text-primary" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white font-league uppercase tracking-tight">Stay Tapped In</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 px-4 leading-relaxed">
                                Don't miss the next session. Join the Weekly Buzz for event alerts and exclusive seasonal standing recaps.
                            </p>
                        </div>
                        <button className="w-full bg-primary text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs font-league border-2 border-black shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none transition-all">
                            Unlock Weekly Buzz
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

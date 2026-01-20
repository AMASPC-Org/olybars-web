import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, Info, Package, ArrowRight, Tag } from 'lucide-react';
import { MERCH_ITEMS } from '../../../config/merch';
import { Venue } from '../../../types';

interface MerchStandScreenProps {
    venues: Venue[];
}

const MerchStandScreen: React.FC<MerchStandScreenProps> = ({ venues }) => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const categories = ['All', 'T-Shirt', 'Hoodie', 'Hat'];

    const filteredItems = selectedCategory === 'All'
        ? MERCH_ITEMS
        : MERCH_ITEMS.filter(item => item.category === selectedCategory);

    const getVenueName = (venueId: string) => {
        return venues.find(v => v.id === venueId)?.name || 'Unknown Venue';
    };

    return (
        <div className="min-h-screen bg-background text-white pb-32">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-white/10 p-6 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-primary" />
                </button>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight font-league">
                        MERCH <span className="text-primary">STAND</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Wear the League. Support the Local.</p>
                </div>
            </header>

            {/* Hero / Value Prop */}
            <section className="p-6">
                <div className="bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
                    <ShoppingBag className="w-8 h-8 text-primary mb-4" />
                    <h2 className="text-xl font-black uppercase tracking-tight font-league mb-2">No Shipping. No Waiting.</h2>
                    <p className="text-xs text-slate-400 leading-relaxed font-body">
                        Buy your gear online now, then walk into the bar like a VIP to pick it up. Pure local flow.
                    </p>
                </div>
            </section>

            {/* Filter Tabs */}
            <div className="px-6 mb-6 overflow-x-auto flex gap-2">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${selectedCategory === cat
                            ? 'bg-primary text-black border-primary'
                            : 'bg-white/5 text-slate-400 border-white/10'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Merch Grid */}
            <div className="px-6 grid gap-6">
                {filteredItems.map(item => (
                    <div
                        key={item.id}
                        className="bg-surface rounded-3xl border border-white/5 overflow-hidden group active:scale-[0.98] transition-all"
                        onClick={() => navigate(`/merch/${item.id}`)}
                    >
                        <div className="aspect-[4/3] relative overflow-hidden">
                            <img
                                src={item.imageURL}
                                alt={item.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute top-4 left-4">
                                <span className="bg-black/60 backdrop-blur-md text-primary text-[9px] font-black px-3 py-1.5 rounded-full border border-primary/20 uppercase tracking-widest">
                                    {item.category}
                                </span>
                            </div>
                            <div className="absolute bottom-4 right-4">
                                <span className="bg-primary text-black text-xs font-black px-4 py-2 rounded-xl shadow-xl">
                                    ${item.price}
                                </span>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Tag className="w-3 h-3 text-primary" />
                                <span className="text-[10px] text-primary font-black uppercase tracking-widest">
                                    {getVenueName(item.venueId)}
                                </span>
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight font-league mb-2">{item.name}</h3>
                            <p className="text-xs text-slate-400 line-clamp-2 mb-6 font-body leading-relaxed">
                                {item.description}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                    <Package className="w-4 h-4" />
                                    In-Bar Pickup Only
                                </div>
                                <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Badge */}
            <div className="p-10 text-center">
                <Info className="w-6 h-6 text-slate-700 mx-auto mb-3" />
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">
                    Prices include 9.5% sales tax. A portion of every sale goes directly to the OlyBars development fund.
                </p>
            </div>
        </div>
    );
};

export default MerchStandScreen;

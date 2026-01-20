import React, { useEffect, useState } from 'react';
import { useInventoryStore } from '../stores/useInventoryStore';
import { SponsorshipAsset, EventSponsorshipPackage } from '../../../types/sponsorship';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { FormatCurrency } from '../../../utils/formatCurrency';

interface EventSponsorshipStepProps {
    venueId: string;
    selectedPackages: EventSponsorshipPackage[];
    onChange: (packages: EventSponsorshipPackage[]) => void;
}

export const EventSponsorshipStep: React.FC<EventSponsorshipStepProps> = ({ venueId, selectedPackages, onChange }) => {
    const { assets, fetchAssets, isLoading } = useInventoryStore();
    const [customPrices, setCustomPrices] = useState<Record<string, number>>({});

    useEffect(() => {
        if (venueId) {
            fetchAssets(venueId);
        }
    }, [venueId, fetchAssets]);

    const handleAddPackage = (asset: SponsorshipAsset) => {
        const newPackage: EventSponsorshipPackage = {
            id: crypto.randomUUID(),
            title: asset.name, // Use title instead of name
            description: asset.description, // Snapshot description
            price: customPrices[asset.id] ?? asset.baseValuation, // Snapshot price
            status: 'available',
            items: [{
                assetId: asset.id,
                name: asset.name,
                description: asset.description,
                type: asset.type,
                count: 1,
                baseValuation: asset.baseValuation,
                specs: asset.specs
            }],
            createdAt: Date.now()
        };
        onChange([...selectedPackages, newPackage]);
    };

    const handleRemovePackage = (packageId: string) => {
        onChange(selectedPackages.filter(p => p.id !== packageId));
    };

    const handlePriceChange = (assetId: string, price: number) => {
        setCustomPrices(prev => ({ ...prev, [assetId]: price }));
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-6 rounded-2xl border border-amber-500/20">
                <h3 className="text-xl font-bold text-white mb-2">Sponsorship Packages</h3>
                <p className="text-neutral-400 text-sm">
                    Select inventory items to offer as sponsorship packages for this event.
                    You can override the base valuation for this specific event.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Available Inventory */}
                <div>
                    <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4">Available Inventory</h4>
                    {isLoading ? (
                        <p className="text-neutral-500">Loading inventory...</p>
                    ) : assets.length === 0 ? (
                        <div className="p-4 border border-dashed border-neutral-700 rounded-xl text-center">
                            <p className="text-neutral-400 text-sm">No inventory defined.</p>
                            <p className="text-xs text-neutral-600 mt-1">Go to Dashboard &gt; Sponsorships to add assets.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {assets.filter(a => a.isActive).map(asset => {
                                const isAdded = false; // Allow adding multiple of same asset type? Maybe not for now, or maybe yes if quantity allows.
                                // Logic: check if we've reached quantity limit for this event? 
                                // For now, just listing them.
                                const currentCount = selectedPackages.filter(p => p.items.some(i => i.assetId === asset.id)).length;
                                const isSoldOut = currentCount >= asset.quantity;

                                return (
                                    <div key={asset.id} className={`p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col gap-3 ${isSoldOut ? 'opacity-50' : ''}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h5 className="font-bold text-white">{asset.name}</h5>
                                                <p className="text-xs text-neutral-500">{asset.type.replace('_', ' ')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-neutral-500 uppercase">Base Val.</p>
                                                <FormatCurrency amount={asset.baseValuation} className="font-bold text-amber-500" />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex-1 relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">$</span>
                                                <input
                                                    type="number"
                                                    className="w-full bg-black border border-neutral-700 rounded-lg py-1.5 pl-6 text-sm text-white focus:border-amber-500 outline-none"
                                                    placeholder={asset.baseValuation.toString()}
                                                    onChange={(e) => handlePriceChange(asset.id, parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleAddPackage(asset)}
                                                disabled={isSoldOut}
                                                className="bg-amber-500 text-black px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Plus size={14} />
                                                Add
                                            </button>
                                        </div>
                                        {isSoldOut && <p className="text-[10px] text-red-400 font-bold uppercase mt-1">Max Quantity Reached within event</p>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Selected Packages */}
                <div>
                    <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4">Selected Packages ({selectedPackages.length})</h4>
                    {selectedPackages.length === 0 ? (
                        <div className="p-8 border border-dashed border-neutral-800 rounded-xl text-center bg-neutral-900/50">
                            <AlertCircle className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                            <p className="text-neutral-500 text-sm">No packages selected for this event.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {selectedPackages.map(pkg => (
                                <div key={pkg.id} className="p-4 bg-neutral-800 border border-neutral-700 rounded-xl relative group hover:border-amber-500/50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <h5 className="font-bold text-white max-w-[80%] truncate">{pkg.title}</h5>
                                        <FormatCurrency amount={pkg.price} className="font-bold text-amber-500" />
                                    </div>
                                    <p className="text-xs text-neutral-400 line-clamp-1">{pkg.description}</p>

                                    <button
                                        onClick={() => handleRemovePackage(pkg.id)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        title="Remove"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

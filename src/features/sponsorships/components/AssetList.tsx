import React from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { SponsorshipAsset } from '../../../types/sponsorship';
import { FormatCurrency } from '../../../utils/formatCurrency';

interface AssetListProps {
    assets: SponsorshipAsset[];
    onAdd: () => void;
    onEdit: (asset: SponsorshipAsset) => void;
    onDelete: (assetId: string) => void;
    onToggleActive: (asset: SponsorshipAsset) => void;
}

export const AssetList: React.FC<AssetListProps> = ({
    assets,
    onAdd,
    onEdit,
    onDelete,
    onToggleActive
}) => {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white">Sponsorship Assets</h3>
                    <p className="text-sm text-neutral-400">Manage reusable inventory items for your events.</p>
                </div>
                <button
                    onClick={onAdd}
                    className="flex items-center gap-2 bg-amber-500 text-black px-4 py-2 rounded-xl font-bold hover:bg-amber-400 transition-colors"
                >
                    <Plus size={18} />
                    <span>Add Asset</span>
                </button>
            </div>

            {assets.length === 0 ? (
                <div className="text-center py-12 bg-neutral-800/50 rounded-2xl border border-dashed border-neutral-700">
                    <span className="text-4xl block mb-3">📦</span>
                    <h4 className="text-white font-bold mb-1">No Assets Found</h4>
                    <p className="text-neutral-400 text-sm mb-4">Create your first sponsorship asset to start selling.</p>
                    <button
                        onClick={onAdd}
                        className="text-amber-500 font-bold hover:underline text-sm"
                    >
                        Create Asset
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assets.map(asset => (
                        <div
                            key={asset.id}
                            className={`bg-neutral-800 p-4 rounded-xl border transition-all ${asset.isActive ? 'border-neutral-700 opacity-100' : 'border-neutral-800 opacity-60'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${asset.isActive ? 'bg-green-500' : 'bg-neutral-500'}`} />
                                    <h4 className="font-bold text-white">{asset.name}</h4>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onToggleActive(asset)}
                                        className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-700"
                                        title={asset.isActive ? "Deactivate" : "Activate"}
                                    >
                                        {asset.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                                    </button>
                                    <button
                                        onClick={() => onEdit(asset)}
                                        className="p-1.5 text-blue-400 hover:text-blue-300 rounded-lg hover:bg-blue-400/10"
                                        title="Edit"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(asset.id)}
                                        className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-400/10"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-neutral-400 mb-3 line-clamp-2">{asset.description}</p>

                            <div className="flex justify-between items-center text-xs">
                                <div className="bg-black/30 px-2 py-1 rounded text-neutral-300 uppercase font-mono tracking-wide">
                                    {asset.type.replace('_', ' ')}
                                </div>
                                <div className="text-right">
                                    <span className="text-neutral-500 mr-2">Valuation</span>
                                    <FormatCurrency amount={asset.baseValuation} className="text-amber-500 font-bold text-sm" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

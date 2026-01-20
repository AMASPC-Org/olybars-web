import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { SponsorshipAsset, AssetType } from '../../../types/sponsorship';

interface AssetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (assetData: Partial<SponsorshipAsset>) => Promise<void>;
    initialData?: SponsorshipAsset;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState<Partial<SponsorshipAsset>>({
        name: '',
        type: 'other',
        description: '',
        quantity: 1,
        baseValuation: 0,
        isActive: true
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                name: '',
                type: 'other',
                description: '',
                quantity: 1,
                baseValuation: 0,
                isActive: true
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error("Failed to save asset:", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-700 w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-neutral-800">
                    <h3 className="text-xl font-bold text-white">
                        {initialData ? 'Edit Asset' : 'New Sponsorship Asset'}
                    </h3>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-xs uppercase text-neutral-500 font-bold mb-1">Asset Name</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                            placeholder="e.g. Main Stage Banner"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    {/* Type & Quantity */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs uppercase text-neutral-500 font-bold mb-1">Type</label>
                            <select
                                className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value as AssetType })}
                            >
                                <option value="digital_display">Digital Display</option>
                                <option value="physical_signage">Physical Signage</option>
                                <option value="audio_shoutout">Audio Shoutout</option>
                                <option value="social_collab">Social Collab</option>
                                <option value="booth_space">Booth Space</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-neutral-500 font-bold mb-1">Quantity</label>
                            <input
                                type="number"
                                min="1"
                                required
                                className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                title="How many of these are available per event?"
                            />
                        </div>
                    </div>

                    {/* Valuation */}
                    <div>
                        <label className="block text-xs uppercase text-neutral-500 font-bold mb-1">Base Valuation ($)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-neutral-500">$</span>
                            <input
                                type="number"
                                min="0"
                                required
                                className="w-full bg-black border border-neutral-700 rounded-lg p-3 pl-8 text-white focus:border-amber-500 outline-none"
                                value={formData.baseValuation}
                                onChange={e => setFormData({ ...formData, baseValuation: parseFloat(e.target.value) })}
                            />
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-1">Suggested price. Can be overridden in package bundles.</p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs uppercase text-neutral-500 font-bold mb-1">Description</label>
                        <textarea
                            required
                            className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none h-24"
                            placeholder="Describe what the sponsor gets..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl bg-neutral-800 text-neutral-300 font-bold hover:bg-neutral-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-3 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? 'Saving...' : <><Save size={18} /> Save Asset</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

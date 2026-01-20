import React, { useState, useEffect } from 'react';
import { AssetList } from '../../sponsorships/components/AssetList';
import { AssetFormModal } from '../../sponsorships/components/AssetFormModal';
import { useInventoryStore } from '../../sponsorships/stores/useInventoryStore';
import { SponsorshipAsset } from '../../../types/sponsorship';
import { useToast } from '../../../components/ui/BrandedToast';
import { Loader2 } from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { AppEvent } from '../../../types/event';

interface SponsorshipManagementTabProps {
    venueId: string;
}

export const SponsorshipManagementTab: React.FC<SponsorshipManagementTabProps> = ({ venueId }) => {
    const { assets, isLoading: loading, error, fetchAssets, createAsset, updateAsset, deleteAsset } = useInventoryStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<SponsorshipAsset | undefined>(undefined);
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<'inventory' | 'deals'>('inventory');
    const [deals, setDeals] = useState<{ event: AppEvent, pkg: any }[]>([]);
    const [loadingDeals, setLoadingDeals] = useState(false);

    // Fetch Inventory
    useEffect(() => {
        fetchAssets(venueId);
    }, [venueId, fetchAssets]);

    // Fetch Deals (Event Sponsorships)
    useEffect(() => {
        if (activeTab === 'deals') {
            const fetchDeals = async () => {
                setLoadingDeals(true);
                try {
                    // Fetch upcoming events
                    // Optimization: We could query only events with sponsorshipPackages if we had a flag
                    // usage: collection(db, 'venues', venueId, 'events')
                    const eventsRef = collection(db, 'venues', venueId, 'events');
                    // Simple query: all events for now, or filter by date
                    const q = query(eventsRef);
                    const snapshot = await getDocs(q);

                    const foundDeals: { event: any, pkg: any }[] = [];
                    snapshot.docs.forEach(doc => {
                        const event = { id: doc.id, ...doc.data() } as AppEvent;
                        if (event.sponsorshipPackages && Array.isArray(event.sponsorshipPackages)) {
                            event.sponsorshipPackages.forEach((pkg: any) => {
                                if (['reserved', 'pending_review', 'sold'].includes(pkg.status)) {
                                    foundDeals.push({ event, pkg });
                                }
                            });
                        }
                    });
                    // Sort: Pending review first, then reserved, then sold
                    foundDeals.sort((a, b) => {
                        const rank = (s: string) => s === 'pending_review' ? 0 : s === 'reserved' ? 1 : 2;
                        return rank(a.pkg.status) - rank(b.pkg.status);
                    });
                    setDeals(foundDeals);
                } catch (err) {
                    console.error("Error fetching deals", err);
                } finally {
                    setLoadingDeals(false);
                }
            };
            fetchDeals();
        }
    }, [activeTab, venueId]);

    const updateDealStatus = async (event: any, pkg: any, newStatus: string) => {
        try {
            const eventRef = doc(db, 'venues', venueId, 'events', event.id);
            // Updating array item requires mapping
            const updatedPackages = event.sponsorshipPackages.map((p: any) => {
                if (p.id === pkg.id) {
                    return { ...p, status: newStatus };
                }
                return p;
            });

            await updateDoc(eventRef, { sponsorshipPackages: updatedPackages });

            // Refresh local state
            setDeals(prev => prev.map(d => {
                if (d.pkg.id === pkg.id) {
                    return { ...d, pkg: { ...d.pkg, status: newStatus } };
                }
                return d;
            }));
            showToast(`DEAL UPDATED TO ${newStatus.toUpperCase()}`, 'success');
        } catch (err) {
            console.error("Failed to update deal", err);
            showToast('FAILED TO UPDATE DEAL', 'error');
        }
    };

    const handleCreate = async (assetData: Partial<SponsorshipAsset>) => {
        try {
            // Ensure ID exists
            const entry: any = {
                ...assetData,
                id: assetData.id || `asset-${Date.now()}`,
                createdAt: Date.now(),
                isActive: true
            };
            await createAsset(venueId, entry);
            showToast('ASSET CREATED SUCCESSFULLY', 'success');
            setIsModalOpen(false);
        } catch (e) {
            console.error(e);
            showToast('FAILED TO CREATE ASSET', 'error');
        }
    };

    const handleUpdate = async (assetData: Partial<SponsorshipAsset>) => {
        if (!editingAsset) return;
        try {
            await updateAsset(venueId, editingAsset.id, assetData);
            showToast('ASSET UPDATED', 'success');
            setIsModalOpen(false);
            setEditingAsset(undefined);
        } catch (e) {
            console.error(e);
            showToast('FAILED TO UPDATE ASSET', 'error');
        }
    };

    const handleDelete = async (assetId: string) => {
        if (!window.confirm('Are you sure you want to delete this asset? Existing event packages using this asset will be unaffected.')) return;
        try {
            await deleteAsset(venueId, assetId);
            showToast('ASSET DELETED', 'success');
        } catch (e) {
            console.error(e);
            showToast('FAILED TO DELETE ASSET', 'error');
        }
    };

    const handleToggleActive = async (asset: SponsorshipAsset) => {
        try {
            await updateAsset(venueId, asset.id, { isActive: !asset.isActive });
            showToast(asset.isActive ? 'ASSET DEACTIVATED' : 'ASSET ACTIVATED', 'success');
        } catch (e) {
            console.error(e);
            showToast('FAILED TO TOGGLE STATUS', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 bg-black/20 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'inventory' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'}`}
                >
                    Inventory Assets
                </button>
                <button
                    onClick={() => setActiveTab('deals')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'deals' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'}`}
                >
                    Active Deals
                </button>
            </div>

            {activeTab === 'inventory' ? (
                <>
                    <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-6 rounded-2xl border border-amber-500/20">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-500">
                                <span className="text-2xl">🤝</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white mb-2">Sponsorship Inventory</h2>
                                <p className="text-neutral-400 text-sm leading-relaxed max-w-2xl">
                                    Define the assets you can offer to local makers (e.g., "Wall Space", "Digital Ad", "Booth").
                                    These assets will be bundled into packages when you create events.
                                </p>
                            </div>
                        </div>
                    </div>

                    {loading && assets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12">
                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
                            <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs">Loading Inventory...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl text-center">
                            <h4 className="text-red-500 font-bold uppercase mb-2">Failed to load inventory</h4>
                            <p className="text-neutral-400 text-sm">{error}</p>
                            <button
                                onClick={() => fetchAssets(venueId)}
                                className="mt-4 px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <AssetList
                            assets={assets}
                            onAdd={() => {
                                setEditingAsset(undefined);
                                setIsModalOpen(true);
                            }}
                            onEdit={(asset) => {
                                setEditingAsset(asset);
                                setIsModalOpen(true);
                            }}
                            onDelete={handleDelete}
                            onToggleActive={handleToggleActive}
                        />
                    )}

                    <AssetFormModal
                        isOpen={isModalOpen}
                        onClose={() => {
                            setIsModalOpen(false);
                            setEditingAsset(undefined);
                        }}
                        onSave={editingAsset ? handleUpdate : handleCreate}
                        initialData={editingAsset}
                    />
                </>
            ) : (
                <div className="space-y-4">
                    {loadingDeals ? (
                        <div className="text-center p-12 text-neutral-400">Loading Deals...</div>
                    ) : deals.length === 0 ? (
                        <div className="text-center p-12 bg-neutral-800 rounded-2xl border border-dashed border-neutral-700">
                            <p className="text-neutral-400">No active sponsorship deals found.</p>
                        </div>
                    ) : (
                        deals.map(({ event, pkg }) => (
                            <div key={pkg.id} className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${pkg.status === 'pending_review' ? 'bg-amber-500 text-black' :
                                            pkg.status === 'sold' ? 'bg-green-500 text-black' :
                                                'bg-blue-500 text-white'
                                            }`}>
                                            {pkg.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-neutral-500 font-mono">{event.date}</span>
                                    </div>
                                    <h3 className="font-bold text-white text-lg">{pkg.title} <span className="text-neutral-500 text-sm font-normal">at {event.title}</span></h3>

                                    {pkg.creativeUrl && (
                                        <div className="mt-2 bg-black/30 p-2 rounded text-sm text-neutral-300">
                                            <a href={pkg.creativeUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1 font-bold">
                                                View Creative Assets ↗
                                            </a>
                                            {pkg.creativeNotes && <p className="text-xs mt-1 italic">"{pkg.creativeNotes}"</p>}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    {pkg.status === 'pending_review' && (
                                        <button
                                            onClick={() => updateDealStatus(event, pkg, 'sold')}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-sm"
                                        >
                                            Approve
                                        </button>
                                    )}
                                    {['pending_review', 'reserved'].includes(pkg.status) && (
                                        <button
                                            onClick={() => updateDealStatus(event, pkg, 'available')}
                                            className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 font-bold rounded-lg text-sm"
                                        >
                                            Reject / Release
                                        </button>
                                    )}
                                    {pkg.status === 'sold' && (
                                        <div className="px-4 py-2 bg-green-900/20 text-green-500 border border-green-900/50 rounded-lg text-sm font-bold">
                                            Approved
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

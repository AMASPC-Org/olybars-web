import React from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Maker, EventSponsorshipPackage } from '../../../types/sponsorship';
import { AppEvent } from '../../../types/event';
import { Calendar, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { AssetUploadModal } from './AssetUploadModal';

interface MakerSponsorshipsProps {
    maker: Maker;
}

export const MakerSponsorships: React.FC<MakerSponsorshipsProps> = ({ maker }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = React.useState(true);
    const [packages, setPackages] = React.useState<{ event: AppEvent, pkg: EventSponsorshipPackage }[]>([]);
    const [uploadTarget, setUploadTarget] = React.useState<{ event: AppEvent, pkg: EventSponsorshipPackage } | null>(null);
    const [refreshKey, setRefreshKey] = React.useState(0);

    React.useEffect(() => {
        const fetchSponsorships = async () => {
            if (!maker?.id) return;

            try {
                // Find all events where this maker is a sponsor
                const q = query(
                    collection(db, 'events'),
                    where('sponsorIds', 'array-contains', maker.id)
                );

                const snapshot = await getDocs(q);
                const results: { event: AppEvent, pkg: EventSponsorshipPackage }[] = [];

                snapshot.docs.forEach(doc => {
                    const event = { id: doc.id, ...doc.data() } as AppEvent;
                    if (event.sponsorshipPackages) {
                        // Filter for packages owned by this maker
                        const makerPackages = event.sponsorshipPackages.filter(p => p.sponsorId === maker.id);
                        makerPackages.forEach(pkg => {
                            results.push({ event, pkg });
                        });
                    }
                });

                // Sort by event date (newest first)
                results.sort((a, b) => new Date(b.event.date).getTime() - new Date(a.event.date).getTime());
                setPackages(results);
            } catch (err) {
                console.error("Error fetching sponsorships:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSponsorships();
    }, [maker?.id, refreshKey]);

    if (loading) return <div className="text-center p-8 text-neutral-400">Loading sponsorships...</div>;

    if (packages.length === 0) {
        return (
            <div className="p-6 bg-neutral-800 rounded-2xl border border-neutral-700 mt-6">
                <h3 className="text-xl font-bold text-white mb-2">My Sponsorships</h3>
                <div className="text-center py-8">
                    <span className="text-4xl mb-2 block">🤝</span>
                    <p className="text-neutral-400">You haven't purchased any sponsorship packages yet.</p>
                    <p className="text-sm text-neutral-500 mt-1">Visit an Event page to start sponsoring!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 mt-6">
            <h3 className="text-xl font-bold text-white mb-2">My Sponsorships</h3>

            {packages.map(({ event, pkg }) => (
                <div key={pkg.id} className="bg-neutral-800 rounded-2xl border border-neutral-700 overflow-hidden">
                    {/* Header: Event Context */}
                    <div
                        onClick={() => navigate(`/events/${event.id}`)}
                        className="bg-neutral-700/50 p-3 flex justify-between items-center cursor-pointer hover:bg-neutral-700 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-amber-500" />
                            <span className="font-bold text-white text-sm">{event.title}</span>
                            <span className="text-xs text-neutral-400">@ {event.venueName}</span>
                        </div>
                        <span className="text-xs text-neutral-400 font-mono">{event.date}</span>
                    </div>

                    {/* Body: Package Details */}
                    <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-bold text-lg text-amber-500">{pkg.title}</h4>
                                <p className="text-sm text-neutral-300">{pkg.description}</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${pkg.status === 'reserved' ? 'bg-blue-900 text-blue-200' :
                                    pkg.status === 'sold' ? 'bg-green-900 text-green-200' :
                                        'bg-neutral-700 text-neutral-400'
                                    }`}>
                                    {pkg.status}
                                </span>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="bg-black/20 rounded-lg p-3 space-y-2">
                            {pkg.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm">
                                    <div className="w-1 h-1 bg-amber-500 rounded-full" />
                                    <span className="text-white font-medium">{item.count}x {item.name}</span>
                                    {item.specs?.dimensions && (
                                        <span className="text-xs text-neutral-500">[{item.specs.dimensions}]</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-4 border-t border-neutral-700 flex justify-between items-center">
                            <span className="text-xs text-neutral-500">Purchased: ${pkg.price}</span>

                            {pkg.status === 'reserved' && (
                                <button
                                    onClick={() => setUploadTarget({ event, pkg })}
                                    className="text-xs bg-amber-500 text-black font-bold px-3 py-2 rounded-lg hover:bg-amber-400"
                                >
                                    Upload Assets
                                </button>
                            )}
                            {(pkg.status === 'sold' || pkg.status === 'pending_review') && (
                                <div className="text-xs text-green-400 flex items-center gap-1">
                                    <Info size={12} />
                                    <span>{pkg.status === 'pending_review' ? 'In Review' : 'Assets Approved'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {uploadTarget && (
                <AssetUploadModal
                    isOpen={!!uploadTarget}
                    onClose={() => setUploadTarget(null)}
                    event={uploadTarget.event}
                    pkg={uploadTarget.pkg}
                    onSuccess={() => {
                        setRefreshKey(prev => prev + 1);
                        setUploadTarget(null);
                    }}
                />
            )}
        </div>
    );
};

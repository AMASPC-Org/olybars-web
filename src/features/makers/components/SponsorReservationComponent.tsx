import React, { useState } from 'react';
import { AppEvent } from '../../../types/event';
import { Maker, EventSponsorshipPackage } from '../../../types/sponsorship';
import { FormatCurrency } from '../../../utils/formatCurrency';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebase';
import { AlertCircle, CheckCircle, ShoppingBag } from 'lucide-react';

interface SponsorReservationComponentProps {
    event: AppEvent;
    makers: Maker[]; // Available makers for the current user
    userEmail: string;
}

export const SponsorReservationComponent: React.FC<SponsorReservationComponentProps> = ({ event, makers, userEmail }) => {
    const [selectedPackage, setSelectedPackage] = useState<EventSponsorshipPackage | null>(null);
    const [selectedMakerId, setSelectedMakerId] = useState<string>(makers[0]?.id || '');
    const [isReserving, setIsReserving] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleReserve = async () => {
        if (!selectedPackage || !selectedMakerId) return;

        setIsReserving(true);
        setResult(null);

        try {
            const reserveFn = httpsCallable(functions, 'reserveSponsorshipPackage');
            await reserveFn({
                eventId: event.id,
                packageId: selectedPackage.id,
                makerId: selectedMakerId,
                makerName: makers.find(m => m.id === selectedMakerId)?.name
            });

            setResult({ type: 'success', message: 'Package reserved successfully! pending venue approval.' });
            setSelectedPackage(null); // Clear selection
        } catch (error: any) {
            console.error("Reservation failed", error);
            setResult({ type: 'error', message: error.message || 'Failed to reserve package.' });
        } finally {
            setIsReserving(false);
        }
    };

    if (!event.sponsorshipPackages || event.sponsorshipPackages.length === 0) {
        return null; // No sponsorships available
    }

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden mt-8">
            <div className="bg-gradient-to-r from-amber-600/20 to-transparent p-6 border-b border-neutral-800">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="text-amber-500" />
                    Sponsorship Opportunities
                </h3>
                <p className="text-neutral-400 text-sm mt-1">
                    Promote your brand at this event. Select a package to reserve it.
                </p>
            </div>

            <div className="p-6 space-y-4">
                {result && (
                    <div className={`p-4 rounded-lg flex items-center gap-3 ${result.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {result.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <p className="text-sm font-bold">{result.message}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {event.sponsorshipPackages.map(pkg => {
                        const isAvailable = pkg.status === 'available';
                        const isSelected = selectedPackage?.id === pkg.id;

                        return (
                            <div
                                key={pkg.id}
                                className={`
                                    relative p-5 rounded-xl border transition-all cursor-pointer
                                    ${pkg.status !== 'available' ? 'bg-neutral-950 border-neutral-800 opacity-50 cursor-not-allowed' :
                                        isSelected ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500' : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'}
                                `}
                                onClick={() => isAvailable && setSelectedPackage(pkg)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-white max-w-[70%]">{pkg.title}</h4>
                                    <FormatCurrency amount={pkg.price} className="font-bold text-amber-500 text-lg" />
                                </div>
                                <p className="text-xs text-neutral-400 mb-4 line-clamp-2">{pkg.description}</p>

                                <div className="flex items-center justify-between mt-auto">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${pkg.status === 'available' ? 'bg-green-500/20 text-green-400' : 'bg-neutral-700 text-neutral-500'
                                        }`}>
                                        {pkg.status}
                                    </span>
                                    {isSelected && (
                                        <CheckCircle className="text-amber-500 w-5 h-5" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {selectedPackage && (
                    <div className="mt-6 p-6 bg-neutral-950 rounded-xl border border-neutral-800 animate-in fade-in slide-in-from-top-4">
                        <h4 className="text-white font-bold mb-4">Complete Reservation</h4>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Sponsoring As</label>
                                {makers.length > 0 ? (
                                    <select
                                        value={selectedMakerId}
                                        onChange={(e) => setSelectedMakerId(e.target.value)}
                                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                    >
                                        {makers.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm">
                                        You don't have any Maker profiles. <a href="/?mode=maker" className="underline font-bold">Create one</a> to sponsor events.
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleReserve}
                                disabled={isReserving || !selectedMakerId}
                                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isReserving ? 'Processing...' : `Reserve for ${selectedPackage.title}`}
                            </button>
                            <p className="text-xs text-center text-neutral-500">
                                This will hold the package for 24 hours pending venue approval. Payment is arranged directly with the venue.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

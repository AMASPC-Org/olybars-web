import React, { useState } from 'react';
import { X, Upload, Link, AlertCircle } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { AppEvent } from '../../../types/event';
import { EventSponsorshipPackage } from '../../../types/sponsorship';

interface AssetUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: AppEvent;
    pkg: EventSponsorshipPackage;
    onSuccess: () => void;
}

export const AssetUploadModal: React.FC<AssetUploadModalProps> = ({ isOpen, onClose, event, pkg, onSuccess }) => {
    const [creativeLink, setCreativeLink] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!creativeLink) return;

        setIsSubmitting(true);
        try {
            // We need to update the specific package within the event's sponsorshipPackages array
            // Since Firestore array updates are basic (add/remove), we must read-modify-write the whole array 
            // to update a specific object's property.

            const eventRef = doc(db, 'venues', event.venueId, 'events', event.id);
            const eventSnap = await getDoc(eventRef);

            if (!eventSnap.exists()) {
                throw new Error("Event not found");
            }

            const eventData = eventSnap.data() as AppEvent;
            const updatedPackages = eventData.sponsorshipPackages?.map(p => {
                if (p.id === pkg.id) {
                    return {
                        ...p,
                        status: 'pending_review', // Moving to review state
                        creativeUrl: creativeLink,
                        creativeNotes: notes,
                        updatedAt: Date.now()
                    };
                }
                return p;
            });

            await updateDoc(eventRef, {
                sponsorshipPackages: updatedPackages
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to submit assets:", error);
            alert("Failed to submit assets. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="bg-neutral-900 w-full max-w-lg rounded-2xl border border-neutral-700 shadow-2xl relative z-10 p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Upload Creative Assets</h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="bg-neutral-800 p-4 rounded-xl border border-neutral-700">
                        <h3 className="text-amber-500 font-bold mb-1">{pkg.title}</h3>
                        <p className="text-sm text-neutral-400 mb-2">Package ID: {pkg.id.slice(0, 8)}...</p>
                        <div className="text-xs bg-neutral-900 p-2 rounded text-neutral-300">
                            Required: {pkg.items.map(i => `${i.count}x ${i.name}`).join(', ')}
                        </div>
                    </div>

                    <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-xl flex gap-3">
                        <InfoIcon className="text-blue-400 shrink-0" size={20} />
                        <div className="text-xs text-blue-200">
                            Please provide a link to your creative assets (Google Drive, Dropbox, Figma, etc).
                            Ensure the link is publicly accessible or shared with the venue.
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-300 mb-2">Asset Link URL</label>
                        <div className="relative">
                            <Link className="absolute left-3 top-3 text-neutral-500" size={18} />
                            <input
                                type="url"
                                value={creativeLink}
                                onChange={e => setCreativeLink(e.target.value)}
                                placeholder="https://drive.google.com/..."
                                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-amber-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-300 mb-2">Notes for Venue (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-4 text-white focus:border-amber-500 outline-none h-24 resize-none"
                            placeholder="Here are the files for the banner..."
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!creativeLink || isSubmitting}
                        className="w-full bg-amber-500 text-black font-bold py-4 rounded-xl hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="animate-spin">⏳</span> Submitting...
                            </>
                        ) : (
                            <>
                                <Upload size={18} /> Submit for Review
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

function InfoIcon({ className, size }: { className?: string, size?: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4"></path>
            <path d="M12 8h.01"></path>
        </svg>
    )
}

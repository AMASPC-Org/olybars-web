import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { calculateDistance } from '../../../utils/geoUtils';
import { Venue, VenueStatus, GameStatus } from '../../../types';
import { MapPin, Loader2, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { VibeCheckModal } from '../../venues/components/VibeCheckModal';

interface QRVibeCheckScreenProps {
    venues: Venue[];
    handleVibeCheck: (v: Venue, status: VenueStatus, hasConsent: boolean, photoUrl?: string, verificationMethod?: 'gps' | 'qr', gameStatus?: Record<string, GameStatus>, soberCheck?: { isGood: boolean; reason?: string }) => void;
}

export const QRVibeCheckScreen: React.FC<QRVibeCheckScreenProps> = ({ venues, handleVibeCheck }) => {
    const { venueId } = useParams<{ venueId: string }>();
    const navigate = useNavigate();
    const { coords, loading: geoLoading, error: geoError, requestLocation } = useGeolocation();
    const [venue, setVenue] = useState<Venue | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [isAtVenue, setIsAtVenue] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const found = venues.find(v => v.id === venueId);
        if (found) {
            setVenue(found);
        }
    }, [venueId, venues]);

    useEffect(() => {
        if (venue && coords && venue.location) {
            const dist = calculateDistance(coords.latitude, coords.longitude, venue.location.lat, venue.location.lng);
            setDistance(dist);
            // 100 meters tolerance
            setIsAtVenue(dist <= 100);
        }
    }, [venue, coords]);

    const handleConfirmVibe = (v: Venue, status: VenueStatus, hasConsent: boolean, photoUrl?: string, verificationMethod?: 'gps' | 'qr', gameStatus?: Record<string, GameStatus>, soberCheck?: { isGood: boolean; reason?: string }) => {
        // Pass 'qr' as verification method
        handleVibeCheck(v, status, hasConsent, photoUrl, verificationMethod || 'qr', gameStatus, soberCheck);
        setShowModal(false);
        navigate(`/bars/${v.id}`); // Redirect to venue after
    };

    if (!venue) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-center">
                <div className="bg-slate-900 border border-white/10 p-8 rounded-2xl max-w-sm w-full">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-black text-white uppercase font-league">Invalid QR Code</h2>
                    <p className="text-slate-400 text-sm mt-2">This code does not match any active venue.</p>
                    <button onClick={() => navigate('/')} className="mt-6 w-full bg-slate-800 py-3 rounded-xl font-bold uppercase text-xs">Return Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-6 flex flex-col items-center justify-center font-sans">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                        <MapPin className="w-10 h-10 text-primary animate-bounce" />
                    </div>
                    <p className="text-primary font-black uppercase tracking-widest text-xs">Vibe Spot Detected</p>
                    <h1 className="text-4xl font-black font-league uppercase italic leading-none">{venue.name}</h1>
                </div>

                <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                    {geoLoading ? (
                        <div className="py-12 text-center space-y-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Triangulating Position...</p>
                        </div>
                    ) : distance !== null ? (
                        <div className="text-center space-y-6">
                            {isAtVenue ? (
                                <>
                                    <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                                        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                        <p className="text-green-400 font-black uppercase tracking-widest text-xs">Location Verified</p>
                                        <p className="text-white font-bold text-lg mt-1 font-mono">{Math.round(distance)}m Away</p>
                                    </div>
                                    <p className="text-slate-400 text-sm">You are on-site! Claim your verification check.</p>
                                    <button
                                        onClick={() => setShowModal(true)}
                                        className="w-full bg-primary text-black font-black py-4 rounded-xl uppercase tracking-widest text-lg shadow-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
                                    >
                                        Verify & Vibe <ArrowRight className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                                        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                                        <p className="text-red-400 font-black uppercase tracking-widest text-xs">Too Far Away</p>
                                        <p className="text-white font-bold text-lg mt-1 font-mono">{Math.round(distance)}m Away</p>
                                        <p className="text-[10px] text-red-300 mt-2">Must be within 100m</p>
                                    </div>
                                    <button
                                        onClick={requestLocation}
                                        className="w-full bg-slate-800 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-slate-700 transition-colors"
                                    >
                                        Retry Location
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-slate-400 text-xs mb-4">Location permission required to verify physical presence.</p>
                            <button
                                onClick={requestLocation}
                                className="bg-primary text-black font-bold px-6 py-2 rounded-full uppercase text-xs"
                            >
                                Enable Location
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                    OlyBars Verification Protocols v1.0
                </p>
            </div>

            <VibeCheckModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                venue={venue}
                onConfirm={handleConfirmVibe}
            // No clock-in prompt here, strict focus on Vibe Check for this flow?
            // Or maybe allowing it.
            />
        </div>
    );
};

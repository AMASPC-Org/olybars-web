import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Share2, MapPin, Info, Loader2, Sparkles, Facebook, Instagram, Music2, Droplets, Zap } from 'lucide-react';
import { Venue, ClockInRecord, PointsReason, VenueStatus } from '../../../types';
import { performClockIn } from '../../../services/userService';
import { queryClient } from '../../../lib/queryClient';
import { PULSE_CONFIG } from '../../../config/pulse';
import { PermissionRecoveryView } from './PermissionRecoveryView';
import { GAMIFICATION_CONFIG } from '../../../config/gamification';
import { FormatCurrency } from '../../../utils/formatCurrency';
import { useBouncer, AdmissionStatus } from '../../../hooks/useBouncer';
import { useUser } from '../../../contexts';

interface ClockInModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedVenue: Venue | null;
    awardPoints: (reason: PointsReason, venueId?: string, hasConsent?: boolean, verificationMethod?: 'gps' | 'qr', bonusPoints?: number, skipBackend?: boolean, venueStatus?: VenueStatus, overrideTotal?: number) => void;
    setClockInHistory: React.Dispatch<React.SetStateAction<ClockInRecord[]>>;
    setClockedInVenue: React.Dispatch<React.SetStateAction<string | null>>;
    vibeChecked?: boolean;
    onVibeCheckPrompt?: () => void;
    onLogin: (mode: 'login' | 'signup') => void;
    onJoinLeague: () => void;
}

export const ClockInModal: React.FC<ClockInModalProps> = ({
    isOpen,
    onClose,
    selectedVenue,
    awardPoints,
    setClockInHistory,
    setClockedInVenue,
    vibeChecked,
    onVibeCheckPrompt,
    onLogin,
    onJoinLeague,
}) => {
    const [showCamera, setShowCamera] = useState(false);
    const [clockInResult, setClockInResult] = useState<{ basePoints?: number; eventBonus?: number; total?: number } | null>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState(false);
    const [isClockingIn, setIsClockingIn] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [isSuccess, setIsSuccess] = useState(false);
    const [shadowVariant, setShadowVariant] = useState<'success' | 'locked' | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const { userProfile } = useUser();
    const userId = userProfile.uid;
    const userRole = userProfile.role;
    const isLoggedIn = userId !== 'guest';

    const [allowMarketingUse, setAllowMarketingUse] = useState(false);

    // --- BOUNCER INTEGRATION ---
    const {
        canClockIn,
        admissionStatus,
        estimatePoints,
        location
    } = useBouncer(userProfile, selectedVenue || undefined);

    // Destructure location setup from Bouncer
    const { coords, loading: geoLoading, refresh: refreshLocation, permission: permissionStatus } = location;

    // Derived User State (Legacy props kept for now, but logical check relies on admissionStatus)
    // The Bouncer Service handles "Guest" checks, returning SHADOW_MODE check result
    // But specific UI variant (Visitor vs Guest) might still rely on local checks?
    const isVisitor = userId === 'guest';
    const isAuthGuest = !isVisitor && userRole === 'guest';

    // Debug Access
    useEffect(() => {
        if (admissionStatus === AdmissionStatus.ALLOWED) {
            // console.log("Bouncer Access Granted");
        }
    }, [admissionStatus]);

    if (!isOpen || !selectedVenue) return null;

    if (permissionStatus === 'denied') {
        return <PermissionRecoveryView onCancel={onClose} onRetry={() => window.location.reload()} />;
    }

    const startCamera = async () => {
        setCameraError(false);
        setShowCamera(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
        } catch (err) {
            console.error("Camera access denied", err);
            setCameraError(true);
            setShowCamera(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
        setShowCamera(false);
    }

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                setCapturedPhoto(dataUrl);
                awardPoints('photo', selectedVenue.id, allowMarketingUse);
                stopCamera();
            }
        }
    };

    const handleShare = async () => {
        awardPoints('share', selectedVenue.id);
        alert("Link copied to clipboard! (+5 Points)");
    };

    const confirmClockIn = async () => {
        // [BOUNCER CHECK]
        if (!canClockIn || canClockIn.status === AdmissionStatus.LOCKED_DISTANCE) {
            const limit = PULSE_CONFIG.SPATIAL.GEOFENCE_RADIUS;
            const distMsg = canClockIn?.metadata?.distance
                ? `You are ${Math.round(canClockIn.metadata.distance)}m away (Limit: ${limit}m).`
                : "Unable to verify distance.";
            setErrorMessage(`Coordinate Verification Failed. ${distMsg} Please move closer.`);
            return;
        }

        if (canClockIn.status === AdmissionStatus.LOCKED_COOLDOWN) {
            setErrorMessage(canClockIn.reason || "Cooldown active.");
            return;
        }

        setIsClockingIn(true);
        setErrorMessage(null);

        try {
            const { latitude, longitude } = coords!; // Safe due to Bouncer Check

            // [HONEST GATE LOGIC]
            const result = await performClockIn(selectedVenue.id, userId, latitude, longitude);

            setClockInResult({
                basePoints: result.basePoints || estimatePoints('clockin'),
                eventBonus: result.eventBonus || 0,
                total: result.pointsAwarded || estimatePoints('clockin')
            });

            // Handle Guest (Shadow Mode)
            if (admissionStatus === AdmissionStatus.SHADOW_MODE) {
                setShadowVariant('success');
            } else {
                setClockInHistory(prev => [...prev, { venueId: selectedVenue.id, timestamp: Date.now() }]);
                setClockedInVenue(selectedVenue.id);
                setIsSuccess(true);
            }

            // Always award points locally for UI feedback
            awardPoints('clockin', selectedVenue.id, allowMarketingUse, 'gps', 0, admissionStatus === AdmissionStatus.SHADOW_MODE, selectedVenue.status, result.pointsAwarded);

            // Optimistic UI Update (TanStack Query Cache)
            queryClient.setQueryData(['venues-brief'], (oldVenues: Venue[] | undefined) => {
                if (!oldVenues) return [];
                return oldVenues.map(v => v.id === selectedVenue.id ? { ...v, clockIns: (v.clockIns || 0) + 1 } : v);
            });

            if (admissionStatus !== AdmissionStatus.SHADOW_MODE && vibeChecked) {
                setTimeout(onClose, 3000);
            }
            setIsClockingIn(false);
        } catch (err: any) {
            // Honest Gate: Handle Auth Errors or Guest Role Limitations
            if ((admissionStatus === AdmissionStatus.SHADOW_MODE) && (err.status === 401 || err.status === 403)) {
                setClockInResult({
                    basePoints: estimatePoints('clockin'),
                    eventBonus: 0,
                    total: estimatePoints('clockin')
                });

                // 401/403 -> Shadow Locked
                setShadowVariant('locked');
                setIsClockingIn(false);
                return;
            }

            setErrorMessage(err.message);
            setIsClockingIn(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-surface w-full max-w-sm rounded-2xl border-2 border-primary shadow-[0_0_50px_-12px_rgba(251,191,36,0.5)] overflow-hidden text-center p-8 space-y-6">
                    <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto animate-bounce border-2 border-cyan-500">
                        <Droplets className="w-10 h-10 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter font-league italic">Well Deepened!</h2>
                        <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-cyan-400 font-black uppercase tracking-widest text-sm">Clock In Verified:</span>
                                <FormatCurrency amount={clockInResult?.basePoints || 10} />
                            </div>
                            {(clockInResult?.eventBonus || 0) > 0 && (
                                <p className="text-secondary font-black uppercase tracking-widest text-[10px] animate-pulse">EVENT BONUS: +{clockInResult?.eventBonus} Drops</p>
                            )}
                            <div className="h-px bg-white/10 w-24 mx-auto my-2" />
                            <p className="text-white font-black uppercase tracking-widest text-xs">Total Flow: {clockInResult?.total || 10} {GAMIFICATION_CONFIG.CURRENCY.UNIT}</p>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Current Streak</p>
                        <div className="flex items-center justify-center gap-2">
                            <div className="text-2xl font-black text-white font-mono">
                                🔥 2-DAY STREAK
                            </div>
                        </div>
                        <p className="text-[9px] text-primary font-bold uppercase mt-1 italic">Keep it up for a Bonus Badge!</p>
                    </div>

                    {/* Flash Bounty Contextual Placement */}
                    {selectedVenue.activeFlashBounty && (
                        <div className="bg-amber-950/40 p-6 rounded-2xl border-2 border-primary/50 space-y-4 shadow-[0_0_30px_rgba(251,191,36,0.2)] animate-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-3 justify-center text-primary mb-2">
                                <Zap className="w-5 h-5 fill-current" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] font-league">Flash Bounty Available</span>
                                <Zap className="w-5 h-5 fill-current" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-white text-lg font-black uppercase font-league leading-none">{selectedVenue.activeFlashBounty.title}</h4>
                                <p className="text-primary text-sm font-bold italic leading-tight">
                                    {selectedVenue.activeFlashBounty.bounty_task_description || "Upload a photo of your purchase."}
                                </p>
                            </div>
                            <button
                                onClick={startCamera}
                                className="w-full bg-primary text-black font-black py-4 rounded-xl uppercase tracking-wider font-league hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                            >
                                <Camera className="w-5 h-5" /> Snap Photo
                            </button>
                        </div>
                    )}

                    {!selectedVenue.activeFlashBounty && (selectedVenue.loyalty_signup_url || selectedVenue.hero_item) && (
                        <div className="space-y-3 pt-2 text-center">
                            {selectedVenue.loyalty_signup_url && (
                                <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl relative overflow-hidden group animate-in zoom-in-95 duration-500">
                                    <div className="absolute top-0 right-0 p-1">
                                        <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                                    </div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1.5">Double Dip Alert</p>
                                    <h4 className="text-white text-sm font-bold leading-tight mb-3">
                                        Stack points! Join {selectedVenue.name} Rewards.
                                    </h4>
                                    <button
                                        onClick={() => window.open(selectedVenue.loyalty_signup_url, '_blank')}
                                        className="w-full bg-primary text-black font-black py-3 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors shadow-lg shadow-primary/10"
                                    >
                                        Connect Venue Rewards
                                    </button>
                                </div>
                            )}

                            {!selectedVenue.loyalty_signup_url && selectedVenue.hero_item && (
                                <div className="bg-slate-900 border border-white/10 p-3 rounded-xl flex gap-3 text-left animate-in slide-in-from-bottom-2 duration-500">
                                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-white/10">
                                        <img src={selectedVenue.hero_item.photoUrl} alt={selectedVenue.hero_item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-[#FFD700] uppercase tracking-tighter mb-0.5 flex items-center gap-1">
                                            <Sparkles size={8} /> Artie's Insider Tip
                                        </p>
                                        <h4 className="text-white text-xs font-black uppercase truncate leading-none">{selectedVenue.hero_item.name}</h4>
                                        <p className="text-[8px] text-slate-400 leading-tight line-clamp-2 mt-1 italic">
                                            {selectedVenue.hero_item.description}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!vibeChecked && onVibeCheckPrompt ? (
                        <div className="bg-slate-950 p-6 rounded-2xl border border-primary/20 space-y-4 shadow-xl">
                            <div className="flex items-center gap-3 justify-center text-primary mb-2">
                                <Sparkles className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] font-league">Next Level Play</span>
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <p className="text-white text-sm font-bold leading-tight">
                                High energy? Empty tables? <br />
                                <span className="text-primary italic">Verify the Vibe & Game Status</span> <br />
                                to earn +10 more points!
                            </p>
                            <button
                                onClick={onVibeCheckPrompt}
                                className="w-full bg-primary text-black font-black py-4 rounded-xl uppercase tracking-wider font-league hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                            >
                                <Camera className="w-5 h-5" /> Vibe & Game Check
                            </button>
                            <button onClick={onClose} className="text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">Maybe Later</button>
                        </div>
                    ) : (
                        <p className="text-slate-400 text-xs font-medium italic">Redirecting to status hub...</p>
                    )}
                </div>
            </div>
        );
    }

    if (shadowVariant) {

        return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-surface w-full max-w-sm rounded-2xl border-2 border-red-500/50 shadow-[0_0_50px_-12px_rgba(239,68,68,0.5)] overflow-hidden text-center p-8 space-y-6 relative">

                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto bg-slate-900 border-2 border-red-500/30">
                        <Droplets className="w-8 h-8 text-red-500 animate-pulse" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter font-league italic">
                            Leak Detected!
                        </h2>
                        <div className="mt-4 space-y-3">
                            <p className="text-sm text-slate-300 font-medium leading-relaxed">
                                {isAuthGuest
                                    ? <>That Clock-In generated <span className="text-cyan-400 font-black">+{clockInResult?.total || 10} Drops</span>, but your reservoir is unsealed.</>
                                    : <>Signal Verified! <span className="text-cyan-400 font-black">+{clockInResult?.total || 10} Drops</span> found.<br /><br />Your bucket has a hole in it.</>
                                }
                            </p>
                            <p className="text-[11px] text-red-400 font-bold uppercase tracking-tight bg-red-950/30 px-3 py-2 rounded-lg border border-red-500/20">
                                {isAuthGuest
                                    ? <>These drops will <span className="text-white underline">drain away</span> unless you activate your membership.</>
                                    : <>Join the League to <span className="text-white">seal your reservoir</span>, or these drops expire at midnight.</>
                                }
                            </p>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={() => isAuthGuest ? onJoinLeague() : onLogin('signup')}
                            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black py-4 rounded-xl uppercase tracking-wider font-league hover:scale-105 transition-transform shadow-lg shadow-cyan-500/20"
                        >
                            {isAuthGuest
                                ? 'Seal My Reservoir'
                                : 'Seal & Save Drops'
                            }
                        </button>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-3 italic">
                            {isAuthGuest ? 'Instant Activation. No Forms.' : 'It takes 30 seconds.'}
                        </p>
                    </div>

                    <button onClick={onClose} className="text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">
                        Let them leak (Close)
                    </button>
                </div>
            </div>
        );
    }

    // UI HELPER: Get status message based on Bouncer logic
    const distanceStatus = canClockIn?.metadata?.distance;
    const isAllowed = canClockIn?.status === AdmissionStatus.ALLOWED || canClockIn?.status === AdmissionStatus.SHADOW_MODE; // Guest also counts as 'at venue'

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
            <div className="bg-surface w-full max-w-sm overflow-hidden rounded-xl border border-slate-700 shadow-lg relative">

                {showCamera && (
                    <div className="absolute inset-0 z-50 bg-black flex flex-col">
                        <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover w-full" />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="p-4 bg-black/50 flex justify-between items-center absolute bottom-0 w-full border-t border-primary/20">
                            <button onClick={stopCamera} className="font-bold uppercase tracking-wider text-sm">Cancel</button>
                            <button onClick={capturePhoto} className="w-16 h-16 bg-white rounded-full border-4 border-primary shadow-xl active:scale-95 transition-transform"></button>
                            <div className="w-16"></div> {/* Spacer */}
                        </div>
                    </div>
                )}

                <div className="bg-primary p-4 text-center border-b border-black/10 relative">
                    <button onClick={onClose} className="absolute top-3 right-3 text-black/70 hover:text-black hover:scale-110 transition-transform"><X className="w-6 h-6" /></button>
                    <h2 className="text-2xl font-black text-black uppercase tracking-wider font-league italic">Clock In</h2>
                    <p className="text-black/60 text-[10px] font-black uppercase tracking-widest font-league leading-none mt-1">Limit: 2 per 12 hours</p>
                </div>

                <div className="p-4 space-y-4">
                    <div className="text-center">
                        <h3 className="text-3xl font-bold text-white uppercase tracking-tighter">{selectedVenue.name}</h3>
                        <div className="mt-1">
                            {geoLoading ? (
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">
                                    Finding you...
                                </p>
                            ) : isAllowed ? (
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                                    📍 Verified At Venue
                                </p>
                            ) : (
                                <div className="space-y-2 mb-2">
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${distanceStatus !== undefined && distanceStatus <= PULSE_CONFIG.SPATIAL.GEOFENCE_RADIUS ? 'text-green-400' : 'text-red-400'}`}>
                                        {distanceStatus !== undefined
                                            ? distanceStatus <= PULSE_CONFIG.SPATIAL.GEOFENCE_RADIUS
                                                ? `${Math.round(distanceStatus)}m FROM VENUE (VERIFIED)`
                                                : `${Math.round(distanceStatus)}m FROM VENUE (TOO FAR)`
                                            : 'Location Check REQUIRED'}
                                    </p>
                                    <button
                                        onClick={refreshLocation}
                                        className="text-[10px] bg-primary/20 text-primary font-black px-4 py-2 rounded-full border border-primary/30 hover:bg-primary/30 transition-all uppercase tracking-widest"
                                    >
                                        {coords ? 'Verify Again' : 'Verify My Location'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer group relative overflow-hidden ${capturedPhoto ? 'border-primary/50 bg-black' : 'border-slate-600 bg-surface hover:bg-slate-800 hover:border-primary'}`}>
                        {capturedPhoto ? (
                            <div className="space-y-3">
                                <img src={capturedPhoto} alt="Vibe Check" className="w-full h-40 object-cover rounded-md" />
                                <div className="flex flex-col gap-3">
                                    <div className="grid grid-cols-4 gap-2">
                                        <button
                                            onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}`, '_blank')}
                                            className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/20 hover:bg-[#1877F2]/20 transition-all group"
                                        >
                                            <Facebook className="w-4 h-4 text-[#1877F2]" />
                                            <span className="text-[7px] font-black text-[#1877F2] mt-1.5 uppercase">FB</span>
                                        </button>
                                        <button
                                            onClick={() => window.open('https://www.instagram.com/', '_blank')}
                                            className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#E4405F]/10 border border-[#E4405F]/20 hover:bg-[#E4405F]/20 transition-all group"
                                        >
                                            <Instagram className="w-4 h-4 text-[#E4405F]" />
                                            <span className="text-[7px] font-black text-[#E4405F] mt-1.5 uppercase">IG</span>
                                        </button>
                                        <button
                                            onClick={() => window.open('https://www.tiktok.com/', '_blank')}
                                            className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                                        >
                                            <Music2 className="w-4 h-4 text-white" />
                                            <span className="text-[7px] font-black text-white mt-1.5 uppercase">TikTok</span>
                                        </button>
                                        <button
                                            onClick={handleShare}
                                            className="flex flex-col items-center justify-center p-2 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all group"
                                        >
                                            <Share2 className="w-4 h-4 text-primary" />
                                            <span className="text-[7px] font-black text-primary mt-1.5 uppercase">Share</span>
                                        </button>
                                    </div>
                                    <button onClick={() => setCapturedPhoto(null)} className="text-xs text-slate-500 hover:text-white font-bold uppercase tracking-widest pb-1">Retake Photo</button>
                                </div>
                            </div>
                        ) : (
                            <div onClick={startCamera}>
                                {cameraError ? (
                                    <div className="py-4"><p className="text-red-500 text-xs mb-2 font-bold">Camera access denied. Enable permissions in your browser.</p></div>
                                ) : (
                                    <>
                                        <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/10 transition-colors border border-slate-700"><Camera className="w-7 h-7 text-slate-400 group-hover:text-primary" /></div>
                                        <p className="text-sm font-bold text-white uppercase tracking-wide">Take Vibe Photo (+{estimatePoints('photo')} Pts)</p>
                                        <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase">Logo, Menu, or Selfie</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-md ${allowMarketingUse ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-500'}`}>
                                    <Sparkles size={14} />
                                </div>
                                <div className="ml-1">
                                    <p className="text-[10px] font-black text-white uppercase tracking-wider font-league leading-none mb-1">Marketing Consent</p>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase italic">Earn +{GAMIFICATION_CONFIG.REWARDS.MARKETING_CONSENT} Bonus Points!</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAllowMarketingUse(!allowMarketingUse)}
                                className={`w-9 h-5 rounded-full p-1 transition-all ${allowMarketingUse ? 'bg-primary' : 'bg-slate-700'}`}
                            >
                                <div className={`w-3 h-3 rounded-full bg-white transition-all ${allowMarketingUse ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800/50">
                            <div className="flex items-start gap-2">
                                <Info size={12} className="text-primary shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-[9px] text-slate-300 font-bold uppercase tracking-tight">Usage Transparency:</p>
                                    <p className="text-[8px] text-slate-500 leading-normal font-medium italic">
                                        When you select "Clock In" with the "Marketing Consent" toggle active, users grant OlyBars a non-exclusive right to display the photo on the specific venue's listing page. In exchange, users receive a Premium Point Reward (+25 pts). A standard "Clock In" (+10 pts) will signal your presence on the map/feed, but photos are not stored for public gallery use.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase font-league">Total Reward Preview</span>
                            <span className="text-sm font-black text-primary uppercase font-league">
                                +{estimatePoints('clockin') + (allowMarketingUse ? GAMIFICATION_CONFIG.REWARDS.MARKETING_CONSENT : 0)} POINTS
                            </span>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 p-3 text-[10px] text-slate-400 border border-slate-700 rounded-md flex gap-2 items-start leading-tight">
                        <Info className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-black uppercase tracking-widest text-white">GPS Verification Disclosure</p>
                            <p className="font-medium italic text-[9px]">
                                OlyBars utilizes real-time GPS verification to ensure League integrity. To "Clock In," users must be physically present within a {Math.round(PULSE_CONFIG.SPATIAL.GEOFENCE_RADIUS * 3.28084)} -foot radius of the participating venue. This location data is used solely for point verification and is not stored or shared for advertising purposes.
                            </p>
                        </div>
                    </div>

                    {errorMessage && (
                        <div className="bg-red-900/20 border border-red-800 p-3 rounded-lg text-red-200 text-xs font-bold text-center animate-in fade-in slide-in-from-top-1">
                            ⚠️ {errorMessage}
                        </div>
                    )}

                    <button
                        onClick={confirmClockIn}
                        disabled={isClockingIn || !isAllowed}
                        className={`w-full py-4 rounded-lg text-lg font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 outline-none ${isAllowed
                            ? 'bg-primary text-black shadow-md hover:bg-yellow-400 active:scale-95'
                            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        {isClockingIn ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
                        ) : (
                            <><MapPin className="w-5 h-5" /> CONFIRM I AM HERE</>
                        )}
                    </button>

                    {!isLoggedIn && (
                        <p className="text-center text-[9px] text-slate-500 font-bold uppercase mt-2">
                            Guest Mode: Points will be pending until you join.
                        </p>
                    )}

                    {/* LCB SAFE RIDE HOME - TRIGGER 5:30 PM */}
                    {(() => {
                        const now = new Date();
                        const isLate = now.getHours() > 17 || (now.getHours() === 17 && now.getMinutes() >= 30);
                        if (!isLate) return null;

                        return (
                            <div className="mt-4 pt-4 border-t border-slate-800 animate-in slide-in-from-bottom duration-500">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Safe Ride Home</p>
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => window.location.href = 'tel:3605550100'}
                                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-primary/50 transition-all group"
                                    >
                                        <span className="text-[10px] font-black text-white group-hover:text-primary">RED CAB</span>
                                        <span className="text-[8px] text-slate-500 font-bold">Local</span>
                                    </button>
                                    <button
                                        onClick={() => window.open('https://m.uber.com/ul/?action=setPickup', '_blank')}
                                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-primary/50 transition-all group"
                                    >
                                        <span className="text-[10px] font-black text-white group-hover:text-primary lowercase italic">uber</span>
                                        <span className="text-[8px] text-slate-500 font-bold">App</span>
                                    </button>
                                    <button
                                        onClick={() => window.open('https://lyft.com/ride?id=lyft', '_blank')}
                                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-primary/50 transition-all group"
                                    >
                                        <span className="text-[10px] font-black text-white group-hover:text-primary">LYFT</span>
                                        <span className="text-[8px] text-slate-500 font-bold">Web</span>
                                    </button>
                                </div>
                                <p className="text-[8px] text-slate-500 font-bold uppercase mt-3 text-center italic">
                                    "Stay safe, stay in the League."
                                </p>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

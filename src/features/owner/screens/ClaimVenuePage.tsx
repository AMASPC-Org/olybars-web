import React, { useState, useEffect } from 'react';
import {
    Building2, MapPin, Phone, Globe, Check,
    ChevronRight, ArrowLeft, Send, Users,
    LayoutGrid, Settings2, Info, LogIn, Crown,
    Zap, Flame, Trophy, ArrowRight, Loader2,
    ShieldCheck, Instagram
} from 'lucide-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { PlaceAutocomplete } from '../../../components/ui/PlaceAutocomplete';
import { AssetToggleGrid } from '../../../components/partners/AssetToggleGrid';
import { Venue, VenueStatus } from '../../../types';
import { syncVenueWithGoogle, updateVenueDetails, checkVenueClaim, onboardVenue, initiatePhoneVerification, verifyPhoneCode } from '../../../services/venueService';
import { useToast } from '../../../components/ui/BrandedToast';
import { SEO } from '../../../components/common/SEO';
import { auth, db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

type OnboardingStep = 'LANDING' | 'SEARCH' | 'VERIFY' | 'CONFIG' | 'INVITE' | 'SUCCESS';

export default function ClaimVenuePage() {
    const { showToast } = useToast();
    const [step, setStep] = useState<OnboardingStep>('LANDING');
    const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
    const [venueData, setVenueData] = useState<Partial<Venue> | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPhoneVerifying, setIsPhoneVerifying] = useState(false);
    const [showPhoneConfirm, setShowPhoneConfirm] = useState(false);
    const [enteredCode, setEnteredCode] = useState('');
    const [isCodeVerified, setIsCodeVerified] = useState(false);
    const [assets, setAssets] = useState<Record<string, boolean>>({});
    const [vibe, setVibe] = useState<VenueStatus>('trickle');
    const [managerEmail, setManagerEmail] = useState('');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const handlePlaceSelect = React.useCallback(async (place: google.maps.places.PlaceResult) => {
        if (!place.place_id) return;

        setSelectedPlace(place);
        setIsProcessing(true);
        try {
            // 1. Check if already claimed
            const claimStatus = await checkVenueClaim(place.place_id);

            if (claimStatus.isClaimed) {
                showToast(`${place.name} has already been claimed!`, 'error');
                setVenueData(null);
                setStep('SEARCH'); // Fallback to search
                return;
            }

            // 2. Prepare Preview
            const demoVenue: Partial<Venue> = {
                id: claimStatus.venueId || 'TEMP',
                name: place.name || '',
                address: place.formatted_address || '',
                phone: place.formatted_phone_number || place.international_phone_number || '',
                website: place.website || '',
                googlePlaceId: place.place_id || '',
                // In a real flow, we'd also get photos here
                photos: (place as any).photos?.map((p: any, i: number) => ({
                    id: `p-${i}`,
                    url: p.getUrl?.() || '',
                    allowMarketingUse: false,
                    timestamp: Date.now(),
                    userId: 'google'
                }))
            };
            setVenueData(demoVenue);
            setStep('SEARCH'); // Move to search so they can see the card
        } catch (error) {
            showToast('COULD NOT RESOLVE VENUE DATA', 'error');
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    }, [showToast]);

    const [autoQuery, setAutoQuery] = useState('');
    const location = useLocation();

    // Auto-fill from URL, State, or SessionStorage (Auth Bridge)
    useEffect(() => {
        const venueId = searchParams.get('venueId');
        const placeId = searchParams.get('placeId');
        const nameParam = searchParams.get('name');

        // 1. Check State (Direct Navigation from Profile) - PRIORITY
        const prefilledVenue = location.state?.prefilledVenue as Venue | undefined;
        if (prefilledVenue && !selectedPlace && !venueData) {
            setVenueData(prefilledVenue);
            if (prefilledVenue.googlePlaceId) {
                setSelectedPlace({
                    place_id: prefilledVenue.googlePlaceId,
                    name: prefilledVenue.name,
                    formatted_address: prefilledVenue.address,
                    formatted_phone_number: prefilledVenue.phone,
                    website: prefilledVenue.website
                } as any);
            }
            setStep('VERIFY'); // Skip Search, Go straight to Verify
            return;
        }

        // 2. Check Session Storage for Bridge Data
        const bridgeData = sessionStorage.getItem('claim_intent_venue');

        if (bridgeData && !selectedPlace && !venueData) {
            try {
                const intent = JSON.parse(bridgeData);
                // Only restore if user is now logged in, or just to show preview
                handlePlaceSelect({
                    place_id: intent.placeId,
                    name: intent.name,
                    formatted_address: intent.address,
                    formatted_phone_number: intent.phone,
                    website: intent.website
                } as any);

                if (auth.currentUser) {
                    showToast('Session Restored. Ready to Induct.', 'success');
                    sessionStorage.removeItem('claim_intent_venue'); // Clear it
                }
            } catch (e) { console.error('Bridge Restore Failed', e); }
        }
        else if ((placeId || venueId) && !selectedPlace && !isProcessing && !venueData) {
            // If we have a venue ID but no place ID, we might need a fallback, 
            // but usually we pass both now.
            handlePlaceSelect({
                place_id: placeId || venueId,
                name: nameParam || 'Proposed Venue',
                formatted_address: searchParams.get('address') || 'Olympia, WA'
            } as google.maps.places.PlaceResult);

            // Skip landing if coming from a profile
            if (step === 'LANDING') setStep('SEARCH');
        } else if (nameParam && !autoQuery && !selectedPlace) {
            // Just pre-fill the search box if we don't have a place ID
            setAutoQuery(nameParam);
            setStep('SEARCH');
        }
    }, [searchParams, handlePlaceSelect, selectedPlace, isProcessing, venueData, autoQuery, step]);

    const handleClaimClick = async () => {
        const user = auth.currentUser;
        if (!user) {
            // [AUTH BRIDGE] Save Intent
            if (selectedPlace?.place_id && venueData) {
                const claimIntent = {
                    placeId: selectedPlace.place_id,
                    name: venueData.name,
                    address: venueData.address,
                    phone: venueData.phone,
                    website: venueData.website
                };
                sessionStorage.setItem('claim_intent_venue', JSON.stringify(claimIntent));
            }
            navigate(`/auth?mode=register_venue&redirect=${encodeURIComponent('/partners/claim')}`);
            return;
        }

        if (!selectedPlace?.place_id) return;

        setIsProcessing(true);
        try {
            const result = await onboardVenue(selectedPlace.place_id);

            // [ADMIN NOTIFICATION]
            try {
                await addDoc(collection(db, 'sys_admin_notifications'), {
                    type: "VENUE_CLAIMED",
                    message: `Venue ${venueData?.name || 'Unknown'} claimed by ${user.email}`,
                    meta: {
                        placeId: selectedPlace.place_id,
                        userId: user.uid,
                        ownerEmail: user.email,
                        venueId: result.venueId
                    },
                    status: "unread",
                    timestamp: serverTimestamp()
                });
            } catch (notifyErr) { console.error("Notification Failed", notifyErr); }

            setVenueData(prev => ({ ...prev, id: result.venueId }));
            showToast('VENUE CLAIMED & SYNCED', 'success');
            setStep('VERIFY');
        } catch (error: any) {
            showToast(error.message || 'CLAIM FAILED', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePhoneVerifyClick = async () => {
        if (!venueData?.phone || !selectedPlace?.place_id) {
            showToast("Missing business phone number to verify.", "error");
            return;
        }

        setIsProcessing(true);
        try {
            await initiatePhoneVerification(
                selectedPlace.place_id,
                venueData.phone,
                venueData.name || 'Venue'
            );
            setIsPhoneVerifying(true);
            showToast("Artie is dialing the business now...", "info");
        } catch (error: any) {
            showToast(error.message || "Failed to initiate call.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCodeSubmit = async () => {
        if (!selectedPlace?.place_id || !enteredCode) return;

        setIsProcessing(true);
        try {
            const result = await verifyPhoneCode(selectedPlace.place_id, enteredCode);
            if (result.success) {
                setIsCodeVerified(true);
                setIsPhoneVerifying(false);
                showToast("Identity Verified by Phone Signal!", "success");
            } else {
                showToast("Incorrect code. Try again.", "error");
            }
        } catch (error: any) {
            showToast(error.message || "Verification failed.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleVerificationConfirm = () => {
        setStep('CONFIG');
    };

    const handleConfigConfirm = async () => {
        if (!venueData?.id) return;

        setIsProcessing(true);
        try {
            // Persist Vibe and Assets
            await updateVenueDetails(venueData.id, {
                vibeDefault: vibe,
                assets: assets
            }, auth.currentUser?.uid || undefined);

            showToast('VIBE INITIALIZED', 'success');
            setStep('INVITE');
        } catch (error) {
            showToast('SYNC FAILED', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleInviteConfirm = () => {
        setStep('SUCCESS');
    };

    const ProgressBar = () => {
        const steps: OnboardingStep[] = ['LANDING', 'SEARCH', 'VERIFY', 'CONFIG', 'INVITE'];
        const currentIndex = steps.indexOf(step);

        if (step === 'LANDING' || step === 'SUCCESS') return null;

        return (
            <div className="flex items-center justify-between mb-12 max-w-md mx-auto animate-in fade-in duration-700">
                {steps.slice(1).map((s, i) => {
                    const stepIndex = i + 1;
                    return (
                        <React.Fragment key={s}>
                            <div className={`flex flex-col items-center gap-2 ${stepIndex <= currentIndex ? 'text-primary' : 'text-slate-600'}`}>
                                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${stepIndex < currentIndex ? 'bg-primary border-primary text-black' :
                                    stepIndex === currentIndex ? 'border-primary ring-4 ring-primary/20 bg-slate-900' : 'border-slate-800 bg-slate-900'
                                    }`}>
                                    {stepIndex < currentIndex ? <Check className="w-6 h-6" /> : <span className="font-black">{stepIndex}</span>}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">{s}</span>
                            </div>
                            {stepIndex < steps.length - 1 && (
                                <div className={`h-[2px] flex-1 mb-6 ${stepIndex < currentIndex ? 'bg-primary' : 'bg-slate-800'}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-body py-12 px-6">
            <SEO title="Claim Your Bar - OlyBars Partners" />

            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-12">
                    <div className="inline-block p-4 bg-primary/10 rounded-3xl border border-primary/20 mb-6">
                        <Building2 className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black uppercase font-league tracking-tight">OlyBars Partner Portal</h1>
                    <p className="text-slate-400 mt-4 font-medium italic">"Verify, Don't Create" — The 3rd-Generation Onboarding</p>
                </header>

                <ProgressBar />

                <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-xl relative">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />

                    {step === 'LANDING' && (
                        <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700">
                            <div className="text-center space-y-4">
                                <h2 className="text-3xl md:text-5xl font-black uppercase font-league leading-none tracking-tighter">
                                    The Nightlife <span className="text-primary">Operating System</span>
                                </h2>
                                <p className="text-slate-400 font-medium max-w-2xl mx-auto italic">
                                    OlyBars is more than a directory. It's the real-time heartbeat of Olympia's bar scene, powered by the Artesian Bar League.
                                </p>
                            </div>

                            {/* [NEW] The "Zero Cost" Hook */}
                            <div className="bg-primary/10 border-2 border-primary/30 rounded-3xl p-6 text-center space-y-2">
                                <div className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
                                    <Check className="w-4 h-4" />
                                    Induction Status: $0 Required
                                </div>
                                <h3 className="text-xl font-black uppercase font-league">It's Free to Claim Your Spot</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                                    Claiming your profile, managing your hours, and appearing on the live map costs <span className="text-primary">$0</span>.
                                    Induct your venue into the league today at no risk.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Value Proposition Cards */}
                                <div className="bg-slate-950/50 border border-white/5 p-6 rounded-3xl space-y-4 hover:border-primary/30 transition-all group">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Zap className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-black uppercase font-league text-white italic">Flash Bounties</h3>
                                    <p className="text-xs text-slate-500 font-bold leading-relaxed uppercase">
                                        Slow Tuesday? Drop a 1-hour "Flash Bounty" to the entire league and watch the room fill up instantly.
                                    </p>
                                </div>

                                <div className="bg-slate-950/50 border border-white/5 p-6 rounded-3xl space-y-4 hover:border-blue-500/30 transition-all group">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Flame className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h3 className="text-xl font-black uppercase font-league text-white italic">The Buzz Clock</h3>
                                    <p className="text-xs text-slate-500 font-bold leading-relaxed uppercase">
                                        Let the city see your energy levels. From "Chill" to "Packed", we sync your real-time vibe to the map.
                                    </p>
                                </div>

                                <div className="bg-slate-950/50 border border-white/5 p-6 rounded-3xl space-y-4 hover:border-purple-500/30 transition-all group">
                                    <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <LayoutGrid className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <h3 className="text-xl font-black uppercase font-league text-white italic">Social Sync Beta</h3>
                                    <p className="text-xs text-slate-500 font-bold leading-relaxed uppercase">
                                        "Submit Once, Publish Everywhere." We automate your weekly event graphics and social posts so you don't have to.
                                    </p>
                                </div>

                                <div className="bg-slate-950/50 border border-white/5 p-6 rounded-3xl space-y-4 hover:border-emerald-500/30 transition-all group">
                                    <div className="w-12 h-12 bg-slate-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Trophy className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-black uppercase font-league text-white italic">League Integration</h3>
                                    <p className="text-xs text-slate-500 font-bold leading-relaxed uppercase">
                                        Become a certified League HQ. Host official events and let players earn points for choosing your spot.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-8 space-y-8">
                                <div className="text-center">
                                    <button
                                        onClick={() => setStep('SEARCH')}
                                        className="bg-primary text-black font-black px-12 py-5 rounded-2xl uppercase tracking-[0.2em] font-league text-lg shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-3"
                                    >
                                        Start My Induction
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="border-t border-white/5 pt-8">
                                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.3em] text-center mb-6">Optional Growth Paths</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-slate-950/30 p-4 rounded-2xl border border-white/5 text-center">
                                            <p className="text-[10px] text-primary font-black uppercase mb-1">DIY Toolkit</p>
                                            <p className="text-lg font-black font-league">$99/mo</p>
                                            <p className="text-[8px] text-slate-500 font-bold uppercase mt-2">Automated Email & PR Agent</p>
                                        </div>
                                        <div className="bg-slate-950/30 p-4 rounded-2xl border border-primary/20 text-center ring-1 ring-primary/10">
                                            <p className="text-[10px] text-blue-400 font-black uppercase mb-1">Pro League</p>
                                            <p className="text-lg font-black font-league">$399/mo</p>
                                            <p className="text-[8px] text-slate-500 font-bold uppercase mt-2">IG/FB Write-Sync & 10k Pts</p>
                                        </div>
                                        <div className="bg-slate-950/30 p-4 rounded-2xl border border-white/5 text-center">
                                            <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Agency Legend</p>
                                            <p className="text-lg font-black font-league">$799/mo</p>
                                            <p className="text-[8px] text-slate-500 font-bold uppercase mt-2">Full Management & Keystones</p>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] text-center">
                                    No Credit Card Required to Begin Induction
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 'SEARCH' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center relative">
                                <button
                                    onClick={() => setStep('LANDING')}
                                    className="absolute -top-4 left-0 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1"
                                >
                                    <ArrowLeft className="w-3 h-3" />
                                    Show Benefits
                                </button>
                                <h2 className="text-3xl font-black uppercase font-league mb-4">Phase 1: Induction Search</h2>
                                <p className="text-slate-400 font-medium">Find your establishment on Google and we'll handle the rest.</p>
                            </div>

                            {!selectedPlace && (
                                <PlaceAutocomplete
                                    onPlaceSelect={handlePlaceSelect}
                                    placeholder="Enter your Bar Name..."
                                    initialQuery={autoQuery}
                                    className="max-w-xl mx-auto"
                                />
                            )}

                            {isProcessing && (
                                <div className="flex items-center justify-center gap-3 text-primary font-black uppercase tracking-widest animate-pulse">
                                    <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                    Scraping Google Beta Data...
                                </div>
                            )}

                            {venueData && !isProcessing && (
                                <div className="max-w-md mx-auto bg-slate-950 border border-primary/30 rounded-3xl p-8 space-y-6 shadow-2xl relative group overflow-hidden">
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-black uppercase font-league leading-tight text-primary">{venueData.name}</h3>
                                            <p className="text-xs text-slate-500 font-bold tracking-widest uppercase italic">Verified Industry Identity</p>
                                        </div>
                                        <div className="p-3 bg-primary rounded-2xl relative">
                                            <Building2 className="w-6 h-6 text-black" />
                                            {selectedPlace && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-slate-950">
                                                    <Check className="w-2 h-2 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        <div className="flex items-start gap-4">
                                            <MapPin className="w-5 h-5 text-slate-500 shrink-0" />
                                            <span className="text-sm font-medium text-slate-300">{venueData.address}</span>
                                        </div>
                                        {venueData.phone && (
                                            <div className="flex items-center gap-4">
                                                <Phone className="w-5 h-5 text-slate-500 shrink-0" />
                                                <span className="text-sm font-medium text-slate-300">{venueData.phone}</span>
                                            </div>
                                        )}
                                        {venueData.website && (
                                            <div className="flex items-center gap-4">
                                                <Globe className="w-5 h-5 text-slate-500 shrink-0" />
                                                <span className="text-sm font-medium text-slate-300 truncate">{venueData.website}</span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleClaimClick}
                                        className="w-full bg-primary text-black font-black py-4 rounded-2xl uppercase tracking-[0.2em] font-league text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-3"
                                    >
                                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
                                        Induct My Venue
                                    </button>

                                    {selectedPlace && (
                                        <button
                                            onClick={() => {
                                                setSelectedPlace(null);
                                                setVenueData(null);
                                                setAutoQuery('');
                                            }}
                                            className="w-full text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-colors py-2"
                                        >
                                            Not my venue — back to search
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'VERIFY' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="text-center">
                                <h2 className="text-3xl font-black uppercase font-league mb-4">Phase 2: Verify & Secure</h2>
                                <p className="text-slate-400 font-medium">Link your secure identity and confirm business details.</p>
                            </div>

                            {/* [SECTION 1] Editable Business Details (Moved to Top) */}
                            <div className="space-y-6 max-w-3xl mx-auto">
                                <div className="bg-slate-950/50 border border-white/5 rounded-3xl p-6 space-y-4">
                                    <div className="flex items-center gap-3 text-primary mb-2">
                                        <Settings2 className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Business Details</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Establishment Name</label>
                                            <input
                                                type="text"
                                                value={venueData?.name || ''}
                                                onChange={e => setVenueData(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-lg font-black uppercase text-white font-league focus:border-primary outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Full Address</label>
                                            <textarea
                                                value={venueData?.address || ''}
                                                onChange={e => setVenueData(prev => prev ? ({ ...prev, address: e.target.value }) : null)}
                                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm font-medium text-slate-300 focus:border-primary outline-none resize-none min-h-[80px]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-950/50 border border-white/5 rounded-3xl p-6 space-y-4">
                                    <div className="flex items-center gap-3 text-blue-400 mb-2">
                                        <Globe className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Communication</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Phone</label>
                                            <input
                                                type="tel"
                                                value={venueData?.phone || ''}
                                                onChange={e => setVenueData(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-200 focus:border-primary outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Website</label>
                                            <input
                                                type="url"
                                                value={venueData?.website || ''}
                                                onChange={e => setVenueData(prev => prev ? ({ ...prev, website: e.target.value }) : null)}
                                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-200 focus:border-primary outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* [SECTION 2] Identity & Security */}
                            <div className="bg-slate-900/80 border border-emerald-500/20 rounded-3xl p-8 space-y-8 relative overflow-hidden group max-w-3xl mx-auto">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <ShieldCheck className="w-32 h-32 text-emerald-500" />
                                </div>

                                <div className="space-y-4 relative text-center md:text-left md:flex justify-between items-end">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-400">
                                            <ShieldCheck className="w-5 h-5" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Security Induction</span>
                                        </div>
                                        <h3 className="text-xl font-black uppercase font-league leading-none">Best Practice Verification</h3>
                                    </div>
                                    {!auth.currentUser && (
                                        <button
                                            onClick={() => {
                                                // [AUTH BRIDGE] Save Intent before redirecting
                                                if (selectedPlace?.place_id && venueData) {
                                                    try {
                                                        const claimIntent = {
                                                            placeId: selectedPlace.place_id,
                                                            name: venueData.name,
                                                            address: venueData.address,
                                                            phone: venueData.phone,
                                                            website: venueData.website
                                                        };
                                                        sessionStorage.setItem('claim_intent_venue', JSON.stringify(claimIntent));
                                                    } catch (e) { console.error('Bridge Save Failed', e); }
                                                }
                                                navigate(`/auth?mode=register_venue&redirect=${encodeURIComponent('/partners/claim')}`);
                                            }}
                                            className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-lg hover:bg-amber-500/20 transition-colors"
                                        >
                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                                <LogIn className="w-3 h-3" /> Sign In Required
                                            </p>
                                        </button>
                                    )}
                                </div>

                                <div className={`space-y-4 relative transition-all duration-500 ${!auth.currentUser ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                    {/* Verification Options */}
                                    <button
                                        className="w-full flex items-center justify-between p-4 bg-slate-950/50 border border-white/5 rounded-2xl hover:border-emerald-500/30 transition-all text-left group/opt disabled:cursor-not-allowed"
                                        disabled={!auth.currentUser}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 group-hover/opt:text-emerald-400 transition-colors">
                                                <Instagram className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black uppercase font-league tracking-tight">Sync Instagram</p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Connect your Business Account</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-700" />
                                    </button>

                                    <div className={`bg-slate-950/50 border border-white/5 rounded-2xl overflow-hidden transition-all ${showPhoneConfirm || isPhoneVerifying ? 'border-emerald-500/30' : 'hover:border-emerald-500/30'}`}>
                                        <button
                                            onClick={() => setShowPhoneConfirm(!showPhoneConfirm)}
                                            disabled={isCodeVerified || isPhoneVerifying || isProcessing || !auth.currentUser}
                                            className={`w-full flex items-center justify-between p-4 text-left group/opt disabled:cursor-not-allowed ${isCodeVerified ? 'opacity-50 cursor-default' : ''}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 ${isPhoneVerifying ? 'animate-pulse text-emerald-400' : ''} ${isCodeVerified ? 'text-emerald-500' : 'group-hover/opt:text-emerald-400'} transition-colors`}>
                                                    <Phone className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black uppercase font-league tracking-tight">Phone Signal</p>
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                                                        {isCodeVerified ? 'Verified by Voice' : 'Verify via Business Phone'}
                                                    </p>
                                                </div>
                                            </div>
                                            {isCodeVerified ? <Check className="w-4 h-4 text-emerald-500" /> : <ChevronRight className={`w-4 h-4 text-slate-700 transition-transform ${showPhoneConfirm ? 'rotate-90' : ''}`} />}
                                        </button>

                                        {/* Phone Confirmation Panel */}
                                        {showPhoneConfirm && !isPhoneVerifying && !isCodeVerified && (
                                            <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                                                <div className="bg-slate-900/50 rounded-xl p-4 space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                            <Phone className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Number to Call</p>
                                                            <p className="text-lg font-black text-white">{venueData?.phone || 'No Number Entered'}</p>
                                                        </div>
                                                    </div>

                                                    {venueData?.phone ? (
                                                        <button
                                                            onClick={handlePhoneVerifyClick}
                                                            disabled={isProcessing}
                                                            className="w-full bg-emerald-500 text-black font-black py-3 rounded-xl uppercase tracking-widest font-league hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                                                        >
                                                            <Phone className="w-4 h-4" />
                                                            Call Now
                                                        </button>
                                                    ) : (
                                                        <div className="text-center p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                                                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Missing Phone Number</p>
                                                            <p className="text-xs text-slate-400 mt-1">Please enter your business line in the section above.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Verification Code Entry */}
                                        {isPhoneVerifying && (
                                            <div className="bg-emerald-500/10 border-t border-emerald-500/20 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                                <div className="text-center space-y-2">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Artie is calling...</p>
                                                    </div>
                                                    <p className="text-xs text-slate-400 font-medium italic">Listen for the 4-digit code and enter it below.</p>
                                                </div>
                                                <div className="flex gap-2 justify-center">
                                                    <input
                                                        type="text"
                                                        maxLength={4}
                                                        placeholder="0000"
                                                        value={enteredCode}
                                                        onChange={(e) => setEnteredCode(e.target.value.replace(/[^0-9]/g, ''))}
                                                        className="bg-slate-950 border-2 border-emerald-500/20 rounded-xl px-4 py-3 text-2xl font-black tracking-[0.5em] text-center text-emerald-400 focus:border-emerald-500/50 outline-none w-32"
                                                    />
                                                    <button
                                                        onClick={handleCodeSubmit}
                                                        disabled={enteredCode.length !== 4 || isProcessing}
                                                        className="bg-emerald-500 text-black font-black px-6 rounded-xl uppercase font-league tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                                    >
                                                        Verify
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => setIsPhoneVerifying(false)}
                                                    className="w-full text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                                                >
                                                    Cancel Call
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* [SECTION 3] Confirmation */}
                            <div className="pt-4 space-y-4 max-w-md mx-auto">
                                {!auth.currentUser ? (
                                    <button
                                        onClick={() => navigate('/auth')}
                                        className="w-full bg-primary text-black font-black py-4 rounded-2xl uppercase tracking-[0.2em] font-league text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        Sign In to Verify
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleVerificationConfirm}
                                        className="w-full bg-emerald-500 text-black font-black py-4 rounded-2xl uppercase tracking-[0.2em] font-league text-lg shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        Confirm & Configure
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 'CONFIG' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="text-center">
                                <h2 className="text-3xl font-black uppercase font-league mb-4">Phase 3: Scene & Vibe Calibration</h2>
                                <p className="text-slate-400 font-medium">Configure your presence on the Open Play Network.</p>
                            </div>

                            <section className="space-y-8">
                                <div className="space-y-6 max-w-xl mx-auto">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <h3 className="text-lg font-black uppercase font-league text-primary leading-none">DEFAULT ATMOSPHERE</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Help users find the right mood</p>
                                        </div>
                                        <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg ${vibe === 'trickle' ? 'text-slate-400 bg-slate-400/10' :
                                            vibe === 'flowing' ? 'text-blue-400 bg-blue-400/10' :
                                                vibe === 'gushing' ? 'text-primary bg-primary/10' : 'text-red-400 bg-red-400/10'
                                            }`}>
                                            {vibe.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="relative group pt-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max="3"
                                            step="1"
                                            value={vibe === 'trickle' ? 0 : vibe === 'flowing' ? 1 : vibe === 'gushing' ? 2 : 3}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setVibe(val === 0 ? 'trickle' : val === 1 ? 'flowing' : val === 2 ? 'gushing' : 'flooded');
                                            }}
                                            className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <div className="flex justify-between mt-4 text-[9px] font-black uppercase tracking-widest text-slate-600">
                                            <span className={vibe === 'trickle' ? 'text-slate-400' : ''}>TRICKLE (Quiet)</span>
                                            <span className={vibe === 'flowing' ? 'text-primary' : ''}>FLOWING (Steady)</span>
                                            <span className={vibe === 'gushing' ? 'text-primary' : ''}>GUSHING (Active)</span>
                                            <span className={vibe === 'flooded' ? 'text-primary' : ''}>FLOODED (Packed)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="text-center">
                                        <h3 className="text-lg font-black uppercase font-league text-primary leading-none">ASSET TOGGLE GRID</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Toggle what you have on-site</p>
                                    </div>

                                    <AssetToggleGrid
                                        selectedAssets={assets}
                                        onChange={(id, val) => setAssets(prev => ({ ...prev, [id]: val }))}
                                    />
                                </div>

                                <div className="pt-8 max-w-sm mx-auto">
                                    <button
                                        onClick={handleConfigConfirm}
                                        className="w-full bg-primary text-black font-black py-4 rounded-2xl uppercase tracking-[0.2em] font-league text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                                    >
                                        Initialize My Board
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}

                    {step === 'INVITE' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="text-center">
                                <h2 className="text-3xl font-black uppercase font-league mb-4">Phase 4: Management Handoff</h2>
                                <p className="text-slate-400 font-medium">Who manages your events or marketing? Invite your pit bosses.</p>
                            </div>

                            <div className="max-w-xl mx-auto space-y-12">
                                <div className="bg-slate-950/50 border border-white/5 rounded-3xl p-8 space-y-6">
                                    <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                        <Users className="w-8 h-8 text-primary" />
                                        <div>
                                            <h4 className="text-sm font-black uppercase text-white leading-none">Manager Invite</h4>
                                            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">Full operational access (minus billing)</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Pit Boss Email Address</label>
                                        <div className="relative">
                                            <Send className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
                                            <input
                                                type="email"
                                                value={managerEmail}
                                                onChange={(e) => setManagerEmail(e.target.value)}
                                                placeholder="chris@yourvenue.com"
                                                className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-slate-800 focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex items-center justify-between">
                                        <p className="text-[10px] text-slate-500 font-medium max-w-[200px]">
                                            They will receive an invitation to join the League HQ as a Manager.
                                        </p>
                                        <button
                                            onClick={handleInviteConfirm}
                                            className="px-8 py-4 bg-slate-100 text-black font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-white transition-all shadow-xl"
                                        >
                                            Send Invite
                                        </button>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <button
                                        onClick={() => setStep('SUCCESS')}
                                        className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] hover:text-white transition-colors"
                                    >
                                        Skip this step for now
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'SUCCESS' && (
                        <div className="text-center py-12 space-y-12 animate-in zoom-in duration-700">
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                                <div className="relative w-32 h-32 rounded-full border-4 border-primary flex items-center justify-center bg-slate-950 shadow-2xl shadow-primary/40">
                                    <Check className="w-16 h-16 text-primary" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-4xl font-black uppercase font-league text-white">Venue Inducted into the League!</h2>
                                <p className="text-slate-400 font-medium max-w-lg mx-auto">
                                    Congratulations! <span className="text-primary font-bold">{venueData?.name}</span> is now an official Member of the Artesian Bar League.
                                </p>
                            </div>

                            <div className="flex justify-center pt-8">
                                <button
                                    onClick={() => navigate('/league-membership')}
                                    className="flex items-center gap-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black px-8 py-5 rounded-2xl shadow-xl shadow-yellow-900/20 hover:scale-105 transition-transform group"
                                >
                                    <Crown className="w-6 h-6 text-black fill-black" />
                                    <div className="text-left">
                                        <div className="text-xs font-black uppercase tracking-widest opacity-80">Next Step</div>
                                        <div className="text-lg font-black uppercase font-league tracking-wide">Setup Member Profile</div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 ml-2 text-black/50 group-hover:text-black transition-colors" />
                                </button>
                            </div>

                            <div className="flex items-center justify-center gap-6 pt-12 border-t border-white/5">
                                <img src="/artie-tap-icon.png" alt="Artie" className="w-12 h-12 grayscale opacity-30" />
                                <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.4em]">Powered by Well 80 Artesian Water</p>
                            </div>
                        </div>
                    )}
                </div>

                {step !== 'SEARCH' && step !== 'SUCCESS' && (
                    <button
                        onClick={() => {
                            if (step === 'VERIFY') setStep('SEARCH');
                            else if (step === 'CONFIG') setStep('VERIFY');
                            else if (step === 'INVITE') setStep('CONFIG');
                        }}
                        className="mt-8 flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all group"
                    >
                        <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                        Go Back
                    </button>
                )}
            </div>
        </div>
    );
}

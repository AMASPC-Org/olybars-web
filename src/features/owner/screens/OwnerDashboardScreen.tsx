import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { FormatCurrency } from '../../../utils/formatCurrency';
import { Beer, Settings, HelpCircle, X, Trophy, Users, Smartphone, Zap, Plus, Minus, Shield, ChevronRight, Info, QrCode, Download, Printer, Calendar, Crown, Clock, Lock, AlertTriangle, ShoppingBag, Utensils } from 'lucide-react';
import { Venue, UserProfile, GameStatus, PartnerTier, TIER_CONFIG, ScheduledDeal } from '../../../types';
import { format, addHours, parseISO } from 'date-fns';
import { OwnerMarketingPromotions } from '../../../components/OwnerMarketingPromotions';
import { useToast } from '../../../components/ui/BrandedToast';
import { ListingManagementTab } from '../components/ListingManagementTab';
import { LocalMakerManagementTab } from '../components/LocalMakerManagementTab'; // New Component
import { LeagueHostManagementTab } from '../components/LeagueHostManagementTab'; // New Component
import { isVenueOwner, isVenueManager, isSystemAdmin } from '../../../types/auth_schema';
import { Layout, Gamepad2 } from 'lucide-react';
import { getGameTTL } from '../../../config/gameConfig';
import { UserManagementTab } from '../components/UserManagementTab';
import { EventsManagementTab } from '../components/EventsManagementTab';
import { VenueOpsService } from '../../../services/VenueOpsService';
import { ArtieManagerBriefing } from '../components/ArtieManagerBriefing';
import { VenueInsight } from '../../../types';
import { PhotoApprovalCard } from '../../admin/components/PhotoApprovalCard';
import { Camera } from 'lucide-react';
import { MenuManagementTab } from '../components/MenuManagementTab';
import { ScraperManagementTab } from '../components/ScraperManagementTab';
import { PartnerManualTab } from '../components/PartnerManualTab';
import { BackRoomManagementTab } from '../components/BackRoomManagementTab';
import { Book, ShieldCheck, Globe } from 'lucide-react';
import { MfaService } from '../../../services/mfaService';
import { BrewHouse } from '../../../components/dashboard/BrewHouse';


interface OwnerDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    venues: Venue[];
    updateVenue: (venueId: string, updates: Partial<Venue>) => Promise<void>;
    userProfile: UserProfile;
    initialVenueId?: string | null;
    initialView?: 'main' | 'marketing' | 'listing';
    isLoading?: boolean; // [NEW] Loading State
}

const WEEKLY_STATS = { totalClockIns: 142, newMembers: 18, returnRate: "34%", topNights: "Fri, Sat" };
const TOP_PLAYERS = [
    { rank: 1, handle: "BarFly_99", visits: 4 }, { rank: 2, handle: "TriviaKing", visits: 3 },
    { rank: 3, handle: "PNW_Hiker", visits: 3 }, { rank: 4, handle: "OlyOlyOxen", visits: 2 },
];
const DEAL_PRESETS = ["$1 Off Drafts", "$5 Well Drinks", "Half-Price Apps", "BOGO Burgers", "Industry Night"];

// [REMOVED] Obsolete Client-Side Score Calculation
// The Vibe Engine (server/src/venueService.ts) now handles all scoring via Density Physics.
// Do not attempt to replicate 0-100 logic here.

export const OwnerDashboardScreen: React.FC<OwnerDashboardProps> = ({
    isOpen, onClose, venues, updateVenue, userProfile,
    initialVenueId, initialView = 'main', isLoading = false
}) => {
    const navigate = useNavigate();

    // [DIAGNOSTIC] Debug Auth Logic
    React.useEffect(() => {
        if (isOpen) {
            console.log('[OwnerDashboard] Mounting with:', {
                venuesCount: venues.length,
                isLoading,
                userId: userProfile.uid,
                isSuperAdmin: isSystemAdmin(userProfile),
                venuePermissions: userProfile.venuePermissions
            });
        }
    }, [isOpen, venues.length, isLoading, userProfile]);

    const accessibleVenues = venues.filter(v => {
        if (isSystemAdmin(userProfile)) return true;
        return isVenueManager(userProfile, v.id);
    });

    const [selectedVenueId, setSelectedVenueId] = useState<string | null>(initialVenueId || null);

    // Effect to auto-select first venue if none selected
    React.useEffect(() => {
        if (!selectedVenueId && accessibleVenues.length > 0) {
            setSelectedVenueId(accessibleVenues[0].id);
        }
    }, [accessibleVenues, selectedVenueId]);

    const myVenue = accessibleVenues.find(v => v.id === selectedVenueId) || accessibleVenues[0];

    // Gatekeeper Notice State (Session based for demo simplicity)
    const [showWelcome, setShowWelcome] = useState(true);

    const [dealText, setDealText] = useState('');
    const [dealDescription, setDealDescription] = useState('');
    const [dealTaskDescription, setDealTaskDescription] = useState('');
    const [dealDuration, setDealDuration] = useState(60);
    const [showArtieCommands, setShowArtieCommands] = useState(false);
    const [dashboardView, setDashboardView] = useState<'main' | 'marketing' | 'listing' | 'menu' | 'scraper' | 'maker' | 'host' | 'qr' | 'people' | 'events' | 'reports' | 'manual' | 'backroom'>(initialView as any); // Added 'menu', 'scraper', 'manual', 'backroom'
    const [hourlyReport, setHourlyReport] = useState<any>(null);
    const [selectedReportDate, setSelectedReportDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [statsPeriod, setStatsPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');
    const [activityStats, setActivityStats] = useState({ earned: 0, redeemed: 0, activeUsers: 0 });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [scheduledDeals, setScheduledDeals] = useState<ScheduledDeal[]>([]);
    const [targetDate, setTargetDate] = useState(format(addHours(new Date(), 3), 'yyyy-MM-dd'));
    const [targetTime, setTargetTime] = useState(format(addHours(new Date(), 3), 'HH:00'));
    const [staffConfirmed, setStaffConfirmed] = useState(false);
    const [privateData, setPrivateData] = useState<any>(null);
    const [isLoadingPrivate, setIsLoadingPrivate] = useState(false);
    const { showToast } = useToast();

    // [SECURITY] MFA Enforcement Check for Partners
    const isMfaEnrolled = MfaService.isEnrolled(auth.currentUser);
    const isSuperAdmin = isSystemAdmin(userProfile);

    if (!isMfaEnrolled && !isSuperAdmin) {
        return (
            <div className="fixed inset-0 bg-background z-[100] flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-surface border-2 border-primary/20 rounded-3xl p-8 text-center space-y-6">
                    <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto border border-primary/30">
                        <Lock className="w-10 h-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white uppercase font-league">MFA Required</h2>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                            To protect venue data and maintain the "Zero-Trust" mandate, all venue partners must enable Multi-Factor Authentication.
                        </p>
                    </div>
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-left">
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                            <Shield className="w-3 h-3" />
                            Security Protocol
                        </p>
                        <p className="text-[10px] text-slate-300 font-medium">Please visit your Profile Settings to enroll a hardware key or phone number.</p>
                    </div>
                    <button
                        onClick={() => window.location.href = '/profile'}
                        className="w-full bg-primary text-black font-black py-4 rounded-xl uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                    >
                        Go to Settings
                    </button>
                    <button
                        onClick={onClose}
                        className="text-[10px] text-slate-500 hover:text-white font-bold uppercase tracking-widest"
                    >
                        Exit Dashboard
                    </button>
                </div>
            </div>
        );
    }

    React.useEffect(() => {
        if (isOpen) {
            if (initialVenueId) setSelectedVenueId(initialVenueId);
            if (initialView) setDashboardView(initialView);
        }
    }, [isOpen, initialVenueId, initialView]);

    React.useEffect(() => {
        if (dashboardView === 'marketing' && myVenue) {
            fetchStats();
        }
    }, [dashboardView, statsPeriod, myVenue?.id]);

    const fetchStats = async () => {
        if (!myVenue) return;
        setIsRefreshing(true);
        const { fetchActivityStats } = await import('../../../services/userService');
        const stats = await fetchActivityStats(myVenue.id, statsPeriod);
        setActivityStats(stats);
        setIsRefreshing(false);
    };

    const fetchScheduledDeals = async () => {
        if (!selectedVenueId) return;
        try {
            const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
            const q = query(
                collection(db, 'venues', selectedVenueId, 'scheduledDeals'),
                orderBy('startTime', 'asc')
            );
            const snapshot = await getDocs(q);
            const deals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledDeal));
            setScheduledDeals(deals);
        } catch (e) {
            console.error("Failed to fetch scheduled deals:", e);
        }
    };

    const fetchHourlyReport = async () => {
        if (!myVenue) return;
        const { fetchPartnerHourlyReport } = await import('../../../services/userService');
        try {
            const data = await fetchPartnerHourlyReport(myVenue.id, new Date(selectedReportDate).getTime());
            setHourlyReport(data);
        } catch (e) {
            showToast('FAILED TO FETCH HOURLY REPORT', 'error');
        }
    };

    React.useEffect(() => {
        if (dashboardView === 'reports' && myVenue) {
            fetchHourlyReport();
        }
    }, [dashboardView, selectedReportDate, myVenue?.id]);

    React.useEffect(() => {
        if (selectedVenueId && isOpen) {
            fetchScheduledDeals();
            fetchPrivateData();
        }
    }, [selectedVenueId, isOpen]);

    const fetchPrivateData = async () => {
        if (!selectedVenueId) return;
        setIsLoadingPrivate(true);
        try {
            const data = await VenueOpsService.getPrivateData(selectedVenueId);
            setPrivateData(data);
        } catch (e) {
            console.error("Failed to fetch private data:", e);
            // Non-blocking error for UI
        } finally {
            setIsLoadingPrivate(false);
        }
    };

    const handlePhotoTierApprove = async (venueId: string, photoId: string) => {
        const venue = venues.find(v => v.id === venueId);
        if (!venue || !venue.photos) return;

        const updatedPhotos = venue.photos.map(p =>
            p.id === photoId ? { ...p, marketingStatus: 'approved', venueAdminApprovedBy: userProfile.uid, isApprovedForFeed: true } as any : p
        );

        try {
            await updateVenue(venueId, { photos: updatedPhotos });
            showToast('PHOTO APPROVED FOR GALLERY', 'success');
        } catch (e) {
            showToast('FAILED TO APPROVE PHOTO', 'error');
        }
    };

    const handlePhotoTierReject = async (venueId: string, photoId: string) => {
        const venue = venues.find(v => v.id === venueId);
        if (!venue || !venue.photos) return;

        const updatedPhotos = venue.photos.map(p =>
            p.id === photoId ? { ...p, marketingStatus: 'rejected' } as any : p
        );

        try {
            await updateVenue(venueId, { photos: updatedPhotos });
            showToast('PHOTO REJECTED', 'success');
        } catch (e) {
            showToast('FAILED TO REJECT PHOTO', 'error');
        }
    };

    const handleTogglePhotoApproval = async (photoId: string, field: 'isApprovedForFeed' | 'isApprovedForSocial', currentVal: boolean) => {
        if (!myVenue) return;
        const { updatePhotoApproval } = await import('../../../services/userService');
        try {
            await updatePhotoApproval(myVenue.id, photoId, { [field]: !currentVal });
            updateVenue(myVenue.id, {
                photos: myVenue.photos?.map(p => p.id === photoId ? { ...p, [field]: !currentVal } : p)
            });
        } catch (e) {
            showToast("Failed to update photo status.", 'error');
        }
    };

    if (!isOpen) return null;

    // [FIX] Handling Loading State
    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[80] bg-background flex flex-col items-center justify-center p-6 animate-in fade-in">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <h2 className="text-xl font-bold uppercase text-white tracking-widest">Loading Venues...</h2>
            </div>
        );
    }

    if (!myVenue && accessibleVenues.length === 0) {
        return (
            <div className="fixed inset-0 z-[80] bg-background text-white flex flex-col items-center justify-center p-6">
                <Shield className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-xl font-bold uppercase">Access Denied</h2>
                <p className="text-slate-400 text-center mt-2 max-w-xs">
                    {venues.length === 0 ? "No active venues found in the system." : "Your account does not have management permissions for any active venues."}
                </p>
                <div className="mt-4 p-2 bg-slate-900 rounded text-[10px] font-mono text-slate-500">
                    Debug: {isSystemAdmin(userProfile) ? "SuperAdmin" : "Standard"} / {venues.length} Venues / UID: {userProfile.uid}
                </div>
                <button onClick={onClose} className="mt-8 bg-slate-800 px-6 py-2 rounded-md font-bold uppercase">Back to Pulse</button>
            </div>
        );
    }

    const handlePublishDeal = async () => {
        if (!dealText || !myVenue) return;
        try {
            await VenueOpsService.updateFlashBounty(myVenue.id, {
                title: dealText,
                description: dealDescription,
                duration: dealDuration,
                isActive: true,
                bounty_task_description: dealTaskDescription
            });
            setDealText('');
            setDealDescription('');
            setDealTaskDescription('');
            showToast('FLASH BOUNTY BROADCASTED TO NETWORK', 'success');
        } catch (e) {
            showToast('FAILED TO PUBLISH BOUNTY', 'error');
        }
    };

    const handleScheduleDeal = async () => {
        if (!dealText || !myVenue) return;
        if (!staffConfirmed) {
            showToast('PLEASE CONFIRM STAFF BRIEFING FIRST', 'error');
            return;
        }

        const start = parseISO(`${targetDate}T${targetTime}`);

        try {
            // 1. Validate
            const validation = await VenueOpsService.validateSlot(myVenue, start.getTime(), dealDuration);
            if (!validation.valid) {
                showToast(validation.reason || 'INVALID SLOT', 'error');
                return;
            }

            // 2. Schedule
            await VenueOpsService.scheduleFlashBounty(myVenue.id, {
                venueId: myVenue.id,
                title: dealText,
                description: dealDescription,
                bounty_task_description: dealTaskDescription,
                startTime: start.getTime(),
                endTime: start.getTime() + (dealDuration * 60 * 1000),
                durationMinutes: dealDuration,
                status: 'PENDING',
                staffBriefingConfirmed: true,
                createdBy: 'MANUAL',
                createdAt: Date.now()
            });

            showToast('FLASH BOUNTY SCHEDULED SUCCESSFULLY', 'success');
            setDealText('');
            setDealDescription('');
            setDealTaskDescription('');
            setStaffConfirmed(false);
            fetchScheduledDeals();
        } catch (e: any) {
            showToast(e.message || 'FAILED TO SCHEDULE BOUNTY', 'error');
        }
    };

    const handleCancelScheduledDeal = async (dealId: string) => {
        if (!myVenue || !dealId) return;
        try {
            const { doc, updateDoc, increment } = await import('firebase/firestore');
            const dealRef = doc(db, 'venues', myVenue.id, 'scheduledDeals', dealId);
            const venueRef = doc(db, 'venues', myVenue.id);

            await updateDoc(dealRef, { status: 'CANCELLED' });
            // Refund token? The spec doesn't explicitly say, but it's fair. 
            // However, the tokens are usually "monthly allowance", and used count is reset monthly.
            // Let's stick to the spec: "Tokens are deducted upon scheduling."

            showToast('DEAL CANCELLED', 'success');
            fetchScheduledDeals();
        } catch (e) {
            showToast('FAILED TO CANCEL DEAL', 'error');
        }
    };

    const clearDeal = async () => {
        if (!myVenue) return;
        try {
            await VenueOpsService.updateFlashBounty(myVenue.id, { isActive: false });
            showToast('FLASH BOUNTY TERMINATED', 'success');
        } catch (e) {
            showToast('FAILED TO CLEAR BOUNTY', 'error');
        }
    };

    const adjustClockIns = (delta: number) => {
        if (!myVenue) return;
        const newCount = Math.max(0, (myVenue.clockIns || 0) + delta);
        updateVenue(myVenue.id, {
            clockIns: newCount,
            manualClockIns: newCount,
            manualClockInsExpiresAt: Date.now() + (60 * 60 * 1000) // 60m TTL
        });
    };

    const setManualVibe = (status: any) => {
        if (!myVenue) return;
        updateVenue(myVenue.id, {
            status,
            manualStatus: status,
            manualStatusExpiresAt: Date.now() + (45 * 60 * 1000) // 45m TTL
        });
    };

    const handleArtieActionApproved = async (insight: VenueInsight) => {
        if (!myVenue) return;
        try {
            // 1. Execute the skill
            if (insight.actionSkill === 'update_flash_deal') {
                await VenueOpsService.updateFlashBounty(myVenue.id, {
                    title: insight.actionParams.summary as string,
                    description: insight.actionParams.details as string,
                    duration: parseInt(insight.actionParams.duration as string) || 60,
                    isActive: true
                });
            }

            // 2. Deduct points from Bank (Zero-Trust source)
            const currentBank = (privateData?.pointBank !== undefined) ? privateData.pointBank : (myVenue.pointBank || 5000);
            const deduction = insight.pointCost || 500;
            const newBank = Math.max(0, currentBank - deduction);

            // 3. Update secure private data
            await VenueOpsService.updatePrivateData(myVenue.id, {
                pointBank: newBank
            });

            // Local state update for immediate UI feedback
            setPrivateData((prev: any) => prev ? { ...prev, pointBank: newBank } : { pointBank: newBank });

            showToast(`${insight.actionLabel.toUpperCase()} - BANK UPDATED`, 'success');
        } catch (e) {
            console.error('Failed to execute Artie action:', e);
            showToast('ACTION FAILED', 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-[80] bg-[#0f172a] text-white flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-start shrink-0 bg-black">
                <div className="flex items-center gap-4">
                    <div className="bg-primary p-3 rounded-lg border border-white/20">
                        <Beer className="w-8 h-8 text-black" strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter font-league leading-none">
                                THE BREW HOUSE
                            </h2>
                            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/30 font-black uppercase tracking-widest">
                                Admin Dashboard
                            </span>
                        </div>
                        <div className="flex flex-col mt-2">
                            {accessibleVenues.length > 1 ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-league">Managing:</span>
                                    <div className="relative inline-block">
                                        <select
                                            value={selectedVenueId || ''}
                                            onChange={(e) => setSelectedVenueId(e.target.value)}
                                            className="bg-primary/10 text-primary text-sm font-black uppercase tracking-widest outline-none appearance-none pl-2 pr-8 py-1 rounded border border-primary/20 cursor-pointer font-league hover:bg-primary/20 transition-colors"
                                        >
                                            {accessibleVenues.map(v => (
                                                <option key={v.id} value={v.id} className="bg-[#0f172a]">{v.name}</option>
                                            ))}
                                        </select>
                                        <ChevronRight className="w-3 h-3 text-primary absolute right-2 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-primary font-black uppercase tracking-widest font-league flex items-center gap-2">
                                    <span className="text-slate-500">Managing:</span> {myVenue?.name}
                                </p>
                            )}
                        </div>
                    </div>
                    {/* STATUS BADGE & LEVEL UP CTA */}
                    <div className="ml-8 hidden md:flex items-center gap-3">
                        <div className="px-3 py-1 bg-slate-800 rounded-md border border-white/10 flex flex-col items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-league">
                                {(privateData?.partnerConfig?.tier || myVenue.partnerConfig?.tier || PartnerTier.LOCAL)} TIER
                            </span>
                            <div className="flex items-center gap-1">
                                <Zap className="w-2.5 h-2.5 text-primary fill-current" />
                                <span className="text-[10px] font-black text-primary font-league">
                                    {(TIER_CONFIG[(privateData?.partnerConfig?.tier || myVenue.partnerConfig?.tier || PartnerTier.LOCAL) as PartnerTier]?.flashBountyLimit || 0) - (privateData?.partnerConfig?.flashBountiesUsed || myVenue.partnerConfig?.flashBountiesUsed || 0)} TOKENS
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                onClose();
                                navigate('/league-membership');
                            }}
                            className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black px-4 py-2 rounded-md shadow-lg shadow-yellow-900/20 hover:scale-105 transition-transform group"
                        >
                            <Crown className="w-4 h-4 text-black fill-black" />
                            <span className="text-[10px] font-black uppercase tracking-widest font-league">LEVEL UP</span>
                        </button>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                    <X className="w-10 h-10" strokeWidth={4} />
                </button>
            </div>

            {/* Gatekeeper Welcome Notice */}
            {showWelcome && (
                <div className="bg-blue-900/20 border-b border-blue-500/20 p-4 relative animate-in fade-in slide-in-from-top-2">
                    <div className="flex gap-4 items-start max-w-4xl mx-auto">
                        <Info className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
                        <div>
                            <h4 className="text-blue-400 font-black uppercase tracking-widest text-sm mb-1">Welcome to The Brew House</h4>
                            <p className="text-slate-300 text-xs leading-relaxed">
                                This is where the 98501 League is crafted.
                                <span className="block mt-2 text-slate-400">
                                    <strong>Note:</strong> League Host tools and Local Maker designations are gated features.
                                    To activate these for your venue, click the "Request Activation" button in your settings.
                                    The Commish manually vets all hosts to ensure we maintain the quality of the Artesian Anchor network.
                                </span>
                            </p>
                        </div>
                        <button onClick={() => setShowWelcome(false)} className="ml-auto text-slate-500 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            {/* Navigation Tabs - Mobile Optimized Scrollable Bar */}
            <div className="flex items-center overflow-x-auto whitespace-nowrap bg-black border-b border-white/5 scroll-smooth">
                <button
                    onClick={() => setDashboardView('main')}
                    className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === 'main' ? 'text-primary border-primary' : 'text-slate-500 border-transparent'}`}
                >
                    Operations
                </button>
                <button
                    onClick={() => setDashboardView('marketing')}
                    className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === 'marketing' ? 'text-primary border-primary' : 'text-slate-500 border-transparent'}`}
                >
                    Marketing
                </button>
                <button
                    onClick={() => setDashboardView('listing')}
                    className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === 'listing' ? 'text-primary border-primary' : 'text-slate-500 border-transparent'}`}
                >
                    Listing
                </button>
                <button
                    onClick={() => setDashboardView('backroom')}
                    className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === 'backroom' ? 'text-primary border-primary' : 'text-slate-500 border-transparent'}`}
                >
                    Back Room
                </button>
                <button
                    onClick={() => setDashboardView('menu')}
                    className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === 'menu' ? 'text-primary border-primary' : 'text-slate-500 border-transparent'}`}
                >
                    THE MENU
                </button>
                <button
                    onClick={() => setDashboardView('scraper')}
                    className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === 'scraper' ? 'text-primary border-primary' : 'text-slate-500 border-transparent'}`}
                >
                    Scrapers
                </button>
                <button
                    onClick={() => setDashboardView('events')}
                    className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === 'events' ? 'text-primary border-primary' : 'text-slate-500 border-transparent'}`}
                >
                    Events
                </button>
                {myVenue && isVenueOwner(userProfile, myVenue.id) && (
                    <>
                        {myVenue.isLocalMaker && (
                            <button
                                onClick={() => setDashboardView('maker')}
                                className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === 'maker' ? 'text-primary border-primary' : 'text-slate-500 border-transparent'}`}
                            >
                                Local Maker
                            </button>
                        )}
                        <button
                            onClick={() => setDashboardView('host')}
                            className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === 'host' ? 'text-primary border-primary' : 'text-slate-500 border-transparent'}`}
                        >
                            League
                        </button>
                        <button
                            onClick={() => setDashboardView('qr')}
                            className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === 'qr' ? 'text-primary border-primary' : 'text-slate-500 border-transparent'}`}
                        >
                            QR Assets
                        </button>
                        {isVenueManager(userProfile, myVenue.id) && (
                            <button
                                onClick={() => setDashboardView('reports')}
                                className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === 'reports' ? 'text-primary border-primary' : 'text-slate-500 border-transparent'}`}
                            >
                                Reports
                            </button>
                        )}
                        {(isVenueOwner(userProfile, myVenue.id) || myVenue.managersCanAddUsers) && (
                            <button
                                onClick={() => setDashboardView('people')}
                                className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === 'people' ? 'text-primary border-primary' : 'text-slate-500 border-transparent'}`}
                            >
                                People
                            </button>
                        )}
                        <button
                            onClick={() => setDashboardView('manual')}
                            className={`px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-2 ${dashboardView === 'manual' ? 'text-primary border-primary' : 'text-slate-500 border-transparent'}`}
                        >
                            THE MANUAL
                        </button>
                    </>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 p-6 pb-24">
                {myVenue && dashboardView === 'main' && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-surface p-4 border border-white/10 rounded-lg shadow-xl shrink-0">
                                <p className="text-[10px] uppercase font-black text-slate-500 mb-1 font-league">Live Clock-ins</p>
                                <p className="text-4xl font-black text-white font-league">{myVenue.clockIns || 0}</p>
                            </div>
                            <div className="bg-surface p-6 border border-white/10 rounded-lg shadow-xl">
                                <BrewHouse
                                    currentStatus={myVenue.status || 'mellow'}
                                    onStatusChange={setManualVibe}
                                    isLoading={isLoadingPrivate}
                                />
                            </div>
                        </div>

                        {/* Happy Hour Quick Action */}
                        <button
                            onClick={() => {
                                setDashboardView('listing');
                                setTimeout(() => {
                                    const element = document.getElementById('happy-hour-editor');
                                    if (element) {
                                        element.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }, 100);
                            }}
                            className="w-full bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-lg p-4 flex items-center justify-between group active:scale-[0.98] transition-all"
                        >
                            <div className="flex items-center gap-3 text-left">
                                <div className="p-2 bg-primary/20 rounded text-primary">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-white">RECURRING HAPPY HOUR</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Update daily deals & Buzz Clock text</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => {
                                    setDashboardView('listing');
                                    setTimeout(() => {
                                        const element = document.getElementById('hours-section');
                                        if (element) {
                                            element.scrollIntoView({ behavior: 'smooth' });
                                        }
                                    }, 100);
                                }}
                                className="w-full bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 rounded-lg p-4 flex items-center justify-between group active:scale-[0.98] transition-all"
                            >
                                <div className="flex items-center gap-3 text-left">
                                    <div className="p-2 bg-blue-500/20 rounded text-blue-400">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-white">UPDATE HOURS</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Manage standard & seasonal operating hours</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                onClick={() => {
                                    setDashboardView('listing');
                                    setTimeout(() => {
                                        const element = document.getElementById('fulfillment-section');
                                        if (element) {
                                            element.scrollIntoView({ behavior: 'smooth' });
                                        }
                                    }, 100);
                                }}
                                className="w-full bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 rounded-lg p-4 flex items-center justify-between group active:scale-[0.98] transition-all"
                            >
                                <div className="flex items-center gap-3 text-left">
                                    <div className="p-2 bg-green-500/20 rounded text-green-400">
                                        <ShoppingBag className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-white">LINKS & FULFILLMENT</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Reservations, Ticketing, & External URLs</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-green-400 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        {/* Live Game Status Management */}
                        {myVenue.hasGameVibeCheckEnabled && (
                            <div className="bg-surface p-6 border border-white/10 rounded-lg shadow-2xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <Gamepad2 className="w-5 h-5 text-purple-400" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-league">Live Game Status</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {myVenue.gameFeatures?.map(feature => {
                                        const statusData = myVenue.liveGameStatus?.[feature.id];
                                        const isTaken = statusData?.status === 'taken' && (!statusData?.expiresAt || Date.now() < statusData.expiresAt);

                                        return (
                                            <div key={feature.id} className="bg-black/40 p-3 rounded-lg flex items-center justify-between border border-white/5">
                                                <span className="text-xs font-bold text-slate-300 uppercase">{feature.name}</span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => updateVenue(myVenue.id, {
                                                            liveGameStatus: {
                                                                ...myVenue.liveGameStatus,
                                                                [feature.id]: { status: 'open', timestamp: Date.now(), reportedBy: 'owner' }
                                                            }
                                                        })}
                                                        className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-all ${!isTaken ? 'bg-green-500 text-black' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                                                    >
                                                        Open
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const ttl = getGameTTL(feature.id);
                                                            updateVenue(myVenue.id, {
                                                                liveGameStatus: {
                                                                    ...myVenue.liveGameStatus,
                                                                    [feature.id]: {
                                                                        status: 'taken',
                                                                        timestamp: Date.now(),
                                                                        reportedBy: 'owner',
                                                                        expiresAt: Date.now() + (ttl * 60 * 1000)
                                                                    }
                                                                }
                                                            });
                                                        }}
                                                        className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-all ${isTaken ? 'bg-red-500 text-white' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                                                    >
                                                        Taken
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Manual Override Console */}
                        <div className="bg-surface p-6 border border-white/10 rounded-lg shadow-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-league">Manual Headcount Adjust</h3>
                                {myVenue.manualClockInsExpiresAt && Date.now() < myVenue.manualClockInsExpiresAt && (
                                    <span className="text-[8px] font-black text-primary uppercase animate-pulse">
                                        Override Active ({Math.ceil((myVenue.manualClockInsExpiresAt - Date.now()) / 60000)}m)
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between max-w-xs mx-auto mb-6">
                                <button onClick={() => adjustClockIns(-1)} className="w-16 h-16 flex items-center justify-center bg-black border border-white/10 text-white rounded-xl active:scale-95 transition-transform">
                                    <Minus className="w-8 h-8" />
                                </button>
                                <p className="text-6xl font-black text-white font-league tabular-nums">{myVenue.clockIns || 0}</p>
                                <button onClick={() => adjustClockIns(1)} className="w-16 h-16 flex items-center justify-center bg-primary text-black rounded-xl active:scale-95 transition-transform">
                                    <Plus className="w-8 h-8" />
                                </button>
                            </div>

                            {/* [NEW] Capacity Configuration */}
                            <div className="bg-black/40 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-league">Venue Capacity</p>
                                    <p className="text-[9px] text-slate-600 font-bold">Denominator for Density Physics</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={myVenue.capacity || 50}
                                        onChange={(e) => updateVenue(myVenue.id, { capacity: parseInt(e.target.value) || 50 })}
                                        className="w-16 bg-slate-900 border border-slate-700 text-white font-bold text-center rounded py-1 outline-none focus:border-primary"
                                    />
                                    <span className="text-[10px] font-black text-slate-500 uppercase">MAX</span>
                                </div>
                            </div>
                        </div>

                        {/* Flash Bounty Management Section */}
                        <div className="space-y-6">
                            {/* Schedule New Deal Widget */}
                            <div className="bg-surface p-6 border border-white/10 border-dashed rounded-lg shadow-2xl relative">
                                <div className="absolute -top-4 left-6 bg-[#0f172a] border border-primary px-3 py-1 flex items-center gap-2 rounded-md">
                                    <Zap className="w-4 h-4 text-primary fill-current" />
                                    <span className="text-primary text-[10px] font-black uppercase tracking-widest font-league">SCHEDULE FLASH BOUNTY</span>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Deal Title</label>
                                        <input
                                            type="text"
                                            value={dealText}
                                            onChange={(e) => setDealText(e.target.value)}
                                            placeholder="EX: $5 DRAFTS..."
                                            className="w-full bg-black border border-white/10 rounded-lg p-4 text-primary font-black placeholder:text-slate-900 outline-none font-league"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date</label>
                                            <input
                                                type="date"
                                                value={targetDate}
                                                onChange={(e) => setTargetDate(e.target.value)}
                                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white font-bold outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Start Time</label>
                                            <input
                                                type="time"
                                                value={targetTime}
                                                step="900"
                                                onChange={(e) => setTargetTime(e.target.value)}
                                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white font-bold outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Duration</label>
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest font-league">{dealDuration} Minutes</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="30"
                                            max="180"
                                            step="30"
                                            value={dealDuration}
                                            onChange={(e) => setDealDuration(parseInt(e.target.value))}
                                            className="w-full accent-primary h-1.5 bg-black rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bounty Verification Task</label>
                                            <input
                                                type="text"
                                                value={dealTaskDescription}
                                                onChange={(e) => setDealTaskDescription(e.target.value)}
                                                placeholder="e.g. Take a photo of your receipt"
                                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white font-bold outline-none placeholder:text-slate-700"
                                            />
                                            <p className="text-[8px] text-slate-500 italic ml-1">Fallback: 'Upload a photo of your purchase'</p>
                                        </div>

                                        <div className="flex justify-between gap-3">
                                            <span className="text-[8px] text-slate-700 font-bold">30M</span>
                                            <span className="text-[8px] text-slate-700 font-bold">3H (CAP)</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setStaffConfirmed(!staffConfirmed)}
                                        className={`w-full p-4 rounded-lg border flex items-center gap-3 transition-all ${staffConfirmed ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-black border-red-500/20 text-slate-500'}`}
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${staffConfirmed ? 'bg-green-500 border-green-500' : 'border-slate-700'}`}>
                                            {staffConfirmed && <Shield className="w-3 h-3 text-black fill-current" />}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest font-league">Staff Briefing Confirmed (PIT Rule)</span>
                                    </button>

                                    <button
                                        onClick={handleScheduleDeal}
                                        disabled={!dealText || !staffConfirmed}
                                        className="w-full bg-primary text-black font-black py-4 rounded-lg uppercase tracking-widest text-lg font-league shadow-lg shadow-primary/10 disabled:opacity-30 active:scale-[0.98] transition-all"
                                    >
                                        Schedule Deal (-1 Token)
                                    </button>
                                </div>
                            </div>

                            {/* Upcoming Scheduled Deals List */}
                            {scheduledDeals.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Upcoming Schedule</h4>
                                    <div className="space-y-3">
                                        {scheduledDeals.filter(d => d.status === 'PENDING').map(deal => (
                                            <div key={deal.id} className="bg-surface p-4 border border-white/5 rounded-xl flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-black p-3 rounded-lg border border-white/5 flex flex-col items-center min-w-[60px]">
                                                        <span className="text-[8px] font-black text-primary uppercase font-league">{format(new Date(deal.startTime), 'MMM d')}</span>
                                                        <span className="text-sm font-black text-white font-league">{format(new Date(deal.startTime), 'h:mm a')}</span>
                                                    </div>
                                                    <div>
                                                        <h5 className="text-sm font-black text-white uppercase font-league leading-none">{deal.title}</h5>
                                                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-widest">
                                                            {deal.durationMinutes}M Duration • {deal.createdBy}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => deal.id && handleCancelScheduledDeal(deal.id)}
                                                    className="p-2 text-slate-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5 flex justify-center pb-8">
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/security');
                                }}
                                className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors group"
                            >
                                <Shield className="w-4 h-4 group-hover:text-primary transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-widest font-league group-hover:text-primary transition-colors">Partner Security & Data Protection</span>
                            </button>
                        </div>
                    </>
                )}

                {myVenue && dashboardView === 'marketing' && (
                    <div className="space-y-10">
                        {/* Artie Pro Briefing (New Hero Section) */}
                        <ArtieManagerBriefing venue={myVenue} onActionApproved={handleArtieActionApproved} />

                        {/* Points Reporting Section */}
                        <section className="space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase font-league leading-none">DROPS ANALYSIS</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Revenue & Engagement metrics</p>
                                </div>
                                <div className="flex bg-black p-1 rounded-lg border border-white/10 w-full sm:w-auto overflow-x-auto no-scrollbar">
                                    {['day', 'week', 'month', 'year'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setStatsPeriod(p as any)}
                                            className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${statsPeriod === p ? 'bg-primary text-black' : 'text-slate-500'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-surface p-4 border border-white/10 rounded-xl">
                                    <p className="text-[9px] font-black text-slate-500 uppercase font-league mb-1">Earned</p>
                                    <FormatCurrency amount={activityStats.earned} className="text-xl sm:text-2xl" />
                                </div>
                                <div className="bg-surface p-4 border border-white/10 rounded-xl">
                                    <p className="text-[9px] font-black text-slate-500 uppercase font-league mb-1">Redeemed</p>
                                    <FormatCurrency amount={-activityStats.redeemed} className="text-xl sm:text-2xl" variant="warning" />
                                </div>
                                <div className="bg-surface p-4 border border-white/10 rounded-xl">
                                    <p className="text-[9px] font-black text-slate-500 uppercase font-league mb-1">Active</p>
                                    <p className="text-xl sm:text-2xl font-black text-white font-league">{activityStats.activeUsers}</p>
                                </div>
                                <div className="bg-primary/5 p-4 border border-primary/20 rounded-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-1 opacity-20">
                                        <Zap className="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
                                    </div>
                                    <p className="text-[9px] font-black text-primary uppercase font-league mb-1">Reservoir</p>
                                    <FormatCurrency amount={((privateData?.pointBank !== undefined) ? privateData.pointBank : (myVenue.pointBank || 5000))} className="text-xl sm:text-2xl" hideSign />
                                </div>
                            </div>
                        </section>

                        {/* Photo Curation Section */}
                        <section className="space-y-6">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase font-league leading-none">PENDING PHOTO GALLERY</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Photos approved by OlyBars for your venue</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {myVenue.photos?.filter(p => p.marketingStatus === 'pending-venue').map(photo => (
                                    <PhotoApprovalCard
                                        key={photo.id}
                                        venue={myVenue}
                                        photo={photo}
                                        onApprove={handlePhotoTierApprove}
                                        onReject={handlePhotoTierReject}
                                    />
                                ))}
                                {(!myVenue.photos || myVenue.photos.filter(p => p.marketingStatus === 'pending-venue').length === 0) && (
                                    <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                                        <Camera className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                                        <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest font-league">No photos pending venue approval</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-8">
                                <h3 className="text-xl font-black text-white uppercase font-league leading-none">APPROVED GALLERY</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Live on your public listing</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {myVenue.photos?.filter(p => p.marketingStatus === 'approved').map(photo => (
                                    <div key={photo.id} className="bg-surface border border-white/10 rounded-xl overflow-hidden group">
                                        <div className="aspect-square bg-black relative">
                                            <img src={photo.url} alt="User vibe" className="w-full h-full object-cover" />
                                            <div className="absolute top-2 right-2 bg-green-500/80 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black text-black uppercase">
                                                LIVE
                                            </div>
                                        </div>
                                        <div className="p-2">
                                            <button
                                                onClick={() => handlePhotoTierReject(myVenue.id, photo.id!)}
                                                className="w-full py-1.5 text-[8px] font-black text-slate-500 hover:text-red-500 uppercase tracking-widest transition-colors"
                                            >
                                                Remove from Gallery
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(!myVenue.photos || myVenue.photos.filter(p => p.marketingStatus === 'approved').length === 0) && (
                                    <div className="col-span-full py-4 text-center">
                                        <p className="text-slate-700 font-bold uppercase text-[9px] tracking-widest font-league italic">Gallery is empty</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )}

                {myVenue && dashboardView === 'listing' && (
                    <ListingManagementTab
                        venue={myVenue}
                        venues={venues}
                        onUpdate={updateVenue}
                        userProfile={userProfile}
                    />
                )}

                {myVenue && dashboardView === 'backroom' && (
                    <BackRoomManagementTab
                        venue={myVenue}
                        onUpdate={(updates) => updateVenue(myVenue.id, updates)}
                    />
                )}

                {myVenue && dashboardView === 'maker' && isVenueOwner(userProfile, myVenue.id) && (
                    <LocalMakerManagementTab venue={myVenue} onUpdate={updateVenue} venues={venues} />
                )}

                {myVenue && dashboardView === 'host' && isVenueOwner(userProfile, myVenue.id) && (
                    <LeagueHostManagementTab venue={myVenue} onUpdate={updateVenue} />
                )}

                {myVenue && dashboardView === 'menu' && (
                    <MenuManagementTab
                        venue={myVenue}
                        onUpdate={(id, updates) => updateVenue(id, updates)}
                        userId={userProfile.uid}
                        userProfile={userProfile}
                    />
                )}

                {myVenue && dashboardView === 'scraper' && (
                    <ScraperManagementTab
                        venue={myVenue}
                        onUpdate={(id, updates) => updateVenue(id, updates)}
                        userProfile={userProfile}
                    />
                )}

                {myVenue && dashboardView === 'events' && (
                    <EventsManagementTab venue={myVenue} />
                )}

                {myVenue && dashboardView === 'qr' && (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase font-league leading-none">Vibe Check QR</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Physical Assets for On-Premise Verification</p>
                        </div>

                        <div className="bg-surface border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center space-y-6">
                            <div className="bg-white p-4 rounded-xl shadow-2xl">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://olybars.com/vc/${myVenue.id}`}
                                    alt="Venue QR Code"
                                    className="w-48 h-48"
                                />
                            </div>
                            <div>
                                <p className="text-primary font-black uppercase tracking-widest text-sm mb-2">Scan Target</p>
                                <code className="bg-black/50 px-3 py-1 rounded text-slate-400 text-xs font-mono">https://olybars.com/vc/{myVenue.id}</code>
                            </div>

                            <div className="flex gap-4 w-full">
                                <a
                                    href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=https://olybars.com/vc/${myVenue.id}&format=png`}
                                    download={`${myVenue.name.replace(/\s+/g, '_')}_QR.png`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-slate-800 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Download PNG
                                </a>
                                <button
                                    onClick={() => showToast('Printer integration coming in V2', 'info')}
                                    className="flex-1 bg-surface border border-white/10 text-slate-500 font-black py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                                >
                                    <Printer className="w-4 h-4" />
                                    Print Label
                                </button>
                            </div>

                            <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-xl text-left w-full">
                                <div className="flex gap-3">
                                    <Info className="w-5 h-5 text-blue-400 shrink-0" />
                                    <div>
                                        <p className="text-blue-400 font-black uppercase tracking-widest text-xs mb-1">Placement Guide</p>
                                        <ul className="text-slate-400 text-[10px] space-y-1 list-disc pl-4">
                                            <li>Place near the entrance or at the bar.</li>
                                            <li>Ensure good lighting for easy scanning.</li>
                                            <li>This code is permanent for your venue.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {myVenue && dashboardView === 'people' && (
                    <UserManagementTab venue={myVenue} onUpdate={(updates) => updateVenue(myVenue.id, updates)} currentUser={userProfile} />
                )}

                {myVenue && dashboardView === 'reports' && isVenueManager(userProfile, myVenue.id) && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 max-w-4xl mx-auto">
                        <header className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase font-league leading-none">HOURLY ACTIVITY</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Heatmap of point-earning actions</p>
                            </div>
                            <input
                                type="date"
                                value={selectedReportDate}
                                onChange={(e) => setSelectedReportDate(e.target.value)}
                                className="bg-black border border-white/10 rounded-lg p-2 text-xs font-bold text-primary outline-none"
                            />
                        </header>

                        <div className="bg-surface p-6 border border-white/10 rounded-2xl shadow-xl">
                            {hourlyReport ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                            <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Total Clock Ins</p>
                                            <p className="text-xl font-black text-white">
                                                {(Object.values(hourlyReport.hourly) as any[]).reduce((acc: number, h: any) => acc + (h.clockins || 0), 0)}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                            <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Drops Allocated</p>
                                            <p className="text-xl font-black text-amber-500">
                                                <FormatCurrency amount={(Object.values(hourlyReport.hourly) as any[]).reduce((acc: number, h: any) => acc + (h.points || 0), 0)} />
                                            </p>
                                        </div>
                                    </div>

                                    {/* Simple Hourly Visualizer */}
                                    <div className="h-48 flex items-end gap-1 px-2 border-b border-white/10 pb-2">
                                        {Object.entries(hourlyReport.hourly).map(([hour, data]: [string, any]) => {
                                            const max = Math.max(...Object.values(hourlyReport.hourly).map((h: any) => h.clockins || 0), 1);
                                            const height = ((data.clockins || 0) / max) * 100;
                                            return (
                                                <div key={hour} className="flex-1 flex flex-col items-center group relative">
                                                    <div className="absolute -top-10 bg-primary text-black text-[9px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                        {data.clockins || 0} hits
                                                    </div>
                                                    <div
                                                        className="w-full bg-primary/20 hover:bg-primary/40 transition-colors rounded-t-sm"
                                                        style={{ height: `${Math.max(height, 5)}%` }}
                                                    />
                                                    <span className="text-[8px] text-slate-600 mt-2 font-mono">{hour}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-center text-[9px] text-slate-600 italic">X-Axis: Hour (0-23) | Y-Axis: Live Clock Ins</p>
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center gap-4">
                                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs text-slate-500 uppercase font-black animate-pulse">Running Data Core...</p>
                                </div>
                            )}
                        </div>

                        {/* Activity Type Ledger */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Activity Breakdown</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {hourlyReport && Object.entries(hourlyReport.hourly)
                                    .filter(([_, data]: [string, any]) => (data.clockins || 0) > 0 || (data.vibeReports || 0) > 0)
                                    .map(([hour, data]: [string, any]) => (
                                        <div key={hour} className="bg-black/40 p-4 rounded-xl flex items-center justify-between border border-white/5">
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-black text-primary font-mono">{hour.padStart(2, '0')}:00</span>
                                                <div className="h-8 w-px bg-white/10" />
                                                <div className="flex gap-4">
                                                    <div>
                                                        <p className="text-[9px] text-slate-500 uppercase font-black">Clock Ins</p>
                                                        <p className="text-sm font-black text-white">{data.clockins || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] text-slate-500 uppercase font-black">Vibes</p>
                                                        <p className="text-sm font-black text-white">{data.vibeReports || 0}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] text-slate-500 uppercase font-black">Bonus Drops</p>
                                                <FormatCurrency amount={data.points || 0} variant="highlight" />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}

                {myVenue && dashboardView === 'manual' && (
                    <PartnerManualTab />
                )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-black border-t border-white/10 shrink-0">
                <button
                    onClick={onClose}
                    className="w-full bg-white text-[#0f172a] font-black py-4 rounded-lg shadow-xl uppercase tracking-widest font-league text-lg active:scale-95"
                >
                    Back to Pulse
                </button>
            </div>

            {/* Artie Commands Modal */}
            {
                showArtieCommands && (
                    <div className="fixed inset-0 bg-black/95 z-[90] flex items-center justify-center p-6 animate-in fade-in" onClick={() => setShowArtieCommands(false)}>
                        <div className="bg-surface border border-white/10 shadow-2xl w-full max-w-sm relative p-8 rounded-2xl" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setShowArtieCommands(false)} className="absolute top-4 right-4 text-slate-500">
                                <X className="w-8 h-8" />
                            </button>
                            <h3 className="text-3xl font-black text-primary uppercase mb-6 font-league text-center">Manage via Text</h3>
                            <p className="text-sm text-slate-400 mb-8 text-center">Text These commands to Artie to update your venue instantly.</p>
                            <div className="space-y-4">
                                <div className="bg-black/50 p-4 border border-white/10 rounded-xl">
                                    <p className="text-slate-500 mb-1 text-[10px] font-black uppercase font-league">Set Event:</p>
                                    <p className="font-bold text-white text-xs italic">"karaoke league night Friday 9pm"</p>
                                </div>
                            </div>
                            <button onClick={() => setShowArtieCommands(false)} className="w-full mt-10 bg-primary text-black font-black py-4 uppercase rounded-xl font-league">Got it</button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

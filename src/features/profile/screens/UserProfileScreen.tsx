import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import {
    User, Mail, Smartphone, Beer, Home, Trophy, Medal,
    Settings, Save, Lock, ChevronRight, Info, AlertTriangle,
    History, LogOut, CheckCircle2, X, Zap, Star, Clock, Share2, Shield // Added Shield
} from 'lucide-react';
import { UserProfile, Badge, UserRole, Venue, UserBadgeProgress } from '../../../types'; // Restored UserRole, Venue
import { BADGES } from '../../../config/badges';
import { shareAchievement } from '../../social/ShareService';
import {
    updatePassword,
    updateEmail,
    RecaptchaVerifier
} from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { updateUserProfile, fetchUserPointHistory } from '../../../services/userService';
import { useToast } from '../../../components/ui/BrandedToast';
import { Link, useNavigate } from 'react-router-dom';
import { isSystemAdmin } from '../../../types/auth_schema';
import { MfaService } from '../../../services/mfaService';
import { FormatCurrency } from '../../../utils/formatCurrency';
import { GAMIFICATION_CONFIG } from '../../../config/gamification';

interface UserProfileScreenProps {
    userProfile: UserProfile;
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
    venues: Venue[];
}

const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ userProfile, setUserProfile, venues }) => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'league' | 'badges'>('overview');
    const { showToast } = useToast();

    // Form State
    const initialHandle = userProfile.handle ? `#${userProfile.handle.replace(/^#/, '')}` : '';
    const [handle, setHandle] = useState(initialHandle);
    const [email, setEmail] = useState(userProfile.email || '');
    const [phone, setPhone] = useState(userProfile.phone || '');
    const [favoriteDrinks, setFavoriteDrinks] = useState<string[]>(userProfile.favoriteDrinks || (userProfile.favoriteDrink ? [userProfile.favoriteDrink] : []));
    const [weeklyBuzz, setWeeklyBuzz] = useState(userProfile.weeklyBuzz ?? false);
    const [homeBase, setHomeBase] = useState(userProfile.homeBase || '');
    const [newPassword, setNewPassword] = useState('');
    const [showMemberSince, setShowMemberSince] = useState(userProfile.showMemberSince ?? true);

    const [gamePrefs, setGamePrefs] = useState<string[]>(userProfile.playerGamePreferences || ['karaoke', 'trivia', 'arcade', 'live_music']);

    const isSuperAdmin = isSystemAdmin(userProfile);
    const isPartner = userProfile.role === 'owner' || (userProfile.venuePermissions && Object.keys(userProfile.venuePermissions).length > 0);

    // MFA Enrollment State
    const [mfaStep, setMfaStep] = useState<'none' | 'phone' | 'code'>('none');
    const [mfaPhone, setMfaPhone] = useState(userProfile.phone || '');
    const [mfaCode, setMfaCode] = useState('');
    const [verificationId, setVerificationId] = useState('');
    const [enrolledFactors, setEnrolledFactors] = useState<any[]>([]);
    const [recaptchaVerifier, setRecaptchaVerifier] = useState<any>(null);
    const [pendingPoints, setPendingPoints] = useState(0);

    useEffect(() => {
        if (auth.currentUser) {
            setEnrolledFactors(MfaService.getEnrolledFactors(auth.currentUser));

            // Fetch point history to calculate pending points
            const getPending = async () => {
                const history = await fetchUserPointHistory();
                const pending = history
                    .filter((h: any) => h.status === 'PENDING')
                    .reduce((sum: number, h: any) => sum + (h.points || 0), 0);
                setPendingPoints(pending);
            };
            getPending();
        }
    }, [userProfile.uid]);

    const isMfaActive = enrolledFactors.length > 0;

    // Handle Change Logic
    const lastChanged = userProfile.handleLastChanged || 0;
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const cooldownActive = (Date.now() - lastChanged) < thirtyDaysInMs;
    const daysRemaining = Math.ceil((thirtyDaysInMs - (Date.now() - lastChanged)) / (24 * 60 * 60 * 1000));

    // Sync local state with props (for menu toggles etc)
    useEffect(() => {
        setWeeklyBuzz(userProfile.weeklyBuzz ?? false);
        setHomeBase(userProfile.homeBase || '');
        setPhone(userProfile.phone || '');
        setFavoriteDrinks(userProfile.favoriteDrinks || (userProfile.favoriteDrink ? [userProfile.favoriteDrink] : []));
        setShowMemberSince(userProfile.showMemberSince ?? true);
    }, [userProfile.weeklyBuzz, userProfile.homeBase, userProfile.phone, userProfile.favoriteDrinks, userProfile.showMemberSince]);

    const handleRoleSwitch = (newRole: UserRole) => {
        setUserProfile(prev => ({ ...prev, role: newRole }));
        autoSaveUpdates({ role: newRole });
        showToast(`View Switched to: ${newRole.toUpperCase()}`, 'success');
    }

    // Unified Auto-Save for non-sensitive fields
    const autoSaveUpdates = useCallback(async (newUpdates: any) => {
        if (userProfile.uid === 'guest') return;
        try {
            const result = await updateUserProfile(userProfile.uid, {
                ...newUpdates,
                updatedAt: Date.now()
            });
            if (result.success) {
                setUserProfile(prev => ({ ...prev, ...result.updates }));
            }
        } catch (e) {
            console.error('Auto-save failed:', e);
        }
    }, [userProfile.uid, setUserProfile]);

    // Unsaved Changes Guard logic
    const currentCleanHandle = handle.replace(/^#/, '');
    const profileCleanHandle = (userProfile.handle || '').replace(/^#/, '');
    const isDirty = (
        currentCleanHandle !== profileCleanHandle ||
        email !== (userProfile.email || '') ||
        phone !== (userProfile.phone || '') ||
        JSON.stringify(favoriteDrinks) !== JSON.stringify(userProfile.favoriteDrinks || (userProfile.favoriteDrink ? [userProfile.favoriteDrink] : [])) ||
        newPassword !== ''
    );

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty && isEditing) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty, isEditing]);

    const handleTabSwitch = (tab: 'overview' | 'settings' | 'league' | 'badges') => {
        if (isDirty && isEditing) {
            if (!window.confirm("You have unsaved changes. Save them before switching?")) {
                return;
            }
            handleSaveProfile();
        }
        setActiveTab(tab);
    };

    const handleSaveProfile = async () => {
        setIsLoading(true);
        try {
            const updates: any = {
                phone,
                favoriteDrinks,
                weeklyBuzz,
                homeBase,
                showMemberSince,
                playerGamePreferences: gamePrefs,
                updatedAt: Date.now(),
            };

            // Handle change logic
            const cleanHandle = handle.replace(/^#/, '');
            const profileCleanHandle = (userProfile.handle || '').replace(/^#/, '');

            if (cleanHandle !== profileCleanHandle) {
                if (cooldownActive && !isSuperAdmin) {
                    throw new Error(`Handle change locked! Wait ${daysRemaining} more days.`);
                }
                updates.handle = cleanHandle;
                updates.handleLastChanged = Date.now();
            }

            // 1. Update Profile via Backend
            const result = await updateUserProfile(userProfile.uid, updates);

            if (!result.success) throw new Error(result.error || "Update failed");

            // 2. Update Auth (Sensitive)
            if (email !== userProfile.email && auth.currentUser) {
                await updateEmail(auth.currentUser, email);
                updates.email = email;
            }
            if (newPassword && auth.currentUser) {
                await updatePassword(auth.currentUser, newPassword);
                setNewPassword('');
            }

            // 3. Update Local State (with server-confirmed updates)
            setUserProfile(prev => ({ ...prev, ...result.updates }));
            setIsEditing(false);
            showToast("Profile Optimized!", 'success');
        } catch (e: any) {
            showToast(e.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleGamePref = (prefId: string) => {
        setGamePrefs(prev =>
            prev.includes(prefId) ? prev.filter(p => p !== prefId) : [...prev, prefId]
        );
    };

    const handleStartMfaEnrollment = async () => {
        if (!auth.currentUser || !mfaPhone) return;
        setIsLoading(true);
        try {
            const verifier = MfaService.createRecaptchaVerifier('recaptcha-enroll-container');
            setRecaptchaVerifier(verifier);
            const vId = await MfaService.startEnrollment(auth.currentUser, mfaPhone, verifier);
            setVerificationId(vId);
            setMfaStep('code');
            showToast("Verification code sent!", "success");
        } catch (error: any) {
            console.error("MFA Error:", error);
            if (error.code === 'auth/requires-recent-login') {
                showToast("SECURITY TIMEOUT: PLEASE RE-LOGIN TO ENROLL MFA", "error");
            } else {
                showToast(error.message || "Failed to start MFA enrollment", "error");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyMfaEnrollment = async () => {
        if (!auth.currentUser || !verificationId || !mfaCode) return;
        setIsLoading(true);
        try {
            await MfaService.finishEnrollment(auth.currentUser, verificationId, mfaCode);

            setEnrolledFactors(MfaService.getEnrolledFactors(auth.currentUser));
            setMfaStep('none');
            showToast("MFA ENROLLED SUCCESSFULLY", "success");

            // Sync phone to profile if it changed
            if (mfaPhone !== userProfile.phone) {
                autoSaveUpdates({ phone: mfaPhone });
            }

            // Cleanup recaptcha
            if (recaptchaVerifier) {
                recaptchaVerifier.clear();
                setRecaptchaVerifier(null);
            }
        } catch (error: any) {
            console.error("MFA Verify Error:", error);
            showToast("Invalid code or enrollment failed", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnenrollMfa = async () => {
        if (!auth.currentUser) return;

        const isVenuePartner = MfaService.isPartner(userProfile);
        if (isVenuePartner) {
            if (!window.confirm("WARNING: DISABLING MFA AS A PARTNER WILL REVOKE YOUR SESSION FOR SECURITY. YOU MUST RE-LOGIN TO RE-ENABLE. PROCEED?")) {
                return;
            }
        }

        setIsLoading(true);
        try {
            await MfaService.unenroll(auth.currentUser);
            setEnrolledFactors([]);
            showToast("MFA DISABLED", "info");

            if (isVenuePartner) {
                await MfaService.revokeSession();
                navigate('/auth');
            }
        } catch (error: any) {
            console.error("MFA Unenroll Error:", error);
            showToast("FAILED TO DISABLE MFA. RE-LOGIN MAY BE REQUIRED.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleShareBadge = async (badgeProgress: UserBadgeProgress) => {
        const badgeConfig = BADGES.find(b => b.id === badgeProgress.badgeId);
        if (!badgeConfig) return;

        const venueId = badgeConfig.criteria.venueIds?.[0];
        const venue = venueId ? venues.find(v => v.id === venueId) : null;
        const venueName = venue?.name || "OlyBars";

        const shareCopy = `Pit-approved! Just unlocked the ${badgeConfig.name} badge at ${venueName}! check out olybars.com #OlyBars #98501`;

        await shareAchievement(
            badgeConfig.name,
            venueName,
            shareCopy,
            async () => {
                const newPoints = (userProfile.stats?.competitionPoints || 0) + 5;

                const updates = {
                    stats: {
                        seasonPoints: userProfile.stats?.seasonPoints || 0,
                        lifetimeClockins: userProfile.stats?.lifetimeClockins || 0,
                        currentStreak: userProfile.stats?.currentStreak || 0,
                        vibeCheckCount: userProfile.stats?.vibeCheckCount || 0,
                        competitionPoints: newPoints
                    }
                };

                try {
                    const result = await updateUserProfile(userProfile.uid, updates);
                    if (result.success) {
                        setUserProfile(prev => ({
                            ...prev,
                            stats: {
                                ...prev.stats!,
                                competitionPoints: newPoints
                            }
                        }));
                        showToast("+5 DROPS AWARDED!", "success");
                    }
                } catch (e) {
                    console.error("Social bounty update failed:", e);
                }
            }
        );
    };

    return (
        <div className="bg-background min-h-screen text-white font-body pb-24">
            {/* Header / Banner */}
            <div className="relative h-48 bg-gradient-to-br from-slate-900 via-black to-slate-900 overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.1),transparent)]" />
                </div>

                <div className="absolute bottom-6 left-6 flex items-end gap-6">
                    <div className="w-24 h-24 rounded-3xl bg-slate-800 border-4 border-background shadow-2xl flex items-center justify-center relative group overflow-hidden">
                        <User className="w-12 h-12 text-slate-600 group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Save className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                    <div className="pb-2">
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black uppercase tracking-tighter font-league">
                                {userProfile.handle ? `#${userProfile.handle.toUpperCase()}` : 'GUEST OPERATOR'}
                            </h2>
                            <div className="px-2 py-0.5 bg-primary text-black text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1 shadow-lg">
                                <Trophy className="w-2.5 h-2.5" />
                                {userProfile.role.toUpperCase()}
                            </div>
                            {userProfile.role === 'guest' && (
                                <button
                                    onClick={async () => {
                                        try {
                                            await updateUserProfile(userProfile.uid, { role: 'user' });
                                            setUserProfile(prev => ({ ...prev, role: 'user' }));
                                            showToast("Welcome to the League!", "success");
                                        } catch (e) { showToast("Upgrade failed", "error"); }
                                    }}
                                    className="px-3 py-1 bg-slate-800 text-primary border border-primary text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg hover:bg-slate-700 transition-colors"
                                >
                                    ACTIVATE
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                            <div className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3" /> {userProfile.email}
                            </div>
                            {userProfile.createdAt && showMemberSince && (
                                <div className="flex items-center gap-1.5 border-l border-white/10 pl-4">
                                    <Clock className="w-3 h-3" /> EST. {format(userProfile.createdAt, 'MMM yyyy').toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Admin Override for Testing Swapping roles */}
            {isSystemAdmin(userProfile) && (
                <div className="bg-slate-900 border-y border-white/5 px-6 py-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-xs font-black uppercase tracking-widest text-primary font-league">View Mode Switcher</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {(['admin', 'owner', 'manager', 'user'] as UserRole[]).map((role) => (
                            <button
                                key={role}
                                onClick={() => handleRoleSwitch(role)}
                                className={`py-2 px-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${userProfile.role === role
                                    ? 'bg-primary text-black border-primary'
                                    : 'bg-white/5 text-slate-400 border-white/10'
                                    }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex px-6 border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-10">
                {(['overview', 'settings', 'league', 'badges'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => handleTabSwitch(tab)}
                        className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="p-6 space-y-8">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface p-4 rounded-2xl border border-white/5 shadow-xl">
                            <History className="w-5 h-5 text-blue-400 mb-3" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Clock-ins</p>
                            <p className="text-2xl font-black font-league">{userProfile.stats?.lifetimeClockins || 0}</p>
                        </div>
                        <div className="bg-surface p-4 rounded-2xl border border-white/5 shadow-xl">
                            <Zap className="w-5 h-5 text-yellow-400 mb-3" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Streak</p>
                            <p className="text-2xl font-black font-league">{userProfile.stats?.currentStreak || 0}D</p>
                        </div>
                        <div className="bg-surface p-4 rounded-2xl border border-white/5 shadow-xl">
                            <CheckCircle2 className="w-5 h-5 text-green-400 mb-3" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Vibe Checks</p>
                            <p className="text-2xl font-black font-league">{userProfile.stats?.vibeCheckCount || 0}</p>
                        </div>
                        <div className="bg-surface p-4 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group">
                            <Trophy className="w-5 h-5 text-primary mb-3" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Well Depth</p>
                            <div className="flex items-baseline gap-1.5">
                                <FormatCurrency amount={userProfile.stats?.competitionPoints || 0} showLabel={true} className="text-2xl" />
                                {pendingPoints > 0 && (
                                    <p className="text-sm font-black text-slate-500 font-league animate-pulse">(+{pendingPoints})</p>
                                )}
                            </div>
                        </div>

                        {/* [NEW] SUPER-ADMIN QUICK ACCESS */}
                        {isSystemAdmin(userProfile) && (
                            <div className="col-span-2 bg-gradient-to-r from-red-950/40 to-black border border-red-500/30 p-5 rounded-2xl relative overflow-hidden group hover:border-red-500/60 transition-all cursor-pointer" onClick={() => navigate('/admin')}>
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Shield className="w-24 h-24 text-red-500" />
                                </div>
                                <div className="relative z-10 flex justify-between items-center">
                                    <div>
                                        <h4 className="text-xl font-black text-red-500 uppercase font-league">System Control</h4>
                                        <p className="text-[10px] text-red-200/60 font-bold uppercase tracking-widest">Global Management & Integrity</p>
                                    </div>
                                    <button
                                        className="py-2 px-4 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-lg shadow-lg group-hover:bg-red-500 transition-colors"
                                    >
                                        ENTER ADMIN PANEL
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Maker's Trail Progress */}
                        <div className="col-span-2 bg-gradient-to-r from-amber-950 to-amber-900 border border-amber-500/30 p-5 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Trophy className="w-24 h-24 text-amber-500" />
                            </div>
                            <div className="relative z-10 flex justify-between items-end mb-2">
                                <div>
                                    <h4 className="text-xl font-black text-amber-500 uppercase font-league">Maker's Trail</h4>
                                    <p className="text-[10px] text-amber-200/60 font-bold uppercase tracking-widest">Support Local, Get Rewards</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-white font-league">{userProfile.makersTrailProgress || 0}/5</span>
                                </div>
                            </div>
                            <div className="w-full bg-black/50 h-3 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className="h-full bg-amber-500 transition-all duration-1000 ease-out"
                                    style={{ width: `${((userProfile.makersTrailProgress || 0) / 5) * 100}%` }}
                                />
                            </div>
                            <p className="text-[9px] text-amber-200/50 uppercase font-bold mt-2 text-right">
                                {userProfile.makersTrailProgress && userProfile.makersTrailProgress >= 5
                                    ? 'TRAIL COMPLETE - LEGEND STATUS'
                                    : 'Visit High-Traffic Venues to Advance'}
                            </p>

                            {/* [NEW] REDEEM GEAR BUTTON */}
                            {(userProfile.makersTrailProgress && userProfile.makersTrailProgress >= 5) || isSystemAdmin(userProfile) && (
                                <button
                                    onClick={() => navigate('/merch')}
                                    className="w-full mt-4 py-3 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg hover:scale-[1.02] transition-transform active:scale-95 border-2 border-black"
                                >
                                    REDEEM EXCLUSIVE GEAR
                                </button>
                            )}
                        </div>

                        {/* Vibe Profile Card */}
                        <div className="col-span-2 bg-gradient-to-br from-slate-900 to-black p-6 rounded-3xl border border-white/10 relative overflow-hidden">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight font-league">Vibe Profile</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Favorite Spots & Sips</p>
                                </div>
                                <button onClick={() => { setActiveTab('settings'); setIsEditing(true); }} className="p-2 bg-white/5 rounded-lg hover:bg-white/10">
                                    <Settings className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                        <Home className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-slate-500 uppercase">Home Base</p>
                                        <p className="text-sm font-black uppercase font-league text-white">
                                            {venues.find(v => v.id === userProfile.homeBase)?.name || 'Not Set'}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                                            <Beer className="w-5 h-5 text-amber-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-slate-500 uppercase">Preferred Sips</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {(() => {
                                                    const drinks = [
                                                        ...(userProfile.favoriteDrinks || []),
                                                        ...(userProfile.favoriteDrink ? [userProfile.favoriteDrink] : [])
                                                    ].filter((v, i, a) => a.indexOf(v) === i); // Dedupe

                                                    return drinks.length > 0 ? (
                                                        drinks.map((drink, i) => (
                                                            <span key={i} className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-black uppercase text-slate-200 border border-white/5">
                                                                {drink}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <p className="text-[10px] text-slate-600 font-bold uppercase italic">No sips listed.</p>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Star className="w-3 h-3 text-primary fill-primary" />
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Favorite Spots</p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {(() => {
                                            const favIds = userProfile.favorites || [];
                                            const favVenues = venues.filter(v => favIds.includes(v.id));

                                            // Sort: Home Base first, then alphabetical
                                            const sortedFavs = [...favVenues].sort((a, b) => {
                                                if (a.id === userProfile.homeBase) return -1;
                                                if (b.id === userProfile.homeBase) return 1;
                                                return a.name.localeCompare(b.name);
                                            });

                                            return sortedFavs.length > 0 ? (
                                                sortedFavs.map(v => (
                                                    <div key={v.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 group">
                                                        <div className="flex items-center gap-2">
                                                            {v.id === userProfile.homeBase && <Home className="w-3 h-3 text-primary" />}
                                                            <span className={`text-xs font-bold uppercase font-league ${v.id === userProfile.homeBase ? 'text-primary' : 'text-slate-200'}`}>
                                                                {v.name}
                                                            </span>
                                                        </div>
                                                        <Star className="w-3 h-3 text-primary fill-primary" />
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-[10px] text-slate-600 font-bold uppercase italic px-1">No favorites listed yet.</p>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-8 animate-in slide-in-from-right duration-300">
                        <header className="flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter font-league">Vibe Tuning</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Refine your operator preferences</p>
                            </div>
                            <button
                                onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                                disabled={isLoading}
                                className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${isEditing
                                    ? 'bg-primary text-black shadow-primary/20 hover:bg-yellow-400'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                {isLoading ? <Zap className="w-3 h-3 animate-spin" /> : isEditing ? <Save className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
                                {isEditing ? (isDirty ? 'SYNC' : 'SAVED') : 'EDIT'}
                            </button>
                        </header>

                        <div className="space-y-6">
                            {/* Personal Details */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">League Handle</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                        <span className="font-league font-black text-lg">#</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={handle}
                                        onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_#]/g, ''))}
                                        disabled={!isEditing || (cooldownActive && !isSuperAdmin)}
                                        placeholder="OLY_LEGEND"
                                        className={`w-full bg-slate-900 border ${isEditing && (!cooldownActive || isSuperAdmin) ? 'border-primary' : 'border-white/5'} rounded-2xl py-4 pl-10 pr-4 text-sm font-black uppercase font-league outline-none disabled:opacity-50`}
                                    />
                                    <div className="flex justify-between items-center mt-2 px-1">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
                                            <Info className="w-3 h-3 text-primary" /> 3-15 Alphanumeric characters
                                        </p>
                                        {isEditing && cooldownActive && !isSuperAdmin && (
                                            <div className="text-[10px] text-primary font-black uppercase flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded">
                                                <Lock className="w-3 h-3" /> Locked for {daysRemaining}D
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Email & Phone */}
                            <div className="grid grid-cols-1 gap-4 pt-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Secure Contact (Email)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={!isEditing}
                                            className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Dispatch Line (Phone)</label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            disabled={!isEditing}
                                            placeholder="555-555-5555"
                                            className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none disabled:opacity-50 font-mono text-primary"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 ml-1 flex items-center gap-1.5">
                                        <AlertTriangle className="w-3 h-3 text-amber-500" /> Use format: 555-555-5555
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 pt-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Preferred Sips (Comma Separated)</label>
                                    <div className="relative">
                                        <Beer className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            value={favoriteDrinks.join(', ')}
                                            onChange={(e) => setFavoriteDrinks(e.target.value.split(',').map(s => s.trim()).filter(s => s !== ''))}
                                            disabled={!isEditing}
                                            placeholder="Old Fashioned, Well 80, Cider..."
                                            className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-black uppercase font-league outline-none disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Home Base / HQ</label>
                                    <div className="relative">
                                        <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <select
                                            value={homeBase}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setHomeBase(val);
                                                if (isEditing) autoSaveUpdates({ homeBase: val });
                                            }}
                                            disabled={!isEditing}
                                            className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-black uppercase font-league outline-none disabled:opacity-50 appearance-none cursor-pointer text-white"
                                        >
                                            <option value="" disabled className="bg-slate-900 text-white">Select Home Base</option>
                                            {venues.map(v => (
                                                <option key={v.id} value={v.id} className="bg-slate-900 text-white">{v.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <Zap className={`w-5 h-5 ${weeklyBuzz ? 'text-primary' : 'text-slate-600'}`} />
                                        <div>
                                            <p className="text-xs font-black uppercase font-league">Weekly Buzz Signup</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase">The best of Oly in your inbox</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (isEditing) {
                                                const newVal = !weeklyBuzz;
                                                setWeeklyBuzz(newVal);
                                                autoSaveUpdates({ weeklyBuzz: newVal });
                                            }
                                        }}
                                        disabled={!isEditing}
                                        className={`w-12 h-6 rounded-full p-1 transition-all ${weeklyBuzz ? 'bg-primary' : 'bg-slate-800'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white transition-all ${weeklyBuzz ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Member Since Privacy Toggle */}
                            <div className="pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <Clock className={`w-5 h-5 ${showMemberSince ? 'text-yellow-500' : 'text-slate-600'}`} />
                                        <div>
                                            <p className="text-xs font-black uppercase font-league">Public Tenure Badge</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase">Show "Member Since" on profile</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (isEditing) {
                                                const newVal = !showMemberSince;
                                                setShowMemberSince(newVal);
                                                autoSaveUpdates({ showMemberSince: newVal });
                                            }
                                        }}
                                        disabled={!isEditing}
                                        className={`w-12 h-6 rounded-full p-1 transition-all ${showMemberSince ? 'bg-primary' : 'bg-slate-800'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white transition-all ${showMemberSince ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* [NEW] MFA PARTNER SECURITY SECTION */}
                            {(isPartner || isSuperAdmin) && (
                                <div className="pt-6 mt-6 border-t border-white/10 space-y-4">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Shield className="w-5 h-5" />
                                        <h4 className="text-sm font-black uppercase font-league">Partner Security (MFA)</h4>
                                    </div>
                                    <div id="recaptcha-enroll-container"></div>

                                    {isMfaActive ? (
                                        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-green-500/20 w-10 h-10 rounded-full flex items-center justify-center">
                                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-green-400 font-black uppercase tracking-widest">Active & Secure</p>
                                                    <p className="text-xs font-bold text-slate-300">Identity protected via SMS</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleUnenrollMfa}
                                                className="text-[9px] font-black text-slate-500 hover:text-red-500 transition-colors uppercase tracking-widest"
                                            >
                                                DISABLE
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl space-y-4">
                                            <div className="flex gap-4">
                                                <div className="bg-amber-500/20 w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0">
                                                    <Lock className="w-6 h-6 text-amber-500" />
                                                </div>
                                                <div>
                                                    <h5 className="text-sm font-black text-white uppercase font-league">Zero-Trust Mandate</h5>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed mt-1">
                                                        Venue owners must enable MFA to protect merchant data and venue listings.
                                                    </p>
                                                </div>
                                            </div>

                                            {mfaStep === 'none' ? (
                                                <button
                                                    onClick={() => setMfaStep('phone')}
                                                    className="w-full py-3 bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/10"
                                                >
                                                    Begin Enrollment
                                                </button>
                                            ) : mfaStep === 'phone' ? (
                                                <div className="space-y-3">
                                                    <input
                                                        type="tel"
                                                        value={mfaPhone}
                                                        onChange={(e) => setMfaPhone(e.target.value)}
                                                        placeholder="+1 360-555-0100"
                                                        className="w-full bg-black/50 border border-amber-500/30 rounded-xl py-3 px-4 text-sm font-bold text-white outline-none"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setMfaStep('none')}
                                                            className="flex-1 py-2 bg-white/5 text-slate-400 font-black text-[9px] uppercase tracking-widest rounded-lg"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={handleStartMfaEnrollment}
                                                            disabled={isLoading}
                                                            className="flex-[2] py-2 bg-primary text-black font-black text-[9px] uppercase tracking-widest rounded-lg disabled:opacity-50"
                                                        >
                                                            {isLoading ? 'Sending...' : 'Send SMS Code'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <p className="text-[9px] text-amber-500 font-black uppercase text-center">Enter 6-Digit Verification Key</p>
                                                    <input
                                                        type="text"
                                                        value={mfaCode}
                                                        onChange={(e) => setMfaCode(e.target.value)}
                                                        maxLength={6}
                                                        placeholder="000000"
                                                        className="w-full bg-black/50 border border-primary/30 rounded-xl py-4 text-center text-xl font-black text-white outline-none tracking-[1em] pl-[1em]"
                                                    />
                                                    <button
                                                        onClick={handleVerifyMfaEnrollment}
                                                        disabled={isLoading || mfaCode.length < 6}
                                                        className="w-full py-3 bg-primary text-black font-black text-[10px] uppercase tracking-widest rounded-xl disabled:opacity-50"
                                                    >
                                                        {isLoading ? 'Verifying...' : 'Finalize Security'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Password Management */}
                            {isEditing && (
                                <div className="pt-6 mt-6 border-t border-white/5 space-y-4">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Lock className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase">Security Update</span>
                                    </div>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Set New League Password"
                                        className="w-full bg-slate-900 border border-primary/30 rounded-2xl py-4 px-4 text-sm font-bold outline-none"
                                    />
                                    <p className="text-[9px] text-slate-500 font-bold uppercase italic">Leave blank to keep your current access key.</p>
                                </div>
                            )}

                            {/* Dual Sync Button - Bottom of Form for Accessibility */}
                            <div className="pt-6 mt-4 pb-8 border-t border-white/5 text-center">
                                <button
                                    onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                                    disabled={isLoading || (isEditing && !isDirty)}
                                    className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${isEditing
                                        ? isDirty
                                            ? 'bg-primary text-black shadow-primary/20 hover:bg-yellow-400'
                                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    {isLoading ? <Zap className="w-4 h-4 animate-spin" /> : isEditing ? <Save className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                                    {isEditing ? (isDirty ? 'SYNC CHANGES' : 'ALL SYNCED') : 'EDIT PROFILE'}
                                </button>
                                {isEditing && isDirty && (
                                    <p className="text-[9px] text-primary font-black uppercase text-center mt-3 animate-pulse">
                                        You have unsaved vibe adjustments
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'league' && (
                    <div className="space-y-8 animate-in slide-in-from-left duration-300">
                        <header>
                            <h3 className="text-2xl font-black uppercase tracking-tighter font-league">League Commissions</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Control your active participation</p>
                        </header>

                        <div className="space-y-4">
                            {[
                                { id: 'karaoke', label: 'Karaoke League', icon: '🎤', desc: 'Sync with Tuesday/Thursday stage times' },
                                { id: 'trivia', label: 'Trivia Knights', icon: '🧠', desc: 'Aggregate scores across venues' },
                                { id: 'live_music', label: 'Live Pulse', icon: '🎸', desc: 'Notifications for local bands' },
                            ].map(league => (
                                <div key={league.id} className="bg-surface p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl">{league.icon}</div>
                                        <div>
                                            <h4 className="text-lg font-black uppercase font-league tracking-wide leading-none">{league.label}</h4>
                                            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">{league.desc}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleGamePref(league.id)}
                                        className={`w-12 h-6 rounded-full p-1 transition-all ${gamePrefs.includes(league.id) ? 'bg-primary' : 'bg-slate-800'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white transition-all ${gamePrefs.includes(league.id) ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleSaveProfile}
                            className="w-full bg-primary text-black font-black py-4 rounded-2xl uppercase tracking-widest text-lg font-league shadow-2xl shadow-primary/20"
                        >
                            Sync Preferences
                        </button>
                    </div>
                )}

                {activeTab === 'badges' && (
                    <div className="space-y-8 animate-in zoom-in-95 duration-300">
                        <header>
                            <h3 className="text-2xl font-black uppercase tracking-tighter font-league">Honor Roll</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Your unlocked achievements</p>
                        </header>

                        <div className="grid grid-cols-2 gap-4">
                            {(() => {
                                const unlockedBadges = Object.values(userProfile.badges || {}).filter(b => b.unlocked);

                                if (unlockedBadges.length === 0) {
                                    return (
                                        <div className="col-span-2 py-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                                            <Medal className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                                            <p className="text-sm font-black text-slate-600 uppercase font-league">Level up to earn badges</p>
                                            <p className="text-[10px] text-slate-700 font-bold uppercase mt-1">Visit venues to start your trail</p>
                                        </div>
                                    );
                                }

                                return unlockedBadges.map((badgeProgress) => {
                                    const badgeConfig = BADGES.find(b => b.id === badgeProgress.badgeId);
                                    if (!badgeConfig) return null;

                                    return (
                                        <div key={badgeProgress.badgeId} className="bg-surface p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center group relative">
                                            <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center mb-3 border-2 border-primary/20 group-hover:border-primary transition-all overflow-hidden">
                                                {badgeConfig.icon ? (
                                                    <img
                                                        src={`/assets/${badgeConfig.icon}`}
                                                        alt={badgeConfig.name}
                                                        className="w-10 h-10 object-contain"
                                                    />
                                                ) : (
                                                    <Medal className="w-8 h-8 text-primary" />
                                                )}
                                            </div>
                                            <h4 className="text-xs font-black uppercase font-league leading-tight mb-1">{badgeConfig.name}</h4>
                                            <p className="text-[8px] text-slate-500 font-bold uppercase mb-3 line-clamp-2">
                                                {badgeConfig.description}
                                            </p>
                                            <button
                                                onClick={() => handleShareBadge(badgeProgress)}
                                                className="w-full py-2 bg-white/5 rounded-lg flex items-center justify-center gap-2 hover:bg-white/10 transition-colors border border-white/5"
                                            >
                                                <Share2 className="w-3 h-3 text-primary" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">+5 BOUNTY</span>
                                            </button>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                )}
            </div>

            {/* Wipe Data Option */}
            <div className="px-6 mt-12 pb-12">
                <button
                    onClick={() => {
                        if (confirm("THIS WILL WIPE YOUR LEAGUE DATA. ARE YOU SURE?")) {
                            localStorage.clear();
                            window.location.href = '/';
                        }
                    }}
                    className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/5 border border-red-500/20 text-red-500 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-red-500/10"
                >
                    <LogOut className="w-4 h-4" />
                    Retire League Account
                </button>
            </div>
        </div>
    );
};

export default UserProfileScreen;

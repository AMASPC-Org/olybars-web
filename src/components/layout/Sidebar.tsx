import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X,
    User,
    Crown,
    Info,
    HelpCircle,
    Shield,
    Eye,
    LogOut,
    ChevronRight,
    Zap,
    Bot,
    Coffee,
    BookOpen,
    LayoutDashboard,
    Beer,
    Scan,
    Percent,
    List,
    PlusCircle,
    Store,
    Key,
    Activity
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { isSystemAdmin } from '../../types/auth_schema';
import { FormatCurrency } from '../../utils/formatCurrency';
import { GAMIFICATION_CONFIG } from '../../config/gamification';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile;
    viewMode: 'player' | 'owner';
    setViewMode: (mode: 'player' | 'owner') => void;
    onLogout: () => void;
    onLogin: (mode?: 'login' | 'signup') => void;
    onProfileClick: () => void;
    userPoints?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    onClose,
    userProfile,
    viewMode,
    setViewMode,
    onLogout,
    onLogin,
    onProfileClick,
    userPoints = 0
}) => {
    const navigate = useNavigate();
    const [legalOpen, setLegalOpen] = useState(false);

    // --- DERIVED STATE ---
    const isOwner = ['owner', 'admin', 'super-admin'].includes(userProfile.role);
    const isSuperAdmin = isSystemAdmin(userProfile);

    // --- NAVIGATION CONFIG ---

    const handleNavigation = (path: string) => {
        navigate(path);
        onClose();
    };

    const renderPlayerMode = () => (
        <>
            {/* 1. Header: Player Card */}
            <div className="bg-primary p-6 flex justify-between items-start border-b border-black/20 relative overflow-hidden">
                {/* Abstract Pattern overlay */}
                <div className="absolute -right-4 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                <div
                    className="flex items-center gap-3 cursor-pointer group relative z-10"
                    onClick={() => {
                        if (userProfile.role === 'guest' || userProfile.uid === 'guest') {
                            onLogin('login');
                        } else {
                            onProfileClick();
                        }
                        onClose();
                    }}
                >
                    <div className="w-12 h-12 bg-black rounded-full border-2 border-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg">
                        <User className="w-6 h-6 text-primary" strokeWidth={3} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-black leading-none uppercase font-league tracking-tight">
                            {userProfile.displayName || ((userProfile.role === 'guest' || userProfile.uid === 'guest') ? 'Guest Player' : 'Player One')}
                        </span>
                        <span className="text-[10px] font-black text-black/60 uppercase tracking-widest mt-1">
                            {(userProfile.role === 'guest' || userProfile.uid === 'guest') ? 'Tap to Sign In' : <FormatCurrency amount={userPoints} variant='default' className='text-black/60' />}
                        </span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-black hover:rotate-90 transition-all p-1 relative z-10 hover:bg-black/10 rounded-full"
                >
                    <X className="w-8 h-8" strokeWidth={4} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* 1. Main Navigation */}
                <div className="space-y-2">
                    <button onClick={() => handleNavigation('/league')} className="w-full bg-slate-900 border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-primary/50 transition-all active:scale-[0.98]">
                        <Crown className="w-6 h-6 text-yellow-400" />
                        <span className="text-sm font-black uppercase text-white tracking-wide">League</span>
                    </button>

                    <button onClick={() => handleNavigation('/playbook')} className="w-full bg-slate-900 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:border-yellow-400/50 transition-all active:scale-[0.98] group">
                        <div className="flex items-center gap-4">
                            <BookOpen className="w-5 h-5 text-yellow-400" />
                            <span className="text-sm font-black uppercase text-white tracking-wide">The Pulse Playbook</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-yellow-400" />
                    </button>

                    <button onClick={() => handleNavigation('/back-room')} className="w-full bg-slate-900 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:border-primary/50 transition-all active:scale-[0.98] group">
                        <div className="flex items-center gap-4">
                            <Key className="w-5 h-5 text-primary" />
                            <span className="text-sm font-black uppercase text-white tracking-wide">The Back Room</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary" />
                    </button>
                </div>

                <div className="h-px bg-white/5 mx-2" />

                {/* 2. Manual & Glossary */}
                <div className="space-y-2">
                    <button onClick={() => handleNavigation('/faq')} className="w-full bg-slate-900 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:border-primary/50 transition-all active:scale-[0.98] group">
                        <div className="flex items-center gap-4">
                            <HelpCircle className="w-5 h-5 text-slate-400" />
                            <span className="text-sm font-black uppercase text-white tracking-wide">The Manual</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary" />
                    </button>

                    <button onClick={() => handleNavigation('/glossary')} className="w-full bg-slate-900 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:border-primary/50 transition-all active:scale-[0.98] group">
                        <div className="flex items-center gap-4">
                            <Info className="w-5 h-5 text-slate-400" />
                            <span className="text-sm font-black uppercase text-white tracking-wide">Glossary</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary" />
                    </button>
                </div>

                <div className="h-px bg-white/5 mx-2" />

                {/* 3. Settings & Legal */}
                <div className="space-y-2">
                    {userProfile.role !== 'guest' && (
                        <button onClick={() => handleNavigation('/settings')} className="w-full bg-slate-900 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:border-primary/50 transition-all active:scale-[0.98] group">
                            <div className="flex items-center gap-4">
                                <Activity className="w-5 h-5 text-slate-400" />
                                <span className="text-sm font-black uppercase text-white tracking-wide">Settings</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary" />
                        </button>
                    )}

                    <button onClick={() => handleNavigation('/meet-artie')} className="w-full bg-slate-900/50 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:border-primary/50 transition-all active:scale-[0.98] group">
                        <div className="flex items-center gap-4">
                            <Bot className="w-4 h-4 text-primary" />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">About the AI Assistant</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-700 group-hover:text-primary" />
                    </button>

                    {/* Collapsible Legal */}
                    <div className="bg-black/20 rounded-xl overflow-hidden border border-white/5">
                        <button
                            onClick={() => setLegalOpen(!legalOpen)}
                            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <Shield className="w-5 h-5 text-slate-500" />
                                <span className="text-sm font-black uppercase text-slate-400 tracking-wide">Legal</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${legalOpen ? 'rotate-90' : ''}`} />
                        </button>

                        {legalOpen && (
                            <div className="bg-black/40 p-2 space-y-1">
                                <button onClick={() => handleNavigation('/terms')} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-2">
                                    <Coffee className="w-3 h-3" /> Terms of Service
                                </button>
                                <button onClick={() => handleNavigation('/privacy')} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-2">
                                    <Eye className="w-3 h-3" /> Privacy Policy
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-white/10 space-y-4">
                    <button
                        onClick={() => {
                            onClose();
                            onLogout();
                        }}
                        className="w-full py-4 flex items-center justify-center gap-3 text-red-500 font-black uppercase tracking-widest text-[10px] bg-red-500/5 rounded-xl border border-red-500/20 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                    <p className="text-center text-[10px] text-slate-700 font-mono">v1.2.0 | Manual Protocol</p>
                </div>
            </div>

            {/* Role Switcher */}
            {isOwner && (
                <div className="p-4 bg-slate-900 border-t border-white/10">
                    <button
                        onClick={() => setViewMode('owner')}
                        className="w-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 text-white p-4 rounded-xl flex items-center justify-between group transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center border border-white/20 group-hover:border-primary transition-colors">
                                <Zap className="w-4 h-4 text-primary" />
                            </div>
                            <div className="text-left">
                                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Operations Control</span>
                                <span className="block text-sm font-black uppercase text-white group-hover:text-primary transition-colors">Switch To Schmidt Mode</span>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white" />
                    </button>
                </div>
            )}
        </>
    );

    const renderOwnerMode = () => (
        <>
            {/* 1. Header: Venue Control */}
            <div className="bg-slate-900 p-6 flex justify-between items-start border-b border-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-primary via-yellow-200 to-primary animate-pulse" />

                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-12 h-12 bg-black rounded-lg border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
                        <Store className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-white leading-none uppercase font-league tracking-tight truncate max-w-[180px]">
                            {isSuperAdmin && Object.keys(userProfile.venuePermissions || {}).length === 0
                                ? "Hannah's Bar & Grill"
                                : (Object.keys(userProfile.venuePermissions || {})[0] || "My Venue")}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest bg-green-900/20 px-1.5 py-0.5 rounded border border-green-500/30">Open</span>
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                                <Activity size={10} /> 98 Pulse
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white hover:rotate-90 transition-all p-1"
                >
                    <X className="w-8 h-8" strokeWidth={4} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-8 bg-black/95">
                {/* Admin Section (Ryan Only) */}
                {isSuperAdmin && (
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] px-1">Super Admin</h3>
                        <button onClick={() => handleNavigation('/admin')} className="w-full bg-red-900/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-4 hover:bg-red-900/20 transition-all active:scale-[0.98]">
                            <LayoutDashboard className="w-5 h-5 text-red-500" />
                            <span className="text-sm font-black uppercase text-red-100 tracking-wide">System Dashboard</span>
                        </button>
                    </div>
                )}

                {/* Venue Tools */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Venue Tools</h3>

                    <button onClick={() => handleNavigation(`/owner?tab=menu${isSuperAdmin ? '&venueId=hannahs' : ''}`)} className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl flex items-center gap-4 hover:border-primary/50 transition-all active:scale-[0.98]">
                        <List className="w-5 h-5 text-blue-400" />
                        <span className="text-sm font-black uppercase text-white tracking-wide">Menu Manager</span>
                    </button>

                    <button onClick={() => handleNavigation(`/owner?tab=deals${isSuperAdmin ? '&venueId=hannahs' : ''}`)} className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl flex items-center gap-4 hover:border-primary/50 transition-all active:scale-[0.98]">
                        <Percent className="w-5 h-5 text-green-400" />
                        <span className="text-sm font-black uppercase text-white tracking-wide">Flash Bounties</span>
                    </button>

                    <button
                        onClick={() => {
                            // Placeholder for now
                            alert("Scanner feature coming soon!");
                        }}
                        className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl flex items-center gap-4 hover:border-primary/50 transition-all active:scale-[0.98]"
                    >
                        <Scan className="w-5 h-5 text-purple-400" />
                        <span className="text-sm font-black uppercase text-white tracking-wide">QR Scanner</span>
                    </button>
                </div>

                {/* General Ops */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Operations</h3>

                    <button onClick={() => handleNavigation(`/owner${isSuperAdmin ? '?venueId=hannahs' : ''}`)} className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl flex items-center gap-4 hover:border-primary/50 transition-all active:scale-[0.98]">
                        <Store className="w-5 h-5 text-slate-400" />
                        <span className="text-sm font-black uppercase text-white tracking-wide">The Brew House</span>
                    </button>

                    <button onClick={() => handleNavigation('/faq')} className="w-full bg-black/40 border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-primary/50 transition-all active:scale-[0.98]">
                        <HelpCircle className="w-5 h-5 text-slate-500" />
                        <span className="text-xs font-black uppercase text-slate-400 tracking-wide">The Manual</span>
                    </button>
                </div>

            </div>

            {/* Footer: Switch Back */}
            <div className="p-4 bg-black border-t border-white/10">
                <button
                    onClick={() => setViewMode('player')}
                    className="w-full bg-slate-900 border border-white/10 hover:bg-slate-800 text-white p-4 rounded-xl flex items-center justify-between group transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center border border-white/20">
                            <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="text-left">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Exit Operations</span>
                            <span className="block text-sm font-black uppercase text-white group-hover:text-slate-200 transition-colors">Back To Player View</span>
                        </div>
                    </div>
                    <LogOut className="w-5 h-5 text-slate-600 group-hover:text-white" />
                </button>
            </div>
        </>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div
                className="absolute top-0 right-0 w-[85%] max-w-sm bg-[#0f172a] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {viewMode === 'owner' ? renderOwnerMode() : renderPlayerMode()}
            </div>
        </div>
    );
};

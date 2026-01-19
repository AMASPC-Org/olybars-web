import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FormatCurrency } from '../../../utils/formatCurrency';
import {
    Shield, Users, BarChart3, Settings,
    Search, Filter, ExternalLink, Activity,
    Database, AlertTriangle, CheckCircle2, QrCode,
    Eye, EyeOff, Power, Archive, Gamepad2
} from 'lucide-react';

import { fetchAllUsers, fetchSystemStats, fetchRecentActivity } from '../../../services/userService';
import { fetchVenues, updateVenueDetails } from '../../../services/venueService';
import { UserProfile, ActivityLog, Venue } from '../../../types';
import { AiAccessTab } from '../components/AiAccessTab';
import { PhotoApprovalCard } from '../components/PhotoApprovalCard';
import { PinCalibrationMap } from '../components/PinCalibrationMap';
import { RefineryQueue } from '../components/RefineryQueue';
import { Camera, MapPin, Trophy } from 'lucide-react';
import { BountyReviewQueue } from '../components/BountyReviewQueue';

interface AdminDashboardScreenProps {
    userProfile: any;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ userProfile }) => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'venues' | 'league' | 'system' | 'ai' | 'photos' | 'refinery' | 'bounties'>('overview');
    const [systemStats, setSystemStats] = useState({ totalUsers: 0, activeUsers: 0, totalPoints: 0 });
    const [leagueUsers, setLeagueUsers] = useState<UserProfile[]>([]);
    const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);

    const { data: venues = [] } = useQuery({
        queryKey: ['venues-full', activeTab],
        queryFn: () => fetchVenues(activeTab === 'refinery' ? false : true),
        enabled: activeTab === 'venues' || activeTab === 'overview' || activeTab === 'refinery',
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [venueFilter, setVenueFilter] = useState<'all' | 'visible' | 'ghost' | 'archived'>('all');
    const [calibratingVenue, setCalibratingVenue] = useState<Venue | null>(null);

    useEffect(() => {
        const loadDashboard = async () => {
            const stats = await fetchSystemStats();
            setSystemStats(stats);
            const users = await fetchAllUsers();
            setLeagueUsers(users);
            const activity = await fetchRecentActivity();
            setRecentActivity(activity);
        };
        loadDashboard();
    }, []);

    const handleSaveCalibration = async (coords: { lat: number; lng: number }) => {
        if (!calibratingVenue) return;
        try {
            await updateVenueDetails(calibratingVenue.id, {
                location: { ...calibratingVenue.location, lat: coords.lat, lng: coords.lng }
            } as any);
            queryClient.invalidateQueries({ queryKey: ['venues-brief'] });
            setCalibratingVenue(null);
        } catch (error) {
            console.error('Failed to save calibration', error);
        }
    };

    const filteredLeagueUsers = leagueUsers
        .filter(u => u.handle?.toLowerCase().includes(searchTerm.toLowerCase()) || u.uid.includes(searchTerm))
        .sort((a, b) => (b.stats?.seasonPoints || 0) - (a.stats?.seasonPoints || 0));

    const filteredVenues = venues
        .filter(v =>
            v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.id.includes(searchTerm) ||
            v.scraper_config?.some(s => s.url.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .filter(v => {
            if (venueFilter === 'visible') return v.isVisible !== false && v.isActive !== false;
            if (venueFilter === 'ghost') return v.isVisible === false && v.isActive !== false;
            if (venueFilter === 'archived') return v.isActive === false;
            return true;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    const onToggleVenueMembership = async (venueId: string, currentStatus: boolean) => {
        // Optimistic Update
        queryClient.setQueryData(['venues-brief'], (old: Venue[] | undefined) => {
            return old?.map(v => v.id === venueId ? { ...v, isPaidLeagueMember: !currentStatus } : v);
        });

        try {
            await updateVenueDetails(venueId, { isPaidLeagueMember: !currentStatus });
            queryClient.invalidateQueries({ queryKey: ['venues-brief'] });
        } catch (error) {
            console.error('Failed to toggle membership', error);
            queryClient.invalidateQueries({ queryKey: ['venues-brief'] });
        }
    };

    const onToggleVisibility = async (venueId: string, currentStatus: boolean) => {
        // Optimistic Update
        queryClient.setQueryData(['venues-brief'], (old: Venue[] | undefined) => {
            return old?.map(v => v.id === venueId ? { ...v, isVisible: !currentStatus } : v);
        });

        try {
            await updateVenueDetails(venueId, { isVisible: !currentStatus });
            queryClient.invalidateQueries({ queryKey: ['venues-brief'] });
        } catch (error) {
            console.error('Failed to toggle visibility', error);
            queryClient.invalidateQueries({ queryKey: ['venues-brief'] });
        }
    };

    const onToggleActivity = async (venueId: string, currentStatus: boolean) => {
        // Optimistic Update
        queryClient.setQueryData(['venues-brief'], (old: Venue[] | undefined) => {
            return old?.map(v => v.id === venueId ? { ...v, isActive: !currentStatus } : v);
        });

        try {
            await updateVenueDetails(venueId, { isActive: !currentStatus });
            queryClient.invalidateQueries({ queryKey: ['venues-brief'] });
        } catch (error) {
            console.error('Failed to toggle activity', error);
            queryClient.invalidateQueries({ queryKey: ['venues-brief'] });
        }
    };

    const onToggleGameVibe = async (venueId: string, currentStatus: boolean) => {
        // Optimistic Update
        queryClient.setQueryData(['venues-brief'], (old: Venue[] | undefined) => {
            return old?.map(v => v.id === venueId ? { ...v, hasGameVibeCheckEnabled: !currentStatus } : v);
        });

        try {
            await updateVenueDetails(venueId, { hasGameVibeCheckEnabled: !currentStatus });
            queryClient.invalidateQueries({ queryKey: ['venues-brief'] });
        } catch (error) {
            console.error('Failed to toggle game vibe', error);
            queryClient.invalidateQueries({ queryKey: ['venues-brief'] });
        }
    };
    const handleApprovePhoto = async (venueId: string, photoId: string) => {
        const venue = venues.find(v => v.id === venueId);
        if (!venue || !venue.photos) return;

        const updatedPhotos = venue.photos.map(p =>
            p.id === photoId ? { ...p, marketingStatus: 'pending-venue', superAdminApprovedBy: userProfile.uid } as any : p
        );

        try {
            await updateVenueDetails(venueId, { photos: updatedPhotos });
            queryClient.invalidateQueries({ queryKey: ['venues-brief'] });
        } catch (error) {
            console.error('Failed to approve photo', error);
        }
    };

    const handleRejectPhoto = async (venueId: string, photoId: string) => {
        const venue = venues.find(v => v.id === venueId);
        if (!venue || !venue.photos) return;

        const updatedPhotos = venue.photos.map(p =>
            p.id === photoId ? { ...p, marketingStatus: 'rejected' } as any : p
        );

        try {
            await updateVenueDetails(venueId, { photos: updatedPhotos });
            queryClient.invalidateQueries({ queryKey: ['venues'] });
        } catch (error) {
            console.error('Failed to reject photo', error);
        }
    };

    const pendingPhotos = venues.flatMap(v =>
        (v.photos || [])
            .filter(p => p.marketingStatus === 'pending-super')
            .map(p => ({ venue: v, photo: p }))
    );



    const stats = [
        { label: 'Total Users', value: systemStats.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-400' },
        { label: 'Active Users', value: systemStats.activeUsers.toString(), icon: Activity, color: 'text-primary' },
        { label: 'Total Points', value: systemStats.totalPoints.toLocaleString(), icon: Database, color: 'text-purple-400' },
        { label: 'System Health', value: '100%', icon: CheckCircle2, color: 'text-green-400' },
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-6 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-5 h-5 text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Global Admin</span>
                    </div>
                    <h1 className="text-3xl font-black font-league uppercase tracking-tight">System Dashboard</h1>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-white uppercase">{userProfile.handle || 'Ryan Admin'}</p>
                    <p className="text-[10px] text-slate-400 font-mono">SUPER-ADMIN PRIVILEGES</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl shadow-xl">
                        <div className="flex justify-between items-start mb-2">
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <p className="text-2xl font-black font-mono">{stat.value}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 bg-black/40 p-1 rounded-xl overflow-x-auto">
                {(['overview', 'users', 'venues', 'bounties', 'photos', 'refinery', 'league', 'system', 'ai'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${activeTab === tab
                            ? 'bg-primary text-black shadow-lg'
                            : 'text-slate-500 hover:text-white'
                            }`}
                    >
                        {tab === 'ai' ? 'AI Access' : tab}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 min-h-[300px] shadow-2xl">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-black font-league uppercase">Live Activity Loop</h2>
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                Live
                            </span>
                        </div>

                        <div className="space-y-2">
                            {recentActivity.length === 0 ? (
                                <div className="text-center py-10 opacity-50">
                                    <p className="text-xs uppercase tracking-widest">No recent activity found.</p>
                                </div>
                            ) : (
                                recentActivity.map((log) => (
                                    <div key={log.id} className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${log.verificationMethod === 'qr' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-slate-700/50 text-slate-400'}`}>
                                                {log.verificationMethod === 'qr' ? <QrCode className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white uppercase">{log.type.replace('_', ' ')}</p>
                                                <p className="text-[10px] text-slate-500 font-mono">
                                                    User: {log.userId.substring(0, 6)}... {log.venueId ? `@ ${log.venueId}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {log.verificationMethod === 'qr' && (
                                                    <span className="text-[9px] font-black bg-yellow-500 text-black px-1.5 rounded uppercase">Verified</span>
                                                )}
                                                <span className="text-primary font-black font-mono text-xs">+{log.points}</span>
                                            </div>
                                            <p className="text-[9px] text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'venues' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                            <h2 className="text-lg font-black font-league uppercase">Venue Roster</h2>
                            <div className="flex gap-2 mr-4">
                                {(['all', 'visible', 'ghost', 'archived'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setVenueFilter(f)}
                                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${venueFilter === f ? 'bg-primary text-black' : 'text-slate-500 hover:text-white bg-black/40'
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Find Venue..."
                                    className="bg-slate-800 border-none rounded-lg py-2 pl-9 pr-4 text-xs font-bold text-white focus:ring-1 focus:ring-primary outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[9px] text-slate-500 uppercase tracking-widest border-b border-white/10">
                                        <th className="p-3">Venue Name</th>
                                        <th className="p-3">ID</th>
                                        <th className="p-3 text-center">Paid Member</th>
                                        <th className="p-3 text-center">Ghost Mode</th>
                                        <th className="p-3 text-center">Sync</th>
                                        <th className="p-3 text-center">Map</th>
                                        <th className="p-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredVenues.map((venue) => (
                                        <tr key={venue.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-3">
                                                <div className="font-bold text-white">{venue.name}</div>
                                                <div className="text-[9px] text-slate-500 uppercase">{venue.vibe}</div>
                                            </td>
                                            <td className="p-3 font-mono text-[10px] text-slate-500">{venue.id}</td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => onToggleVenueMembership(venue.id, !!venue.isPaidLeagueMember)}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${venue.isPaidLeagueMember
                                                        ? 'bg-primary text-black shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                                                        : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                                                        }`}
                                                >
                                                    {venue.isPaidLeagueMember ? 'Active' : 'Unpaid'}
                                                </button>
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => onToggleVisibility(venue.id, venue.isVisible !== false)}
                                                    className={`p-2 rounded-lg transition-all ${venue.isVisible !== false
                                                        ? 'text-slate-600 hover:text-white'
                                                        : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                                        }`}
                                                    title={venue.isVisible !== false ? "Visible Publicly" : "Ghost Mode (Hidden)"}
                                                >
                                                    {venue.isVisible !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                                                </button>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex items-center justify-center gap-1" title="Active Scraper Sources">
                                                    {venue.scraper_config?.some(s => s.status === 'error') ? (
                                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                                    ) : (
                                                        <span className={`text-[10px] font-black font-mono ${venue.is_scraping_enabled && (venue.scraper_config?.length || 0) > 0 ? 'text-green-400' : 'text-slate-700'}`}>
                                                            {venue.scraper_config?.filter(s => s.isEnabled).length || 0}/{venue.scraper_config?.length || 0}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => setCalibratingVenue(venue)}
                                                    className="p-2 hover:bg-primary/20 text-slate-400 hover:text-primary transition-all rounded-lg"
                                                    title="Calibrate Map Pin"
                                                >
                                                    <MapPin size={16} />
                                                </button>
                                            </td>
                                            <td className="p-3 text-right">
                                                <button
                                                    onClick={() => onToggleActivity(venue.id, venue.isActive !== false)}
                                                    className={`p-2 rounded-lg transition-all ${venue.isActive !== false
                                                        ? 'text-green-500 hover:text-green-400'
                                                        : 'text-slate-600 hover:text-white'
                                                        }`}
                                                    title={venue.isActive !== false ? "Active" : "Archived"}
                                                >
                                                    {venue.isActive !== false ? <Power size={16} /> : <Archive size={16} />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                            <h2 className="text-lg font-black font-league uppercase">User Directory</h2>
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or UID..."
                                    className="bg-slate-800 border-none rounded-lg py-2 pl-9 pr-4 text-xs font-bold text-white focus:ring-1 focus:ring-primary outline-none min-w-[300px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[9px] text-slate-500 uppercase tracking-widest border-b border-white/10">
                                        <th className="p-3">User</th>
                                        <th className="p-3">UID</th>
                                        <th className="p-3 text-right">Role</th>
                                        <th className="p-3 text-right">Drops</th>
                                        <th className="p-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {leagueUsers
                                        .filter(u =>
                                            u.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            u.uid.includes(searchTerm)
                                        )
                                        .map((user) => (
                                            <tr key={user.uid} className="hover:bg-white/5 transition-colors">
                                                <td className="p-3">
                                                    <div className="font-bold text-white">{user.handle || 'Guest'}</div>
                                                    <div className="text-[10px] text-slate-500 lowercase">{user.email || 'No Email'}</div>
                                                </td>
                                                <td className="p-3 font-mono text-[9px] text-slate-600">{user.uid}</td>
                                                <td className="p-3 text-right uppercase font-bold text-[10px]">
                                                    <span className={`px-2 py-0.5 rounded-full ${user.role === 'super-admin'
                                                        ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                        : user.role === 'owner'
                                                            ? 'bg-primary/10 text-primary border border-primary/20'
                                                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right font-mono text-primary font-black">
                                                    {(user.stats?.seasonPoints || 0).toLocaleString()}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className={`w-2 h-2 rounded-full mx-auto ${user.email ? 'bg-green-500' : 'bg-slate-700'}`} />
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                            {leagueUsers.length === 0 && (
                                <div className="text-center py-20 opacity-50">
                                    <Users className="w-12 h-12 mb-4 mx-auto text-slate-600" />
                                    <p className="text-sm font-bold uppercase tracking-widest">No users found</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'league' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                            <h2 className="text-lg font-black font-league uppercase">League Roster</h2>
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Find Member..."
                                    className="bg-slate-800 border-none rounded-lg py-2 pl-9 pr-4 text-xs font-bold text-white focus:ring-1 focus:ring-primary outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[9px] text-slate-500 uppercase tracking-widest border-b border-white/10">
                                        <th className="p-3">Rank</th>
                                        <th className="p-3">Handle</th>
                                        <th className="p-3 text-right">Drops</th>
                                        <th className="p-3 text-right">Role</th>
                                        <th className="p-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredLeagueUsers.map((user, idx) => (
                                        <tr key={user.uid} className="hover:bg-white/5 transition-colors">
                                            <td className="p-3 font-mono font-bold text-slate-400">#{idx + 1}</td>
                                            <td className="p-3 font-bold text-white">{user.handle || 'Unknown'}</td>
                                            <td className="p-3 text-right font-mono text-primary font-black">
                                                {(user.stats?.seasonPoints || 0).toLocaleString()}
                                            </td>
                                            <td className="p-3 text-right text-[10px] uppercase font-bold text-slate-500">
                                                {user.role}
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className={`w-2 h-2 rounded-full mx-auto ${user.role !== 'guest' ? 'bg-green-500' : 'bg-slate-700'}`} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredLeagueUsers.length === 0 && (
                                <div className="text-center py-8 text-slate-500 text-xs uppercase">No members found</div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'system' && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-black font-league uppercase">Infrastructure State</h2>
                        <div className="grid grid-cols-1 gap-2">
                            <div className="p-3 bg-black/20 border border-white/5 rounded-xl flex justify-between items-center">
                                <span className="text-[10px] font-bold uppercase">Cloud Run</span>
                                <span className="text-[10px] font-mono text-green-400">OPERATIONAL</span>
                            </div>
                            <div className="p-3 bg-black/20 border border-white/5 rounded-xl flex justify-between items-center">
                                <span className="text-[10px] font-bold uppercase">Firestore</span>
                                <span className="text-[10px] font-mono text-green-400">OPERATIONAL</span>
                            </div>
                            {/* <div className="p-3 bg-black/20 border border-white/5 rounded-xl flex justify-between items-center">
                                <span className="text-[10px] font-bold uppercase">Gemini SDK</span>
                                <span className="text-[10px] font-mono text-green-400">READY</span>
                             </div> */}
                        </div>
                    </div>
                )}

                {activeTab === 'photos' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-black font-league uppercase">Photo Quality Control</h2>
                            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {pendingPhotos.length} Pending Approval
                            </span>
                        </div>

                        {pendingPhotos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-black/20 rounded-2xl border border-dashed border-white/5">
                                <Camera className="w-12 h-12 text-slate-700 mb-4" />
                                <p className="text-sm font-bold text-slate-500 uppercase">All caught up!</p>
                                <p className="text-[10px] text-slate-600 uppercase mt-1">No new photos need verification.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingPhotos.map(({ venue, photo }) => (
                                    <PhotoApprovalCard
                                        key={photo.id}
                                        venue={venue}
                                        photo={photo}
                                        onApprove={handleApprovePhoto}
                                        onReject={handleRejectPhoto}
                                        isAdminView={true}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'refinery' && <RefineryQueue venues={venues} />}

                {activeTab === 'ai' && <AiAccessTab />}

                {activeTab === 'bounties' && <BountyReviewQueue />}
            </div>

            {/* Calibration Modal */}
            {calibratingVenue && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl">
                        <PinCalibrationMap
                            venue={calibratingVenue}
                            onSave={handleSaveCalibration}
                            onCancel={() => setCalibratingVenue(null)}
                        />
                    </div>
                </div>
            )}

            <div className="mt-8 p-4 bg-amber-400/10 border border-amber-400/20 rounded-2xl flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Audit Warning</p>
                    <p className="text-[11px] text-slate-300 font-medium">All admin actions are logged to Secret Manager and Cloud Audit. Proceed with League Integrity in mind.</p>
                </div>
            </div>
        </div>
    );
};

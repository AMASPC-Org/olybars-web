import React from 'react';
import { Outlet, useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import { StickyHeader } from '../../../components/layout/StickyHeader';
import { DiscoveryControls } from '../components/DiscoveryControls';
import { DiscoveryProvider, useDiscovery } from '../contexts/DiscoveryContext';
import { UserProfile, Venue, ClockInRecord, VibeCheckRecord } from '../../../types';
import { BuzzClock } from '../../../components/ui/BuzzClock';
import { format } from 'date-fns';

export const DiscoveryLayout: React.FC = () => {
    // We get venues and userProfile from AppShell's Outlet context
    const {
        venues,
        userProfile,
        onAskArtie,
        onToggleMenu,
        onClockIn,
        onVibeCheck,
        clockedInVenue,
        onToggleFavorite,
        onEditVenue,
        isLoading,
        onToggleWeeklyBuzz,
        clockInHistory,
        vibeCheckHistory
    } = useOutletContext<{
        venues: Venue[],
        userProfile: UserProfile,
        onAskArtie: () => void,
        onToggleMenu: () => void,
        onClockIn: (venue: Venue) => void,
        onVibeCheck: (venue: Venue) => void,
        clockedInVenue: string | null,
        onToggleFavorite: (venueId: string) => void,
        onEditVenue: (venueId: string) => void,
        isLoading: boolean,
        onToggleWeeklyBuzz: () => void,
        clockInHistory?: ClockInRecord[],
        vibeCheckHistory?: VibeCheckRecord[]
    }>();

    return (
        <DiscoveryLayoutContent
            venues={venues}
            userProfile={userProfile}
            onAskArtie={onAskArtie}
            onToggleMenu={onToggleMenu}
            onClockIn={onClockIn}
            onVibeCheck={onVibeCheck}
            clockedInVenue={clockedInVenue}
            onToggleFavorite={onToggleFavorite}
            onEditVenue={onEditVenue}
            isLoading={isLoading}
            onToggleWeeklyBuzz={onToggleWeeklyBuzz}
            clockInHistory={clockInHistory}
            vibeCheckHistory={vibeCheckHistory}
        />
    );
};

const DiscoveryLayoutContent: React.FC<{
    venues: Venue[],
    userProfile: UserProfile,
    onAskArtie: () => void,
    onToggleMenu: () => void,
    onClockIn: (venue: Venue) => void,
    onVibeCheck: (venue: Venue) => void,
    clockedInVenue: string | null,
    onToggleFavorite: (venueId: string) => void,
    onEditVenue: (venueId: string) => void,
    isLoading: boolean,
    onToggleWeeklyBuzz: () => void,
    clockInHistory?: ClockInRecord[],
    vibeCheckHistory?: VibeCheckRecord[]
}> = ({
    venues,
    userProfile,
    onAskArtie,
    onToggleMenu,
    onClockIn,
    onVibeCheck,
    clockedInVenue,
    onToggleFavorite,
    onEditVenue,
    isLoading,
    onToggleWeeklyBuzz,
    clockInHistory,
    vibeCheckHistory
}) => {
        const navigate = useNavigate();
        const location = useLocation();
        const { isToday, searchQuery, selectedDate } = useDiscovery();
        const isVenueProfile = location.pathname.includes('/bars/');
        const isBackRoom = location.pathname === '/back-room';
        const isClaimPage = location.pathname.startsWith('/partners/claim');

        return (
            <div className="flex flex-col min-h-screen">
                {/* Zone 1: Sticky Header */}
                <StickyHeader
                    userProfile={userProfile}
                    onMenuClick={onToggleMenu}
                    onProfileClick={() => navigate('/profile')}
                />

                <div className="space-y-6">
                    {/* Zone 2: The Buzz Clock (Hero) - Only if Today, no search, NOT a profile, NOT the back room, and NOT claim page */}
                    {isToday && !searchQuery && !isVenueProfile && !isBackRoom && !isClaimPage && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                            <BuzzClock venues={venues} />
                        </div>
                    )}

                    {!isToday && !isBackRoom && (
                        <div className="p-8 text-center bg-surface/30 border-y border-white/5 backdrop-blur-sm">
                            <h3 className="text-2xl font-black text-primary uppercase font-league tracking-widest mb-2 italic">Future View</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Showing events and schedules for {format(selectedDate, 'eeee, MMM do')}</p>
                        </div>
                    )}

                    {/* Zone 3: Control Center (Persistent) - Hide on Profile and Back Room */}
                    {!isVenueProfile && !isBackRoom && <DiscoveryControls venues={venues} />}

                    {/* Child Screens (Home Feed or Venue Profile Content) */}
                    <div className="flex-1">
                        <Outlet context={{
                            venues,
                            userProfile,
                            onAskArtie,
                            onToggleMenu,
                            onClockIn,
                            onVibeCheck,
                            clockedInVenue,
                            onToggleFavorite,
                            onEditVenue,
                            isLoading,
                            onToggleWeeklyBuzz,
                            clockInHistory,
                            vibeCheckHistory
                        }} />
                    </div>
                </div>
            </div>
        );
    };

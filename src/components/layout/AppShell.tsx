import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Menu,
  Clock,
  Flame,
  Mic,
  Brain,
  Music,
  List,
  Ticket,
  Crown,
  Trophy,
  X,
  Map as MapIcon,
  MoreHorizontal,
  User,
  LogIn,
  LogOut,
  Search,
  Star,
  Bell,
  Lock,
  ChevronRight,
  Settings as SettingsIcon,
  Bot,
  Info,
  Home,
  ShoppingBag,
  Hammer,
  Shield,
  Zap
} from 'lucide-react';
import { Venue, UserProfile, ClockInRecord, VibeCheckRecord } from '../../types';
import { isSystemAdmin } from '../../types/auth_schema';
import { OlyChatModal } from '../../components/artie/OlyChatModal';
import { ArtieHoverIcon } from '../../features/artie/components/ArtieHoverIcon';
import { CookieBanner } from '../ui/CookieBanner';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';
import { BuzzClock } from '../ui/BuzzClock';
import { InfoRulesModal } from '../ui/InfoRulesModal';
import logoIcon from '../../assets/OlyBars.com Emblem Logo PNG Transparent (512px by 512px).png';
import { FormatCurrency } from '../../utils/formatCurrency';
import { GAMIFICATION_CONFIG } from '../../config/gamification';

interface AppShellProps {
  venues: Venue[];
  userProfile: UserProfile;
  userPoints: number;
  userRank?: number;
  // if undefined, we default to showing the scoreboard for now
  isLeagueMember?: boolean;
  alertPrefs: any;
  setAlertPrefs: (prefs: any) => void;
  onProfileClick?: () => void;
  onOwnerLoginClick?: () => void;
  onMemberLoginClick?: (mode?: 'login' | 'signup') => void;
  userRole?: string;
  userHandle?: string;
  onLogout?: () => void;
  onToggleFavorite?: (venueId: string) => void;
  onToggleWeeklyBuzz?: () => void;
  onVenueDashboardClick?: () => void;
  onClockIn?: (venue: Venue) => void;
  onVibeCheck?: (venue: Venue) => void;
  clockedInVenue?: string | null;
  onEditVenue?: (venueId: string) => void;
  isLoading?: boolean;
  showArtie?: boolean;
  setShowArtie?: (show: boolean) => void;
  clockInHistory?: ClockInRecord[];
  vibeCheckHistory?: VibeCheckRecord[];
}

// --- The App Shell Component ---
export const AppShell: React.FC<AppShellProps> = ({
  venues,
  userProfile,
  userPoints,
  userRank,
  isLeagueMember,
  alertPrefs,
  setAlertPrefs,
  onProfileClick,
  onOwnerLoginClick,
  onMemberLoginClick,
  userRole,
  userHandle,
  onLogout,
  onToggleFavorite,
  onToggleWeeklyBuzz,
  onVenueDashboardClick,
  onClockIn,
  onVibeCheck,
  clockedInVenue,
  onEditVenue,
  isLoading,
  showArtie,
  setShowArtie,
  clockInHistory,
  vibeCheckHistory
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');
  const [showMenu, setShowMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isMapPage = location.pathname === '/map';

  // Scroll listener for compact header
  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    const handleScroll = () => {
      setIsScrolled(mainContent.scrollTop > 40);
    };
    mainContent.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainContent.removeEventListener('scroll', handleScroll);
  }, []);

  // Pulse & Buzz Logic
  const activeDeals = venues
    .filter((v) => v.deal && v.dealEndsIn && v.dealEndsIn > 0)
    .sort((a, b) => (a.dealEndsIn || 0) - (b.dealEndsIn || 0));

  const getPulseStatus = () => {
    if (activeDeals.length > 0) return 'buzzing';

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const nextHH = venues
      .filter(v => v.happyHour && !v.deal)
      .map(v => {
        const [h, m] = v.happyHour!.startTime.split(':').map(Number);
        const startMinutes = h * 60 + m;
        return { venue: v, startMinutes, diff: startMinutes - currentMinutes };
      })
      .filter(v => v.diff > 0 && v.diff < 180)
      .sort((a, b) => a.diff - b.diff)[0];

    return nextHH ? 'chill' : 'quiet';
  };

  const pulseStatus = getPulseStatus();

  const getActiveTab = () => {
    const path = location.pathname.split('/')[1];
    return path === '' ? 'pulse' : path;
  };

  const activeTab = getActiveTab();

  // --- VIEW MODE STATE ---
  const [viewMode, setViewMode] = useState<'player' | 'owner'>(() => {
    return (localStorage.getItem('olybars_view_mode') as 'player' | 'owner') || 'player';
  });

  // Persist viewMode changes
  useEffect(() => {
    localStorage.setItem('olybars_view_mode', viewMode);
  }, [viewMode]);

  // Extract Venue Context for Artie
  const getVenueIdFromPath = () => {
    const venueMatch = location.pathname.match(/\/(?:venues|bars)\/([^/]+)/);
    if (venueMatch) return venueMatch[1];
    const vcMatch = location.pathname.match(/\/vc\/([^/]+)/);
    if (vcMatch) return vcMatch[1];
    return null;
  };

  const initialVenueId = getVenueIdFromPath();

  /* Floating Buttons style with individual borders and gaps */

  const handleMenuNavigation = (path: string) => {
    navigate(path);
    setShowMenu(false);
  };

  // default to "true" so behaviour stays same until we wire real roles
  const leagueMember = isLeagueMember ?? true;

  const leagueEventVenue = venues.find((v) => v.leagueEvent);
  const leaguePromoText = leagueEventVenue
    ? `${(leagueEventVenue.leagueEvent || '').toUpperCase()} tonight at ${leagueEventVenue.name
    }`
    : 'Join the Artesian Bar League for local events & prizes.';

  const isFullWidthPage = [
    '/map',
    '/league-membership',
    '/admin',
    '/owner',
    '/venue-handover'
  ].includes(location.pathname);

  const isDiscoveryFlow = location.pathname === '/' || location.pathname === '/bars' || location.pathname.startsWith('/bars/') || location.pathname === '/back-room';

  return (
    <div className={`h-full bg-background text-white font-sans mx-auto relative shadow-2xl overflow-hidden flex flex-col transition-all duration-500 ${isFullWidthPage
      ? 'w-full max-w-none border-x-0'
      : 'max-w-md border-x-4 border-black'
      }`}>
      {/* Header Area - Hidden on Discovery Flow */}
      {!isDiscoveryFlow && (
        <div className={`sticky top-0 z-40 backdrop-blur-xl transition-all duration-300 ${pulseStatus === 'buzzing' ? 'shadow-[0_4px_20px_-5px_rgba(251,191,36,0.5)]' : 'shadow-lg'
          }`}>
          <div className={`relative border-b-2 transition-colors duration-500 ${pulseStatus === 'buzzing' ? 'bg-black/80 border-primary' : 'bg-black/90 border-slate-800'
            }`}>
            {/* Top Glow bar for "Buzzing" status */}
            {pulseStatus === 'buzzing' && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
            )}

            <div className={`p-3 flex justify-between items-center mx-auto transition-all ${isFullWidthPage ? 'max-w-[1600px] px-6' : ''}`}>
              <div
                onClick={() => navigate('/')}
                className="text-2xl md:text-3xl font-black tracking-tighter text-white flex items-center gap-3 drop-shadow-md cursor-pointer group"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={logoIcon}
                    alt="Logo Icon"
                    className="w-10 h-10 md:w-12 md:h-12 object-contain group-hover:rotate-12 transition-transform duration-300"
                  />
                  {pulseStatus === 'buzzing' && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-black animate-ping" />
                  )}
                </div>
                <span className="font-league uppercase leading-none group-hover:text-primary transition-colors flex flex-col">
                  <span className="flex items-center">
                    OLYBARS<span className="text-primary">.COM</span>
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    // Force explicit check here to avoid routing issues
                    if ((userProfile?.role === 'guest' || userProfile?.uid === 'guest') && onMemberLoginClick) {
                      onMemberLoginClick('login');
                    } else if (onProfileClick) {
                      onProfileClick();
                    }
                  }}
                  className="text-slate-400 hover:text-primary transition-all active:scale-95"
                  title="Profile"
                >
                  <User className="w-6 h-6" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => setShowInfo(true)}
                  className="text-slate-400 hover:text-primary transition-all active:scale-95"
                  title="Rules & Prizes"
                >
                  <Info className="w-6 h-6" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => setShowMenu(true)}
                  className="text-white hover:text-primary transition-all active:scale-95"
                >
                  <Menu className="w-8 h-8" strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>

          {/* The Buzz Clock Component - Hidden on Map, during Search, on League Membership, or on administrative/profile pages */}
          {!isMapPage &&
            !searchQuery &&
            !location.pathname.startsWith('/partners') &&
            !['/league-membership', '/profile', '/settings', '/owner', '/admin', '/back-room', '/passport', '/league'].includes(location.pathname) &&
            <BuzzClock venues={venues} />
          }

        </div>
      )}

      {/* Main Content (Outlet) */}
      <main id="main-content" className="flex-1 overflow-y-auto relative flex flex-col">
        <div>
          <Outlet context={{
            venues,
            userProfile,
            onAskArtie: (mode?: 'visitor' | 'ops') => {
              if (mode === 'visitor') (window as any)._artie_force_guest = true;
              else (window as any)._artie_force_guest = false;
              setShowArtie?.(true);
            },
            onToggleMenu: () => setShowMenu(true),
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
        {location.pathname !== '/map' && <Footer />}
      </main>

      {/* Footer / League Bar */}
      <div className={`sticky bottom-0 w-full ${isFullWidthPage ? 'max-w-none' : 'max-w-md'} bg-black border-t-4 border-primary z-20 shadow-2xl transition-all duration-500`}>
        <div className={`p-3 mx-auto ${isFullWidthPage ? 'max-w-[1600px]' : ''}`}>
          {leagueMember ? (
            <div className="flex justify-between items-center">
              <div
                className="flex items-center gap-3 cursor-pointer hover:bg-slate-900/50 p-1 rounded-lg transition-all active:scale-95"
                onClick={() => navigate('/profile')}
              >
                <div className="bg-slate-900 p-2 border-2 border-white relative shadow-sm">
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border border-black" />
                  <Trophy className="w-5 h-5 text-primary" strokeWidth={3} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-primary font-black uppercase tracking-widest leading-none mb-1">{GAMIFICATION_CONFIG.CURRENCY.NAME}</span>
                  <div className="animate-in zoom-in-95 duration-300">
                    <FormatCurrency amount={userPoints} showLabel={false} className="text-2xl" />
                  </div>
                </div>
              </div>
              <div
                className="text-right cursor-pointer hover:bg-slate-900/50 p-1 rounded-lg transition-all active:scale-95"
                onClick={() => navigate('/league?tab=standings')}
              >
                <p className="text-[9px] text-slate-500 font-bold uppercase mx-1">
                  Season ends Feb 28, 2026
                </p>
                <p className="text-[7px] text-slate-600 font-black uppercase mx-1 mt-0.5">
                  {GAMIFICATION_CONFIG.CURRENCY.UNIT} have no cash value. 21+.
                </p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span className="text-[10px] text-black font-black bg-primary border-2 border-white px-2 py-0.5 transform -skew-x-12 inline-block">
                    RANK: #{userRank || '-'}
                  </span>
                  <Star className="w-4 h-4 text-primary fill-primary" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center gap-3">
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase">
                  Artesian Bar League
                </p>
                <p className="text-sm font-black text-white leading-snug">
                  {leaguePromoText}
                </p>
              </div>
              <button
                onClick={onProfileClick}
                className="bg-primary text-black text-[11px] font-black uppercase tracking-wider px-3 py-2 border-2 border-black shadow-[3px_3px_0px_0px_#000]"
              >
                View League
              </button>
            </div>
          )}
        </div>
      </div>



      {/* Sidebar Component */}
      <Sidebar
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        userProfile={userProfile}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onLogout={onLogout || (() => { })}
        onLogin={onMemberLoginClick || (() => { })}
        onProfileClick={onProfileClick || (() => { })}
        userPoints={userPoints}
      />

      {/* Artie Floating Action Button */}
      <ArtieHoverIcon
        onClick={() => {
          (window as any)._artie_force_guest = false;
          setShowArtie?.(true);
        }}
        userProfile={userProfile}
      />

      {/* OlyBars Assistant Modal */}
      <OlyChatModal
        isOpen={!!showArtie}
        onClose={() => setShowArtie?.(false)}
        userProfile={userProfile}
        initialVenueId={initialVenueId || undefined}
      />

      <InfoRulesModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
      />

      <CookieBanner />
    </div >
  );
};

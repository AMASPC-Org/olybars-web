import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Menu,
  Trophy,
  User,
  Star as StarIcon,
  Info,
  Beer
} from 'lucide-react';
import { useArtieChat } from '../../hooks/useArtieChat';
import { useSchmidtOps } from '../../hooks/useSchmidtOps';
import { useLayout, useUser, usePersona, useGamification } from '../../contexts';
import { useDiscovery } from '../../features/venues/contexts/DiscoveryContext';
import { OlyChatModal } from '../../components/artie/OlyChatModal';
import { SchmidtChatModal } from '../../components/owner/SchmidtChatModal';
import { ArtieHoverIcon } from '../../features/artie/components/ArtieHoverIcon';
import { CookieBanner } from '../ui/CookieBanner';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';
import { BuzzClock } from '../ui/BuzzClock';
import { InfoRulesModal } from '../ui/InfoRulesModal';
import { FormatCurrency } from '../../utils/formatCurrency';
import { GAMIFICATION_CONFIG } from '../../config/gamification';
import { RouteLoading } from '../common/RouteLoading';
import { ErrorBoundary } from '../common/ErrorBoundary';

export const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');

  // --- Context Hooks (No more props) ---
  const {
    showMenu, setShowMenu,
    showInfo, setShowInfo,
    showArtie, setShowArtie,
    openModal
  } = useLayout();

  const { allVenues: venues } = useDiscovery();
  const { userProfile, isLeagueMember, toggleFavorite } = useUser();
  const { activePersona } = usePersona();
  const { userPoints, userRank, clockInHistory, vibeCheckHistory } = useGamification();

  // --- Local State ---
  const [viewMode, setViewMode] = useState<'player' | 'owner'>(() => {
    return (localStorage.getItem('olybars_view_mode') as 'player' | 'owner') || 'player';
  });

  const isMapPage = location.pathname === '/map';
  const persona = activePersona;

  // --- Scroll Listener ---
  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    const handleScroll = () => { /* scroll logic */ };
    mainContent.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainContent.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Sync View Mode ---
  useEffect(() => {
    localStorage.setItem('olybars_view_mode', viewMode);
  }, [viewMode]);

  // --- Derived Data ---
  const getVenueIdFromPath = () => {
    const venueMatch = location.pathname.match(/\/(?:venues|bars)\/([^/]+)/);
    if (venueMatch) return venueMatch[1];
    const vcMatch = location.pathname.match(/\/vc\/([^/]+)/);
    if (vcMatch) return vcMatch[1];
    return null;
  };

  const initialVenueId = getVenueIdFromPath();
  const artieChat = useArtieChat(initialVenueId || userProfile?.homeBase);
  const opsSchmidt = useSchmidtOps();

  // --- Pulse Logic ---
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

    return nextHH ? 'flowing' : 'trickle';
  };

  const pulseStatus = getPulseStatus();
  const leagueMember = isLeagueMember ?? true;
  const leagueEventVenue = venues.find((v) => v.leagueEvent);
  const leaguePromoText = leagueEventVenue
    ? `${(leagueEventVenue.leagueEvent || '').toUpperCase()} tonight at ${leagueEventVenue.name}`
    : 'Join the Artesian Bar League for local events & prizes.';

  const isFullWidthPage = [
    '/map', '/league-membership', '/admin', '/owner', '/venue-handover'
  ].includes(location.pathname);

  const isDiscoveryFlow = location.pathname === '/' || location.pathname === '/bars' || location.pathname.startsWith('/bars/') || location.pathname === '/back-room';

  // --- Actions Shim ---
  const handleMemberLoginClick = (mode?: 'login' | 'signup') => openModal('LOGIN', { mode });
  const handleClockIn = (venue: any) => openModal('CLOCK_IN', { venue });
  const handleVibeCheck = (venue: any) => openModal('VIBE_CHECK', { venue });
  const handleEditVenue = (venueId: string) => navigate(`/owner/venues/${venueId}`);

  return (
    <div className={`h-full bg-slate-950 text-slate-200 font-sans mx-auto relative shadow-2xl overflow-hidden flex flex-col transition-all duration-500 ${isFullWidthPage
      ? 'w-full max-w-none border-x-0'
      : 'max-w-md border-x border-white/5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] rounded-none md:rounded-3xl md:my-8'
      }`}>
      {!isDiscoveryFlow && (
        <div className={`sticky top-0 z-40 backdrop-blur-xl transition-all duration-300 ${pulseStatus === 'buzzing' ? 'shadow-[0_4px_20px_-5px_rgba(251,191,36,0.5)]' : 'shadow-lg'}`}>
          <div className={`relative border-b transition-colors duration-500 ${pulseStatus === 'buzzing' ? 'bg-black/80 border-primary' : 'bg-slate-950/80 border-white/5'}`}>
            {pulseStatus === 'buzzing' && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
            )}
            <div className={`p-3 flex justify-between items-center mx-auto transition-all ${isFullWidthPage ? 'max-w-[1600px] px-6' : ''}`}>
              <div onClick={() => navigate('/')} className="text-2xl md:text-3xl font-black tracking-tighter text-white flex items-center gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0">
                  <Beer className={`w-10 h-10 md:w-12 md:h-12 ${pulseStatus === 'buzzing' ? 'text-primary' : 'text-slate-400'}`} />
                  {pulseStatus === 'buzzing' && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-black animate-ping" />
                  )}
                </div>
                <span className="font-league uppercase leading-none group-hover:text-primary transition-colors flex flex-col">
                  <span className="flex items-center">OLYBARS<span className="text-primary">.COM</span></span>
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => {
                  const isAuthenticated = userProfile?.uid && userProfile.uid !== 'guest';
                  if (!isAuthenticated) openModal('LOGIN', { mode: 'login' });
                  else navigate('/profile'); // Was onProfileClick
                }} className="text-slate-400 hover:text-primary transition-all active:scale-97 ease-spring-smooth" title="Profile">
                  <User className="w-6 h-6" strokeWidth={2.5} />
                </button>
                <button onClick={() => setShowInfo(true)} className="text-slate-400 hover:text-primary transition-all active:scale-97 ease-spring-smooth" title="Rules & Prizes">
                  <Info className="w-6 h-6" strokeWidth={2.5} />
                </button>
                <button onClick={() => setShowMenu(true)} className="text-white hover:text-primary transition-all active:scale-97 ease-spring-smooth">
                  <Menu className="w-8 h-8" strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
          {!isMapPage && !searchQuery && !location.pathname.startsWith('/partners') && !['/league-membership', '/profile', '/settings', '/owner', '/admin', '/back-room', '/passport', '/league'].includes(location.pathname) && <BuzzClock venues={venues} />}
        </div>
      )}

      <main id="main-content" className="flex-1 overflow-y-auto relative flex flex-col">
        <ErrorBoundary>
          <React.Suspense fallback={<RouteLoading />}>
            <Outlet context={{
              venues, // Keep for now
              userProfile,
              onAskArtie: (mode?: 'visitor' | 'ops') => {
                if (mode === 'visitor') (window as any)._artie_force_guest = true;
                else (window as any)._artie_force_guest = false;
                setShowArtie(true);
              },
              onToggleMenu: () => setShowMenu(true),
              onClockIn: handleClockIn,
              onVibeCheck: handleVibeCheck,
              clockedInVenue: null, // Deprecated? Need to check if accessible via context
              onToggleFavorite: toggleFavorite,
              onEditVenue: handleEditVenue,
              isLoading: false, // Legacy
              onToggleWeeklyBuzz: () => { }, // Legacy
              clockInHistory,
              vibeCheckHistory,
              onMemberLoginClick: handleMemberLoginClick,
              onOpenHomeBase: (venueId: string, venueName: string) => { }, // Placeholder
              onOpenSips: () => { } // Placeholder
            }} />
          </React.Suspense>
        </ErrorBoundary>
        {location.pathname !== '/map' && <Footer />}
      </main>

      <div className={`sticky bottom-0 w-full ${isFullWidthPage ? 'max-w-none' : 'max-w-md'} bg-black border-t-4 border-primary z-20 shadow-2xl transition-all`}>
        <div className={`p-3 mx-auto ${isFullWidthPage ? 'max-w-[1600px]' : ''}`}>
          {leagueMember ? (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-900/50 p-1 rounded-lg transition-all" onClick={() => navigate('/profile')}>
                <div className="bg-slate-900 p-2 border-2 border-white relative shadow-sm">
                  <Trophy className="w-5 h-5 text-primary" strokeWidth={3} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-primary font-black uppercase tracking-widest leading-none mb-1">{GAMIFICATION_CONFIG.CURRENCY.NAME}</span>
                  <FormatCurrency amount={userPoints} showLabel={false} className="text-2xl" />
                </div>
              </div>
              <div className="text-right cursor-pointer hover:bg-slate-900/50 p-1 rounded-lg transition-all" onClick={() => navigate('/league?tab=standings')}>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span className="text-[10px] text-black font-black bg-primary border-2 border-white px-2 py-0.5 transform -skew-x-12 inline-block">RANK: #{userRank || '-'}</span>
                  <StarIcon className="w-4 h-4 text-primary fill-primary" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center gap-3">
              <span className="text-sm font-black text-white">{leaguePromoText}</span>
              <button onClick={() => navigate('/profile')} className="bg-primary text-black text-[11px] font-black uppercase px-3 py-2 border-2 border-black">View League</button>
            </div>
          )}
        </div>
      </div>

      <Sidebar
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onLogin={handleMemberLoginClick}
        onProfileClick={() => navigate('/profile')}
        userPoints={userPoints}
      />

      <ArtieHoverIcon onClick={() => { (window as any)._artie_force_guest = false; setShowArtie(true); }} userProfile={userProfile} />

      <OlyChatModal
        isOpen={!!showArtie && viewMode !== 'owner'}
        onClose={() => setShowArtie(false)}
        userProfile={userProfile}
        initialVenueId={initialVenueId || undefined}
        artieChat={artieChat}
        opsSchmidt={opsSchmidt}
        persona={persona}
      />

      {viewMode === 'owner' && (
        <SchmidtChatModal
          isOpen={!!showArtie}
          onClose={() => setShowArtie(false)}
          venueId={initialVenueId || userProfile?.homeBase}
          userProfile={userProfile}
        />
      )}

      <InfoRulesModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
      <CookieBanner />
    </div>
  );
};

import React, { Suspense, lazy } from 'react';
import { useLayout, useGamification, useUser } from '../../contexts';

// --- LAZY COMPONENTS (Moved from App.tsx) ---
const LoginModal = lazy(() => import('../../features/auth/components/LoginModal').then(m => ({ default: m.LoginModal })));
const ClockInModal = lazy(() => import('../../features/venues/components/ClockInModal').then(m => ({ default: m.ClockInModal })));
const VibeCheckModal = lazy(() => import('../../features/venues/components/VibeCheckModal').then(m => ({ default: m.VibeCheckModal })));
const MakerSurveyModal = lazy(() => import('../../features/marketing/components/MakerSurveyModal').then(m => ({ default: m.MakerSurveyModal })));
const VibeReceiptModal = lazy(() => import('../../features/social/components/VibeReceiptModal').then(m => ({ default: m.VibeReceiptModal })));
const PreferredSipsModal = lazy(() => import('../../features/profile/components/PreferredSipsModal').then(m => ({ default: m.PreferredSipsModal })));
const HomeBaseModal = lazy(() => import('../../features/profile/components/HomeBaseModal').then(m => ({ default: m.HomeBaseModal })));
const GatekeeperModal = lazy(() => import('../../features/venues/components/GatekeeperModal').then(m => ({ default: m.GatekeeperModal })));

export const GlobalModals: React.FC = () => {
  const { activeModal, modalData, closeModal, openModal } = useLayout();
  const { awardPoints, addToClockInHistory, handleVibeCheckSubmission, currentReceipt, clearReceipt } = useGamification();
  const { userProfile, setUserProfile } = useUser();

  // Shim for missing context method
  const setAlertPrefs = (prefs: any) => {
    console.log("Updating alert prefs:", prefs);
    // TODO: Map prefs to userProfile.notificationSettings
  };

  // Helper to close modal
  const handleClose = () => closeModal();

  // Login Modal Helpers
  const handleLoginSuccess = async () => {
    // maybe refresh user?
    closeModal();
  };

  if (!activeModal && !currentReceipt) return null;

  return (
    <Suspense fallback={null}>
      {/* Auth */}
      {activeModal === 'LOGIN' && (
        <LoginModal
          isOpen={true}
          onClose={handleClose}
          initialMode={modalData?.mode || 'login'}
          onSuccess={handleLoginSuccess}
        />
      )}

      {/* Venues */}
      {activeModal === 'CLOCK_IN' && (
        <ClockInModal
          isOpen={true}
          onClose={handleClose}
          selectedVenue={modalData?.venue}
          awardPoints={awardPoints}
          setClockedInVenue={() => { }} // No-op for global modal
          onLogin={(mode) => openModal('LOGIN', { mode })}
          onJoinLeague={() => openModal('LOGIN', { mode: 'signup' })}
          onClockInRecord={(record) => {
            if (modalData?.venue) {
              addToClockInHistory({
                venueId: modalData.venue.id,
                timestamp: record.timestamp
              });
            }
            closeModal();
          }}
        />
      )}

      {activeModal === 'VIBE_CHECK' && (
        <VibeCheckModal
          isOpen={true}
          onClose={handleClose}
          venue={modalData?.venue}
          onConfirm={async (venue, status, hasConsent, photoUrl, method, gameStatus, soberCheck) => {
            const result = await handleVibeCheckSubmission(venue, status, hasConsent, photoUrl, method, gameStatus, soberCheck);
            closeModal();
            // GamificationContext handles receipt
          }}
          onLogin={(mode) => openModal('LOGIN', { mode })}
        />
      )}

      {activeModal === 'GATEKEEPER' && (
        <GatekeeperModal
          isOpen={true}
          onClose={handleClose}
          onAcknowledge={handleClose}
          venue={modalData?.venue}
        />
      )}

      {/* Marketing */}
      {activeModal === 'MAKER_SURVEY' && (
        <MakerSurveyModal
          isOpen={true}
          onClose={handleClose}
          userId={userProfile?.uid || 'guest'}
        />
      )}

      {/* Profile */}
      {activeModal === 'PREFERRED_SIPS' && (
        <PreferredSipsModal
          isOpen={true}
          onClose={handleClose}
          userProfile={userProfile}
          setUserProfile={setUserProfile}
        />
      )}

      {activeModal === 'HOME_BASE' && (
        <HomeBaseModal
          isOpen={true}
          onClose={handleClose}
          venueName={modalData?.venue?.name || 'Venue'}
          venueId={modalData?.venue?.id || ''}
        />
      )}

      {/* Receipts (Global Overlay) */}
      {currentReceipt && (
        <VibeReceiptModal
          onClose={clearReceipt}
          data={currentReceipt}
          isLoggedIn={userProfile?.uid !== 'guest'}
          onLogin={(mode) => openModal('LOGIN', { mode })}
        />
      )}
    </Suspense>
  );
};

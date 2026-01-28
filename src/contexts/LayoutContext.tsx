import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

// --- Types ---
export type ModalType =
  | 'LOGIN'
  | 'CLOCK_IN'
  | 'VIBE_CHECK'
  | 'VIBE_ALERT'
  | 'VENUE_INFO'
  | 'GATEKEEPER'
  | 'MAKER_SURVEY'
  | 'MAKER_MODAL'
  | 'PREFERRED_SIPS'
  | 'HOME_BASE'
  | null;

interface LayoutContextType {
  // Chrome Visibility
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;
  showInfo: boolean;
  setShowInfo: (show: boolean) => void;
  showArtie: boolean;
  setShowArtie: (show: boolean) => void;

  // Modal Management
  activeModal: ModalType;
  modalData: any;
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- State ---
  const [showMenu, setShowMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showArtie, setShowArtie] = useState(false);

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalData, setModalData] = useState<any>(null);

  // --- Actions ---
  const openModal = useCallback((type: ModalType, data: any = null) => {
    setModalData(data);
    setActiveModal(type);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalData(null);
  }, []);

  const value = useMemo(() => ({
    showMenu,
    setShowMenu,
    showInfo,
    setShowInfo,
    showArtie,
    setShowArtie,
    activeModal,
    modalData,
    openModal,
    closeModal
  }), [showMenu, showInfo, showArtie, activeModal, modalData, openModal, closeModal]);

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

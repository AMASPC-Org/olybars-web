
import { create } from 'zustand';

interface UIState {
  // Sidebar State
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;

  // Global Modals
  activeModal: 'LOGIN' | 'CLOCK_IN' | 'VIBE_CHECK' | 'GATEKEEPER' | 'MAKER_SURVEY' | 'PREFERRED_SIPS' | 'HOME_BASE' | 'VIBE_ALERT' | 'VENUE_INFO' | 'MAKER_MODAL' | 'NONE';
  modalData: any | null; // Placeholder for flexibility
  openModal: (type: 'LOGIN' | 'CLOCK_IN' | 'VIBE_CHECK' | 'GATEKEEPER' | 'MAKER_SURVEY' | 'PREFERRED_SIPS' | 'HOME_BASE' | 'VIBE_ALERT' | 'VENUE_INFO' | 'MAKER_MODAL', data?: any) => void;
  closeModal: () => void;

  // Feature Flags / View Modes
  viewMode: 'player' | 'owner';
  setViewMode: (mode: 'player' | 'owner') => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Sidebar
  isSidebarOpen: false,
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  // Modals
  activeModal: 'NONE',
  modalData: null,
  openModal: (type, data = null) => set({ activeModal: type, modalData: data }),
  closeModal: () => set({ activeModal: 'NONE', modalData: null }),

  // View Mode
  viewMode: (localStorage.getItem('olybars_view_mode') as 'player' | 'owner') || 'player',
  setViewMode: (mode) => {
    localStorage.setItem('olybars_view_mode', mode);
    set({ viewMode: mode });
  }
}));

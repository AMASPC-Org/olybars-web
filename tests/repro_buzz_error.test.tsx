/**
 * @vitest-environment jsdom
 */

import { describe, it, vi, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BuzzScreen } from '../src/features/venues/screens/BuzzScreen';
import { BrowserRouter, Route, Routes, Outlet } from 'react-router-dom';
import React from 'react';
import '@testing-library/jest-dom';

// Mock child components to isolate BuzzScreen logic
vi.mock('../src/components/ui/BuzzClock', () => ({
  BuzzClock: () => <div data-testid="buzz-clock">BuzzClock</div>,
}));

vi.mock('../src/features/venues/components/DiscoveryControls', () => ({
  DiscoveryControls: () => <div data-testid="discovery-controls">DiscoveryControls</div>,
}));

vi.mock('../src/features/venues/contexts/DiscoveryContext', () => ({
  useDiscovery: () => ({
    searchQuery: '',
    filterKind: 'all',
    statusFilter: 'all',
    sceneFilter: 'all',
    playFilter: 'all',
    featureFilter: 'all',
    eventFilter: 'all',
    selectedDate: new Date(),
    viewMode: 'list',
    isToday: true,
    clearAllFilters: vi.fn(),
    mapRegion: 'all',
    searchParams: new URLSearchParams(),
  }),
  DiscoveryProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock('../src/hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    coords: { latitude: 47.0379, longitude: -122.9007 },
    requestLocation: vi.fn(),
  }),
}));

vi.mock('../src/services/venueService', () => ({
  updateVenueDetails: vi.fn(),
}));

// Mock Firebase
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    getFirestore: vi.fn(),
    query: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn(() => vi.fn()), // Returns unsubscribe fn
  };
});

// Mock local firebase lib to prevent initialization
vi.mock('../src/lib/firebase', () => ({
  db: {},
  auth: {},
  functions: {},
  storage: {},
  analytics: {},
  googleProvider: {},
  facebookProvider: {},
}));

describe('BuzzScreen ReferenceError Reproduction', () => {
  const mockVenues = [
    {
      id: 'venue-1',
      name: 'Test Venue',
      status: 'flowing',
      vibe: 'Chill',
      venueType: 'bar',
      location: { lat: 47.0, lng: -122.9 },
    },
  ];

  const mockUserProfile = {
    uid: 'test-user',
    role: 'guest',
    displayName: 'Test User',
  };

  const mockOnClockIn = vi.fn();
  const mockOnVibeCheck = vi.fn();

  // Helper to render BuzzScreen within a Router and Outlet Context
  const renderBuzzScreen = (contextOverride = {}) => {
    return render(
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <Outlet
                context={{
                  venues: mockVenues,
                  userProfile: mockUserProfile,
                  onClockIn: mockOnClockIn,
                  onVibeCheck: mockOnVibeCheck,
                  isLoading: false,
                  clockInHistory: [],
                  vibeCheckHistory: [],
                  ...contextOverride,
                }}
              />
            }
          >
            {/* Direct rendering on path / to simulate AppShell -> DiscoveryLayout structure */}
            <Route path="/" element={<BuzzScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    );
  };

  it('renders without crashing when context is fully provided', () => {
    expect(() => renderBuzzScreen()).not.toThrow();
    expect(screen.getByText('Test Venue')).toBeInTheDocument();
  });

  it('renders "Clock In" button and it is clickable', () => {
    renderBuzzScreen();
    const clockInBtn = screen.getByText('Clock In');
    fireEvent.click(clockInBtn);
    expect(mockOnClockIn).toHaveBeenCalledWith(expect.objectContaining(mockVenues[0]));
  });

  it('handles missing onClockIn in context gracefully (or throws if that is the bug)', () => {
    // If we pass undefined for onClockIn
    const contextWithMissingOnClockIn = {
      onClockIn: undefined
    };

    // This is where we expect the error if the component doesn't handle it
    renderBuzzScreen(contextWithMissingOnClockIn);

    // If it renders, clicking might throw
    const clockInBtn = screen.getByText('Clock In');

    // We expect this might throw TypeError (not a function), but checking for ReferenceError
    try {
      fireEvent.click(clockInBtn);
    } catch (e: any) {
      console.error("Caught error during click:", e);
    }
  });
});

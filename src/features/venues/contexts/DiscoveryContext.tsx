import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { VenueStatus } from '../../../types';
import { isSameDay, isAfter, startOfToday } from 'date-fns';

export type FilterKind = 'status' | 'deals' | 'scene' | 'play' | 'makers' | 'features' | 'events' | 'all';

interface DiscoveryContextType {
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    filterKind: FilterKind;
    setFilterKind: (k: FilterKind) => void;
    statusFilter: VenueStatus | 'all';
    setStatusFilter: (s: VenueStatus | 'all') => void;
    sceneFilter: string | 'all';
    setSceneFilter: (s: string | 'all') => void;
    playFilter: string | 'all';
    setPlayFilter: (s: string | 'all') => void;
    featureFilter: string | 'all';
    setFeatureFilter: (s: string | 'all') => void;
    eventFilter: string | 'all';
    setEventFilter: (s: string | 'all') => void;
    selectedDate: Date;
    setSelectedDate: (d: Date) => void;
    viewMode: 'list' | 'map';
    setViewMode: (m: 'list' | 'map') => void;
    clearAllFilters: () => void;
    isToday: boolean;
    mapRegion: string;
    setMapRegion: (r: string) => void;
    searchParams: URLSearchParams;
}

const DiscoveryContext = createContext<DiscoveryContextType | undefined>(undefined);

export const DiscoveryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get('q') || '';

    const [filterKind, setFilterKind] = useState<FilterKind>('all');
    const [statusFilter, setStatusFilter] = useState<VenueStatus | 'all'>('all');
    const [sceneFilter, setSceneFilter] = useState<string | 'all'>('all');
    const [playFilter, setPlayFilter] = useState<string | 'all'>('all');
    const [featureFilter, setFeatureFilter] = useState<string | 'all'>('all');
    const [eventFilter, setEventFilter] = useState<string | 'all'>('all');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Sync viewMode with URL
    const [viewMode, setViewModeInternal] = useState<'list' | 'map'>(searchParams.get('view') === 'map' ? 'map' : 'list');

    const setViewMode = useCallback((m: 'list' | 'map') => {
        setViewModeInternal(m);
        setSearchParams(prev => {
            if (m === 'map') prev.set('view', 'map');
            else prev.delete('view');
            return prev;
        });
    }, [setSearchParams]);

    const [mapRegion, setMapRegion] = useState<string>('all');

    const isToday = useMemo(() => isSameDay(selectedDate, new Date()), [selectedDate]);

    /**
     * Discovery Pivot Logic
     * When picking a future date, some filters "don't make sense" (All, Vibe, Scene, Features).
     * We pivot to 'Events' automatically to show relevant future plans.
     */
    const handleSetSelectedDate = useCallback((d: Date) => {
        setSelectedDate(d);

        const isFuture = isAfter(d, startOfToday()) && !isSameDay(d, new Date());
        if (isFuture) {
            // Forbidden categories for future view (Mental Model: "Pulse" is for now, "Scene" is for now)
            const incompatibleFilters: FilterKind[] = ['all', 'status', 'scene', 'features'];
            if (incompatibleFilters.includes(filterKind)) {
                console.log(`[DISCOVERY] Pivoting to 'events' for future date ${d.toDateString()}`);
                setFilterKind('events');
                setEventFilter('all');
            }
        }
    }, [filterKind]);

    const setSearchQuery = useCallback((q: string) => {
        setSearchParams(prev => {
            if (q) prev.set('q', q);
            else prev.delete('q');
            return prev;
        });
    }, [setSearchParams]);

    const clearAllFilters = useCallback(() => {
        setFilterKind('all');
        setStatusFilter('all');
        setSceneFilter('all');
        setPlayFilter('all');
        setFeatureFilter('all');
        setEventFilter('all');
        setSelectedDate(new Date());
    }, []);

    const value = useMemo(() => ({
        searchQuery,
        setSearchQuery,
        filterKind,
        setFilterKind,
        statusFilter,
        setStatusFilter,
        sceneFilter,
        setSceneFilter,
        playFilter,
        setPlayFilter,
        featureFilter,
        setFeatureFilter,
        eventFilter,
        setEventFilter,
        selectedDate,
        setSelectedDate: handleSetSelectedDate,
        viewMode,
        setViewMode,
        clearAllFilters,
        isToday,
        mapRegion,
        setMapRegion,
        searchParams
    }), [
        searchQuery, setSearchQuery, filterKind, statusFilter, sceneFilter,
        playFilter, featureFilter, eventFilter, selectedDate, handleSetSelectedDate,
        viewMode, setViewMode, clearAllFilters, isToday, mapRegion, searchParams
    ]);

    return (
        <DiscoveryContext.Provider value={value}>
            {children}
        </DiscoveryContext.Provider>
    );
};

export const useDiscovery = () => {
    const context = useContext(DiscoveryContext);
    if (context === undefined) {
        throw new Error('useDiscovery must be used within a DiscoveryProvider');
    }
    return context;
};

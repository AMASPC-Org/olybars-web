import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Venue } from '../../../types';
import { useGoogleMapsScript } from '../../../hooks/useGoogleMapsScript';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { Loader2, MapPin } from 'lucide-react';
import { useDiscovery } from '../contexts/DiscoveryContext';
import { isVenueOpen } from '../../../utils/venueUtils';

interface VenueMapProps {
    venues: Venue[];
    center?: { lat: number; lng: number };
    zoom?: number;
    height?: string;
    className?: string;
}

const REGION_TARGETS: Record<string, { lat: number; lng: number; zoom: number }> = {
    westside: { lat: 47.0435, lng: -122.9310, zoom: 14 },
    downtown: { lat: 47.0425, lng: -122.9007, zoom: 15 },
    eastside: { lat: 47.0425, lng: -122.8680, zoom: 14 },
    all: { lat: 47.0425, lng: -122.9007, zoom: 12 }
};

export const VenueMap: React.FC<VenueMapProps> = ({
    venues,
    center,
    zoom = 14,
    height = '100%',
    className = ''
}) => {
    const navigate = useNavigate();
    const mapRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<any[]>([]);
    const infoWindowRef = useRef<any>(null);
    const { status, apiKey, error } = useGoogleMapsScript();
    const { coords } = useGeolocation({ shouldPrompt: false });
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const { mapRegion } = useDiscovery();

    const initMap = () => {
        if (!mapRef.current || !window.google) return;

        // Use region target or geolocation or default Oly
        const target = REGION_TARGETS[mapRegion] || REGION_TARGETS.downtown;
        const initialMap = new google.maps.Map(mapRef.current, {
            center: center || target,
            zoom: zoom || target.zoom,
            disableDefaultUI: true,
            zoomControl: true,
            clickableIcons: false, // Prevents POI clicks
            styles: darkMapStyle
        });
        setMap(initialMap);
    };

    useEffect(() => {
        if (status === 'ready' && !map) {
            initMap();
        }
    }, [status, map]);

    // Region Navigation Logic
    useEffect(() => {
        if (!map || !window.google) return;
        const target = REGION_TARGETS[mapRegion];
        if (target) {
            map.panTo({ lat: target.lat, lng: target.lng });
            map.setZoom(target.zoom);
        }
    }, [map, mapRegion]);

    useEffect(() => {
        if (!map || !venues || !window.google) return;

        // Clear old markers
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        venues.forEach(venue => {
            if (!venue.location?.lat || !venue.location?.lng) return;
            if (venue.isActive === false) return;

            // [CINDERELLA PROTOCOL]
            if (venue.isCinderella && !isVenueOpen(venue)) return;

            const isLeagueAnchor = venue.tier_config?.is_league_eligible;
            const isBuzzing = venue.status === 'buzzing';
            const isPrivate = venue.membershipRequired;

            // Private clubs are desaturated
            const iconColor = isPrivate ? "#64748b" : (isLeagueAnchor ? "#fbbf24" : "#94a3b8");

            // Use a lock path for private clubs
            const pinPath = isPrivate
                ? "M12,2a5,5,0,0,0-5,5v3H6a2,2,0,0,0-2,2v8a2,2,0,0,0,2,2H18a2,2,0,0,0,2-2V12a2,2,0,0,0-2-2H17V7A5,5,0,0,0,12,2Zm3,8H9V7a3,3,0,0,1,6,0Z"
                : "M4,3h12v15c0,2.2-1.8,4-4,4H8c-2.2,0-4-1.8-4-4V3z M16,6h2c1.7,0,3,1.3,3,3v4c0,1.7-1.3,3-3,3h-2";

            // Standard Marker implementation since mapId overrides styles
            const marker = new google.maps.Marker({
                position: { lat: venue.location.lat, lng: venue.location.lng },
                map: map,
                title: venue.name,
                icon: {
                    path: pinPath,
                    fillColor: iconColor,
                    fillOpacity: 1,
                    strokeWeight: 1.5,
                    strokeColor: "#000",
                    scale: isBuzzing ? 1.5 : (isPrivate ? 0.8 : 1),
                    anchor: new google.maps.Point(12, 12),
                },
                label: {
                    text: venue.name,
                    color: isPrivate ? "#94a3b8" : "white",
                    fontSize: "10px",
                    fontWeight: "900",
                    className: "marker-label-bg" // We can style this in CSS for the background
                }
            });

            marker.addListener('click', () => {
                navigate(`/bars/${venue.id}`);
            });

            markersRef.current.push(marker);

            // Pulse logic
            const recentActivity = venue.clockIns && venue.clockIns > 0;
            const recentVibeCheck = venue.currentBuzz?.lastUpdated && (Date.now() - venue.currentBuzz.lastUpdated) < 3600000;

            if (recentActivity || recentVibeCheck) {
                const beaconCircle = new google.maps.Circle({
                    strokeWeight: 0,
                    fillColor: recentVibeCheck ? "#fbbf24" : "#60a5fa",
                    fillOpacity: 0.2,
                    map: map,
                    center: { lat: venue.location.lat, lng: venue.location.lng },
                    radius: 50,
                    clickable: false,
                    zIndex: -2
                });
                markersRef.current.push(beaconCircle);
            }
        });

    }, [map, venues, status]);


    return (
        <div className={`relative w-full overflow-hidden ${className}`} style={{ height }}>
            <div ref={mapRef} className="w-full h-full" />
            {status === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm z-20">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                    <p className="text-white font-league text-sm uppercase tracking-widest text-center px-6 italic">Synchronizing Buzz Hub...</p>
                </div>
            )}
            {status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-20 p-6 text-center">
                    <div className="bg-red-500/10 p-4 rounded-full mb-4">
                        <MapPin className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-white font-black uppercase tracking-widest mb-2">Map Module Failed</p>
                    <p className="text-red-400 text-xs font-mono mb-4 max-w-xs">{error?.message || "Unknown Connection Error"}</p>
                    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-slate-800 border border-white/10 rounded-lg text-xs font-bold uppercase hover:bg-slate-700 transition-colors">
                        Reload System
                    </button>
                </div>
            )}
        </div>
    );
};

const darkMapStyle = [
    {
        featureType: "all",
        elementType: "labels.icon",
        stylers: [{ visibility: "off" }]
    },
    {
        featureType: "poi",
        elementType: "all",
        stylers: [{ visibility: "off" }]
    },
    {
        featureType: "transit",
        elementType: "all",
        stylers: [{ visibility: "off" }]
    },
    {
        featureType: "poi.business",
        stylers: [{ visibility: "off" }]
    },
    {
        featureType: "poi.medical",
        stylers: [{ visibility: "off" }]
    },
    {
        featureType: "poi.school",
        stylers: [{ visibility: "off" }]
    },
    {
        featureType: "poi.park",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
    },
    {
        featureType: "all",
        elementType: "geometry",
        stylers: [{ color: "#0f172a" }]
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#334155" }]
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#020617" }]
    },
    {
        elementType: "labels.text.stroke",
        stylers: [{ color: "#0f172a" }]
    },
    {
        elementType: "labels.text.fill",
        stylers: [{ color: "#94a3b8" }]
    },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#fbbf24" }]
    }
];



import React, { useEffect, useRef, useState } from 'react';
import { Venue } from '../../../types';
import { Loader2, MapPin, Save, X } from 'lucide-react';
import { useGoogleMapsScript } from '../../../hooks/useGoogleMapsScript';

interface PinCalibrationMapProps {
    venue: Venue;
    onSave: (coords: { lat: number; lng: number }) => void;
    onCancel: () => void;
}

export const PinCalibrationMap: React.FC<PinCalibrationMapProps> = ({ venue, onSave, onCancel }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const { status } = useGoogleMapsScript();
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [marker, setMarker] = useState<google.maps.Marker | null>(null);
    const [currentCoords, setCurrentCoords] = useState({
        lat: venue.location?.lat || 47.0425,
        lng: venue.location?.lng || -122.9007
    });

    useEffect(() => {
        if (status === 'ready' && mapRef.current && !map) {
            const initialMap = new (window as any).google.maps.Map(mapRef.current, {
                center: currentCoords,
                zoom: 18,
                // mapId removed to fix InvalidKeyMapError
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: true,
            });

            const legacyMarker = new (window as any).google.maps.Marker({
                map: initialMap,
                position: currentCoords,
                title: `Drag to calibrate: ${venue.name}`,
                draggable: true, // Legacy property is 'draggable' not 'gmpDraggable'
            });

            legacyMarker.addListener('dragend', () => {
                const position = legacyMarker.getPosition();
                if (position) {
                    setCurrentCoords({
                        lat: position.lat(),
                        lng: position.lng()
                    });
                }
            });

            setMap(initialMap);
            setMarker(legacyMarker);
        }
    }, [status, venue]);

    return (
        <div className="flex flex-col h-[500px] w-full bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-4 bg-slate-800 border-b border-white/5 flex justify-between items-center shrink-0">
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest font-league flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" /> Pin Calibration: {venue.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 italic">Drag the marker to the front door</p>
                </div>
                <button onClick={onCancel} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 relative">
                <div ref={mapRef} className="w-full h-full" />
                {status === 'loading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                )}
            </div>

            <div className="p-4 bg-slate-800 border-t border-white/5 flex justify-between items-center shrink-0">
                <div className="flex gap-4 font-mono text-[10px]">
                    <div>
                        <span className="text-slate-500 uppercase mr-1">Lat:</span>
                        <span className="text-primary font-bold">{currentCoords.lat.toFixed(6)}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 uppercase mr-1">Lng:</span>
                        <span className="text-primary font-bold">{currentCoords.lng.toFixed(6)}</span>
                    </div>
                </div>
                <button
                    onClick={() => onSave(currentCoords)}
                    className="bg-primary text-black font-black px-6 py-2 rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                    <Save className="w-3.5 h-3.5" /> Save Coordinates
                </button>
            </div>
        </div>
    );
};

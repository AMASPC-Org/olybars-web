import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VenueMap } from '../../venues/components/VenueMap';
import { useDiscovery } from '../../venues/contexts/DiscoveryContext';
import { ArrowLeft } from 'lucide-react';

export const MapScreen: React.FC = () => {
  const { processedVenues } = useDiscovery();
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full relative bg-slate-900">
      <VenueMap venues={processedVenues} />

      {/* Floating Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-10 bg-black/80 p-3 rounded-full text-white hover:text-primary transition-colors border border-white/10 shadow-lg"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>
    </div>
  );
};

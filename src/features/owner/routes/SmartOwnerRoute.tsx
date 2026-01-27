import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../../contexts';
import { Venue } from '../../../types';
import { OwnerDashboardScreen } from '../screens/OwnerDashboardScreen';
import { BouncerGate } from '../../auth/components/BouncerGate';
import OwnerPortal from '../screens/OwnerPortal';

interface SmartOwnerRouteProps {
  venues: Venue[];
  handleUpdateVenue: (venueId: string, updates: Partial<Venue>) => Promise<void>;
  isLoading: boolean;
}

export const SmartOwnerRoute: React.FC<SmartOwnerRouteProps> = ({
  venues,
  handleUpdateVenue,
  isLoading,
}) => {
  const { venueId, tab } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useUser();

  // Helper to resolve initial venue
  const resolveStartingVenue = () => {
    if (venueId) return venueId;
    // If admin with no permissions, default to hannahs (legacy dev)
    // If owner, pick first venue
    if (userProfile.venuePermissions && Object.keys(userProfile.venuePermissions).length > 0) {
      return Object.keys(userProfile.venuePermissions)[0];
    }
    // Fallback to first available venue in list, or 'hannahs' as safety
    return venues.length > 0 ? venues[0].id : "hannahs";
  };

  const defaultVenueId = resolveStartingVenue();

  return (
    <BouncerGate
      isLoading={isLoading}
      fallback={<OwnerPortal />}
    >
      <OwnerDashboardScreen
        isOpen={true}
        onClose={() => navigate("/")}
        venues={venues}
        updateVenue={handleUpdateVenue}
        userProfile={userProfile}
        initialVenueId={defaultVenueId}
        initialView={(tab as any) || "operations"}
        isLoading={isLoading}
      />
    </BouncerGate>
  );
};

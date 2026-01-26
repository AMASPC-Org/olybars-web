import React from 'react';
import { useUser } from '../../../contexts/UserContext';
import { BouncerService, AdmissionStatus } from '../../../services/BouncerService';
import { Loader2 } from 'lucide-react';

interface BouncerGateProps {
  // userProfile is now internal
  isLoading?: boolean; // Optional external loading signal
  children: React.ReactNode;
  fallback: React.ReactNode; // The "Guest Wall" or "Owner Portal" landing page
}

/**
 * A security wrapper that enforces BouncerService.validateOwnerAccess.
 * Consumes UserContext directly for authoritative checking.
 */
export const BouncerGate: React.FC<BouncerGateProps> = ({
  isLoading: externalLoading,
  children,
  fallback
}) => {
  const { userProfile, isLoading: isAuthLoading } = useUser();

  const isLoading = externalLoading || isAuthLoading;

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-primary">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  // 2. Role Validation
  const status = BouncerService.validateOwnerAccess(userProfile);

  // 3. Gate Logic
  if (status !== AdmissionStatus.ALLOWED) {
    return <>{fallback}</>;
  }

  // 4. Access Granted
  return <>{children}</>;
};

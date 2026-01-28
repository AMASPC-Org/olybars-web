import React from 'react';
import { usePersona } from '../../contexts/PersonaContext';
import { Navigate } from 'react-router-dom';

interface PersonaGuardProps {
  requiredCapability: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * PersonaGuard
 * 
 * A visual gatekeeper. Wraps protected routes or components.
 * If the user lacks the specific capability from `persona_manifest.ts`,
 * they are redirected or shown a fallback.
 */
export const PersonaGuard: React.FC<PersonaGuardProps> = ({
  requiredCapability,
  children,
  fallback = <Navigate to="/" replace />
}) => {
  const { canAccess, isLoading } = usePersona();

  if (isLoading) {
    // Prevent "Flash of Denial"
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="animate-pulse text-glass-400">Verifying Identity...</div>
      </div>
    );
  }

  if (!canAccess(requiredCapability)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

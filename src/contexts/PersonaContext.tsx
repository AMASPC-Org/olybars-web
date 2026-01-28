import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { PERMISSIONS, isOwnerCapability } from '../config/persona_manifest';

type PersonaType = 'artie' | 'schmidt';

interface PersonaContextType {
  activePersona: PersonaType;
  isLoading: boolean;
  theme: {
    primaryColor: string;
    assistantName: string;
    voiceStyle: string;
  };
  forcePersona: (persona: PersonaType | null) => void;
  setActivePersona: (persona: PersonaType) => void;
  canAccess: (capability: string) => boolean;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export const PersonaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [user, userLoading] = useAuthState(auth);
  const [claims, setClaims] = useState<any>(null);
  const [claimsLoading, setClaimsLoading] = useState(true);

  // Manual Override (The Ryan Rule - Intent)
  const [manualOverride, setManualOverride] = useState<PersonaType | null>(null);

  // 1. Fetch Claims
  useEffect(() => {
    if (user) {
      user.getIdTokenResult().then((result) => {
        setClaims(result.claims);
        setClaimsLoading(false);
      }).catch(e => {
        console.error("Persona Claim Fetch Error:", e);
        setClaimsLoading(false);
      });
    } else {
      setClaims(null);
      setClaimsLoading(false);
    }
  }, [user]);

  // 2. Determine Persona (Securely)
  const activePersona: PersonaType = useMemo(() => {
    // If loading, default to Artie (Safe)
    if (userLoading || (user && claimsLoading)) return 'artie';

    // The User's Intent (URL or Manual Toggle)
    const isSchmidtPath = location.pathname.startsWith('/owner') ||
      location.pathname.startsWith('/manage') ||
      location.pathname.includes('/dashboard');

    // Default intent based on path, unless overridden
    const desiredPersona = manualOverride || (isSchmidtPath ? 'schmidt' : 'artie');

    // SECURITY CHECK: Can they actually BE Schmidt?
    const isOwner = claims?.role === 'owner';

    if (desiredPersona === 'schmidt' && !isOwner) {
      // Intent denied. Downgrade to Artie.
      // We don't error here, we just refuse to switch.
      // The PersonaGuard will handle the redirection/UX.
      return 'artie';
    }

    return desiredPersona;
  }, [user, claims, userLoading, claimsLoading, location.pathname, manualOverride]);

  // 3. Theme Logic
  const theme = activePersona === 'artie'
    ? { primaryColor: 'text-purple-400', assistantName: 'Artie', voiceStyle: 'mystical' }
    : { primaryColor: 'text-blue-400', assistantName: 'Schmidt', voiceStyle: 'operational' };

  // 4. Access Check Helper
  const canAccess = (capability: string): boolean => {
    if (!isOwnerCapability(capability)) return true; // Everyone has Artie Power
    return activePersona === 'schmidt' && claims?.role === 'owner'; // Double check
  };

  return (
    <PersonaContext.Provider value={{
      activePersona,
      theme,
      isLoading: userLoading || (!!user && claimsLoading),
      forcePersona: setManualOverride,
      setActivePersona: (p) => setManualOverride(p),
      canAccess
    }}>
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersona = () => {
  const context = useContext(PersonaContext);
  if (context === undefined) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
};



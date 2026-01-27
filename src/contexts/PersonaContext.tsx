import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

type PersonaType = 'artie' | 'schmidt';

interface PersonaContextType {
  activePersona: PersonaType;
  theme: {
    primaryColor: string;
    assistantName: string;
    voiceStyle: string;
  };
  forcePersona: (persona: PersonaType | null) => void; // Allow manual override (Ryan Rule)
  setActivePersona: (persona: PersonaType) => void; // Direct setter alias
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export const PersonaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [activePersona, setActivePersona] = useState<PersonaType>('artie');
  const [manualOverride, setManualOverride] = useState<PersonaType | null>(null);

  useEffect(() => {
    if (manualOverride) {
      setActivePersona(manualOverride);
      return;
    }

    const path = location.pathname;

    // SCHMIDT ZONES (Owner/Ops)
    if (
      path.startsWith('/owner') ||
      path.startsWith('/manage') ||
      path.includes('/dashboard')
    ) {
      setActivePersona('schmidt');
    }
    // ARTIE ZONES (Guest/Vibe)
    else {
      setActivePersona('artie');
    }
  }, [location.pathname, manualOverride]);

  const theme = activePersona === 'artie'
    ? {
      primaryColor: 'text-purple-400',
      assistantName: 'Artie',
      voiceStyle: 'mystical'
    }
    : {
      primaryColor: 'text-blue-400',
      assistantName: 'Schmidt',
      voiceStyle: 'operational'
    };

  return (
    <PersonaContext.Provider value={{ activePersona, theme, forcePersona: setManualOverride, setActivePersona: (p) => setManualOverride(p) }}>
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

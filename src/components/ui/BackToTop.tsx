import React from 'react';
import { ArrowUp } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export const BackToTop: React.FC = () => {
  const { showBackToTop } = useUIStore();

  if (!showBackToTop) return null;

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={handleScrollToTop}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-6 z-50 w-12 h-12 flex items-center justify-center bg-primary text-black rounded-full shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] active:scale-95 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <ArrowUp className="w-6 h-6" />
    </button>
  );
};

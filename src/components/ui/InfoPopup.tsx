import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface InfoContent {
  title: string;
  text: string;
}

interface InfoPopupProps {
  infoContent: InfoContent | null;
  setInfoContent: (content: InfoContent | null) => void;
}

export const InfoPopup: React.FC<InfoPopupProps> = ({ infoContent, setInfoContent }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayContent, setDisplayContent] = useState<InfoContent | null>(null);

  useEffect(() => {
    if (infoContent) {
      setDisplayContent(infoContent);
      // Small delay to allow render before fading in
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      // Wait for animation to finish before clearing content
      const timer = setTimeout(() => {
        setDisplayContent(null);
      }, 300); // Matches duration-300
      return () => clearTimeout(timer);
    }
  }, [infoContent]);

  if (!displayContent) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={() => setInfoContent(null)}
    >
      <div
        className={`glass-panel p-6 rounded-2xl shadow-2xl max-w-sm w-full relative transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-black text-primary uppercase tracking-wide mb-3 font-league">
          {displayContent.title}
        </h3>
        <p className="text-sm text-slate-300 font-medium leading-relaxed font-body">
          {displayContent.text}
        </p>
        <button
          onClick={() => setInfoContent(null)}
          className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { Bot, CheckCircle, X } from 'lucide-react';

interface VibeAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetVibe: string;
}

export const VibeAlertModal: React.FC<VibeAlertModalProps> = ({ isOpen, onClose, targetVibe }) => {
  if (!isOpen) return null;

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-slate-900 border border-primary/20 rounded-2xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-primary" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-2">You're all set!</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              We've set a watch for <strong>{capitalize(targetVibe)}</strong> spots within 5 miles.
            </p>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-lg flex items-start gap-3 text-left w-full">
            <Bot className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400">
              I'll send you a push notification the second a venue flips to <strong>{capitalize(targetVibe)}</strong>.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-primary hover:bg-primary-600 text-slate-900 font-bold rounded-xl transition-all active:scale-95"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

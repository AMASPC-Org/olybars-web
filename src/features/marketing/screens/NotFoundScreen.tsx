
import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundScreen: React.FC = () => {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center space-y-8 bg-slate-900 text-white relative overflow-hidden">
      {/* Background Ambience (Optional: could be an image or gradient) */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-emerald-950/20 to-slate-900 pointer-events-none" />

      <div className="relative z-10 max-w-md w-full">
        {/* Icon / Art */}
        <div className="mb-6 flex justify-center">
          <span className="text-8xl opacity-50 filter drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">🌲</span>
        </div>

        {/* Headlines */}
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 font-league text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
          Lost in the <span className="text-primary">Woods?</span>
        </h1>

        <p className="text-slate-400 font-medium text-lg mb-8 leading-relaxed">
          The trail you're looking for has gone cold. It might have been claimed by the moss.
        </p>

        {/* Action Buttons (Drunk Thumb Compliant) */}
        <div className="flex flex-col gap-4 w-full">
          <Link
            to="/"
            className="w-full h-14 bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all rounded-xl flex items-center justify-center font-bold text-slate-900 uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
            Return to Civilization
          </Link>

          <Link
            to="/bars"
            className="w-full h-14 bg-slate-800 border border-slate-700 hover:border-slate-600 active:scale-[0.98] transition-all rounded-xl flex items-center justify-center font-bold text-slate-200 uppercase tracking-widest"
          >
            Check the Directory
          </Link>
        </div>
      </div>

      {/* Footer / Context */}
      <p className="absolute bottom-8 text-xs text-slate-600 font-mono uppercase tracking-widest">
        ERROR 404 • SYSTEM LOST
      </p>
    </div>
  );
};

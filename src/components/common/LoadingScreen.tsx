import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({
  message = "Loading OlyBars...",
}: LoadingScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-primary animate-in fade-in duration-700">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse-slow" />
        <div className="glass-panel p-6 rounded-2xl relative z-10 border-primary/30">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </div>
      <p className="text-sm font-black uppercase tracking-[0.3em] text-white/80 animate-pulse font-league">
        {message}
      </p>
    </div>
  );
};

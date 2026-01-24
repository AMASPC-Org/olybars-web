import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({
  message = "Loading OlyBars...",
}: LoadingScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-primary animate-in fade-in duration-300">
      <div className="relative">
        <Loader2 className="w-12 h-12 animate-spin" />
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] animate-pulse">
        {message}
      </p>
    </div>
  );
};

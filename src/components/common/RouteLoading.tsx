import React from "react";
import { Loader2 } from "lucide-react";

export const RouteLoading = () => {
  return (
    <div className="flex-1 min-h-[50vh] flex items-center justify-center animate-in fade-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse-slow" />
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl relative z-10 shadow-xl">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    </div>
  );
};

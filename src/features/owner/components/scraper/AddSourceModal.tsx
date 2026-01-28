import React, { useState } from "react";
import {
  X,
  Globe,
  Plus,
  Instagram,
  Facebook,
  Layout,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { ScrapeTarget } from "../../../../types/venue";
import { cn } from "../../../../lib/utils";

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (
    url: string,
    target: ScrapeTarget,
    frequency: "daily" | "weekly" | "monthly",
    description?: string
  ) => void;
  existingUrls: string[];
}

type PresetType = "instagram" | "facebook" | "website" | "custom";

interface PresetConfig {
  id: PresetType;
  label: string;
  icon: React.ElementType;
  target: ScrapeTarget;
  placeholder: string;
  description: string;
  color: string;
}

const PRESETS: PresetConfig[] = [
  {
    id: "instagram",
    label: "Connect Instagram",
    icon: Instagram,
    target: "SOCIAL_FEED",
    placeholder: "https://instagram.com/yourvenue",
    description: "Syncs latest posts & event flyers.",
    color: "bg-pink-500",
  },
  {
    id: "facebook",
    label: "Connect Facebook",
    icon: Facebook,
    target: "EVENTS",
    placeholder: "https://facebook.com/yourvenue/events",
    description: "Syncs official event calendar.",
    color: "bg-blue-600",
  },
  {
    id: "website",
    label: "Track Website",
    icon: Globe,
    target: "WEBSITE",
    placeholder: "https://www.yourvenue.com/events",
    description: "Monitors page for changes.",
    color: "bg-emerald-500",
  },
];

export const AddSourceModal: React.FC<AddSourceModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingUrls,
  // tier, // Unused in v2 (Presets drive logic)
}) => {
  const [step, setStep] = useState<"SELECT" | "CONFIGURE">("SELECT");
  const [selectedPreset, setSelectedPreset] = useState<PresetConfig | null>(
    null
  );
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = (preset: PresetType) => {
    if (preset === "custom") {
      // Manual fallback
      setSelectedPreset({
        id: "custom",
        label: "Custom Source",
        icon: Layout,
        target: "WEBSITE",
        placeholder: "https://...",
        description: "Configure advanced scraper settings.",
        color: "bg-violet-500",
      });
    } else {
      const config = PRESETS.find((p) => p.id === preset);
      if (config) setSelectedPreset(config);
    }
    setStep("CONFIGURE");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    // Basic Validation
    if (existingUrls.includes(url)) {
      setError("This URL is already being tracked.");
      return;
    }

    try {
      new URL(url); // Check valid URL format
    } catch {
      setError("Please enter a valid URL (e.g. https://...)");
      return;
    }

    onAdd(url, selectedPreset!.target, "daily", notes); // Default to daily for now
    handleClose();
  };

  const handleClose = () => {
    setStep("SELECT");
    setSelectedPreset(null);
    setUrl("");
    setNotes("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-white/5 px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            {step === "CONFIGURE" && (
              <button
                onClick={() => setStep("SELECT")}
                className="rounded-full p-1 hover:bg-white/10 transition-colors"
                type="button"
              >
                <ArrowLeft className="h-5 w-5 text-white/70" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-white">
              {step === "SELECT" ? "Add Intelligence Source" : selectedPreset?.label}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "SELECT" ? (
            <div className="grid gap-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelect(preset.id)}
                  className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-full bg-opacity-20",
                        preset.color.replace("bg-", "bg-opacity-20 ") +
                        " " +
                        preset.color.replace("bg-", "text-")
                      )}
                    >
                      <preset.icon className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-white">{preset.label}</h3>
                      <p className="text-sm text-white/50">
                        {preset.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/30 transition-transform group-hover:translate-x-1" />
                </button>
              ))}

              <div className="my-2 border-t border-white/5" />

              <button
                onClick={() => handleSelect("custom")}
                className="group flex w-full items-center justify-between rounded-xl border border-dashed border-white/20 bg-transparent p-4 transition-all hover:border-white/40 hover:bg-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                    <Layout className="h-5 w-5 text-white/50" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-white/90">Custom Source</h3>
                    <p className="text-sm text-white/40">
                      Configure manual scraper settings (Legacy).
                    </p>
                  </div>
                </div>
                <Plus className="h-5 w-5 text-white/30" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* URL Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">
                  Source URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={selectedPreset?.placeholder}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder-white/30 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                  {url && !error && (
                    <CheckCircle2 className="absolute right-3 top-3.5 h-5 w-5 text-emerald-500" />
                  )}
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <p className="text-xs text-white/40">
                  Schmidt will automatically detect events and menu updates from
                  this page.
                </p>
              </div>

              {/* Notes Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">
                  Internal Note (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Main Events Page"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder-white/30 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-xl bg-white/5 px-4 py-3 font-medium text-white hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!url}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Source
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { X, Globe, Plus, AlertCircle, Clock } from "lucide-react";
import { ScrapeTarget, PartnerTier } from "../../../../types/venue";

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (
    url: string,
    target: ScrapeTarget,
    frequency: "daily" | "weekly" | "monthly",
    description?: string,
  ) => void;
  existingUrls: string[];
  tier: PartnerTier;
}

export const AddSourceModal: React.FC<AddSourceModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingUrls,
  tier,
}) => {
  const [url, setUrl] = useState("");
  const [target, setTarget] = useState<ScrapeTarget>("EVENTS");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">(
    "monthly",
  );
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Tier Logic
  const canDoWeekly = [PartnerTier.PRO, PartnerTier.AGENCY].includes(tier);
  const canDoDaily = tier === PartnerTier.AGENCY;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation 1: URL Format
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http")) {
      cleanUrl = "https://" + cleanUrl;
    }

    try {
      new URL(cleanUrl);
    } catch {
      setError("Please enter a valid URL (e.g. https://instagram.com/...)");
      return;
    }

    // Validation 2: Duplication
    if (existingUrls.includes(cleanUrl)) {
      setError("This URL is already connected.");
      return;
    }

    // Validation 3: Limit
    if (existingUrls.length >= 5) {
      setError("Maximum of 5 sources allowed. Please remove one first.");
      return;
    }

    onAdd(cleanUrl, target, frequency, description);
    setUrl("");
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40">
          <h3 className="text-sm font-black text-white uppercase tracking-widest font-league">
            Connect New Source
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Source Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  "MENU",
                  "DRINKS",
                  "EVENTS",
                  "CALENDAR",
                  "WEBSITE",
                  "SOCIAL_FEED",
                  "NEWSLETTER",
                ] as ScrapeTarget[]
              ).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTarget(t)}
                  className={`px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${target === t
                      ? "bg-primary text-black border-primary"
                      : "bg-black border-white/10 text-slate-500 hover:border-white/20"
                    }`}
                >
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Clock className="w-3 h-3 text-slate-400" />
              Update Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-primary/50 outline-none font-medium appearance-none"
            >
              <option value="monthly">Monthly (Included)</option>
              <option value="weekly" disabled={!canDoWeekly}>
                Weekly {canDoWeekly ? "(Pro)" : "(Pro Only 🔒)"}
              </option>
              <option value="daily" disabled={!canDoDaily}>
                Daily {canDoDaily ? "(Agency)" : "(Agency Only 🔒)"}
              </option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              URL / Web Address
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={
                  target === "EVENTS" || target === "CALENDAR"
                    ? "https://facebook.com/events/..."
                    : target === "WEBSITE"
                      ? "https://yourvenue.com"
                      : target === "SOCIAL_FEED"
                        ? "https://instagram.com/yourvenue"
                        : "https://yourvenue.com/menu"
                }
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-primary/50 outline-none font-medium"
                autoFocus
              />
            </div>
          </div>

          {/* Context Field for Instructions */}
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              {target === "SOCIAL_FEED" ? "Feed Instructions (Sync Logic)" : "Scraper Instructions (Optional)"}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                target === "MENU" || target === "DRINKS"
                  ? "e.g. Only extract Draft Beer, ignore the wine list..."
                  : target === "CALENDAR"
                    ? "e.g. Grab recurring weekly trivia on Tuesdays..."
                    : target === "SOCIAL_FEED"
                      ? "e.g. Ignore 'link in bio' posts, only sync real events..."
                      : "e.g. Look for the 'Live Music' section on the homepage and grab dates..."
              }
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-primary/50 outline-none font-medium min-h-[80px]"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-[10px] font-bold uppercase tracking-wide">
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary text-black px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              Add Source
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

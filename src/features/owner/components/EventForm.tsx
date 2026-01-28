import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Type,
  Loader2,
  Sparkles,
  CheckCircle,
  Save,
} from "lucide-react";
import { AppEvent } from "../../../types";
import { EventService } from "../../../services/eventService";
import { useToast } from "../../../components/ui/BrandedToast";

export interface EventFormData {
  title: string;
  type: AppEvent["type"];
  date: string;
  time: string;
  description: string;
}

interface EventFormProps {
  venueId: string;
  venueName: string;
  initialData?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading: boolean;
  submitLabel?: string;
  showTitle?: boolean; // Option to hide title if parent has one
}

export const EventForm: React.FC<EventFormProps> = ({
  venueId,
  venueName,
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = "Schedule Event",
}) => {
  const { showToast } = useToast();
  const [isPolishing, setIsPolishing] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    type: "other",
    date: "",
    time: "",
    description: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  const handlePolish = async () => {
    if (!formData.title || !formData.date || !formData.time) {
      showToast(
        "Fill in Title, Date, and Time first to provide context for the AI.",
        "error",
      );
      return;
    }

    setIsPolishing(true);
    try {
      const polished = await EventService.generateDescription({
        venueId,
        type: formData.type,
        date: formData.date,
        time: formData.time,
        title: formData.title,
        description: formData.description,
        venueName,
      });
      setFormData((prev) => ({ ...prev, description: polished }));
      showToast("Description optimized!", "success");
    } catch (error: any) {
      showToast(
        error.message || "AI is currently unavailable. Try again later.",
        "error",
      );
    } finally {
      setIsPolishing(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.time) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    await onSubmit(formData);
  };

  const eventTypes = [
    { value: "karaoke", label: "Karaoke" },
    { value: "trivia", label: "Trivia" },
    { value: "live_music", label: "Live Music" },
    { value: "dj", label: "DJ Set" },
    { value: "bingo", label: "Bingo" },
    { value: "openmic", label: "Open Mic" },
    { value: "happy_hour", label: "Happy Hour" },
    { value: "sports", label: "Sports" },
    { value: "comedy", label: "Comedy" },
    { value: "other", label: "Other/Special" },
  ];

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          Event Title *
        </label>
        <input
          type="text"
          placeholder="e.g. Wednesday Night Trivia"
          className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Type
          </label>
          <div className="relative">
            <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as any })
              }
            >
              {eventTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Date *
          </label>
          <input
            type="date"
            className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          Start Time *
        </label>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="time"
            className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-primary/50 transition-colors"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex justify-between items-center">
          <span>Description</span>
          <button
            type="button"
            onClick={handlePolish}
            disabled={isPolishing}
            className="text-primary flex items-center gap-1 hover:text-white transition-colors disabled:opacity-50"
          >
            {isPolishing ? (
              <Loader2 size={10} className="animate-spin" />
            ) : (
              <Sparkles size={10} />
            )}
            <span>Generate description</span>
          </button>
        </label>
        <textarea
          placeholder="Brief details about the event..."
          rows={3}
          className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors resize-none"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      <div className="pt-2 flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-widest py-3 rounded-xl transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="flex-[2] bg-primary hover:bg-yellow-400 text-black font-black uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_-5px_rgba(251,191,36,0.5)]"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <CheckCircle size={20} />
          )}
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

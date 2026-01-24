import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  Type,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { AppEvent, Venue } from "../../../types";
import { EventService } from "../../../services/eventService";
import { useToast } from "../../../components/ui/BrandedToast";

interface EventCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueId: string;
  venueName: string;
  onEventCreated: () => void;
  initialData?: { title: string; date: string };
  existingEvents?: AppEvent[];
}

export const EventCreateModal: React.FC<EventCreateModalProps> = ({
  isOpen,
  onClose,
  venueId,
  venueName,
  onEventCreated,
  initialData,
  existingEvents = [],
}) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "other" as AppEvent["type"],
    date: "",
    time: "",
    description: "",
  });

  React.useEffect(() => {
    if (isOpen && initialData) {
      setFormData((prev) => ({
        ...prev,
        title: initialData.title || prev.title,
        date: initialData.date || prev.date,
      }));
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.time) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    // Conflict Check (Client-Side)
    const hasConflict = existingEvents.some(
      (evt) => evt.date === formData.date && evt.status === "approved", // Only conflict with approved events
    );

    if (hasConflict) {
      if (
        !window.confirm(
          "⚠️ DOUBLE BOOKING WARNING: You already have an approved event on this date. Are you sure you want to schedule another?",
        )
      ) {
        return;
      }
    }

    setIsLoading(true);
    try {
      await EventService.submitEvent({
        venueId,
        venueName,
        // Wait, submitEvent type requires venueName? Let's check type definition.
        // Omit<AppEvent, 'id' | 'status' | 'createdAt' | 'submittedBy'>
        // Yes, venueName is required in AppEvent.
        // I should fetch it or pass it.
        // Actually, let's just pass empty string for now, backend likely fills it or I'll pass it from parent.
        ...formData,
        status: "pending", // Technically submitEvent overrides this but good to be explicit
      } as any); // Casting since submitEvent signature is strict on Omit

      showToast("Event scheduled successfully!", "success");
      onEventCreated();
      onClose();
      // Reset form
      setFormData({
        title: "",
        type: "other",
        date: "",
        time: "",
        description: "",
      });
    } catch (error: any) {
      showToast(error.message || "Failed to create event.", "error");
    } finally {
      setIsLoading(false);
    }
  };

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
        venueName, // Added venue context for better generation
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

  const eventTypes = [
    { value: "karaoke", label: "Karaoke" },
    { value: "trivia", label: "Trivia" },
    { value: "live_music", label: "Live Music" },
    { value: "bingo", label: "Bingo" },
    { value: "openmic", label: "Open Mic" },
    { value: "other", label: "Other/Special" },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-md rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="bg-primary p-4 flex justify-between items-center">
          <h2 className="text-black font-black uppercase text-xl font-league tracking-wide flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Schedule Event
          </h2>
          <button
            onClick={onClose}
            className="text-black/70 hover:text-black transition-colors rounded-full p-1 hover:bg-black/10"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Event Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Wednesday Night Trivia"
              className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
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
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-yellow-400 text-black font-black uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_-5px_rgba(251,191,36,0.5)]"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <CheckCircle size={20} />
              )}
              Schedule Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

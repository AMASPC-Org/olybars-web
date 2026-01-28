import React, { useState } from "react";
import {
  X,
  Calendar,
} from "lucide-react";
import { AppEvent } from "../../../types";
import { EventService } from "../../../services/eventService";
import { useToast } from "../../../components/ui/BrandedToast";
import { EventForm } from "./EventForm";

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



  if (!isOpen) return null;

  const handleSubmit = async (data: any) => {
    // Conflict Check (Client-Side)
    const hasConflict = existingEvents.some(
      (evt) => evt.date === data.date && evt.status === "approved",
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
        ...data,
        status: "pending",
      });

      showToast("Event scheduled successfully!", "success");
      onEventCreated();
      onClose();
    } catch (error: any) {
      showToast(error.message || "Failed to create event.", "error");
    } finally {
      setIsLoading(false);
    }
  };

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

        <div className="p-6">
          <EventForm
            venueId={venueId}
            venueName={venueName}
            initialData={initialData as any}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={isLoading}
            submitLabel="Schedule Event"
          />
        </div>
      </div>
    </div>
  );
};

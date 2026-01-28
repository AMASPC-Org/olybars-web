import React, { useState } from "react";
import { X, Calendar, Edit } from "lucide-react";
import { LeagueEvent } from "../../../types";
import { EventService } from "../../../services/eventService";
import { useToast } from "../../../components/ui/BrandedToast";
import { EventForm, EventFormData } from "./EventForm";

interface EventEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueId: string;
  venueName: string;
  event: LeagueEvent;
  onEventUpdated: () => void;
}

export const EventEditModal: React.FC<EventEditModalProps> = ({
  isOpen,
  onClose,
  venueId,
  venueName,
  event,
  onEventUpdated,
}) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    try {
      await EventService.updateEvent(event.id, {
        ...data,
        // Preserve originalDescription if it exists, otherwise don't touch it
        // EventService.updateEvent merges fields, so we only send what changed.
      });

      showToast("Event updated successfully!", "success");
      onEventUpdated();
      onClose();
    } catch (error: any) {
      showToast(error.message || "Failed to update event.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-md rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="bg-primary p-4 flex justify-between items-center">
          <h2 className="text-black font-black uppercase text-xl font-league tracking-wide flex items-center gap-2">
            <Edit className="w-5 h-5" /> Edit Event
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
            initialData={{
              title: event.title,
              type: event.type,
              date: event.date,
              time: event.time || "",
              description: event.description || "",
            }}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={isLoading}
            submitLabel="Save Changes"
          />
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  MessageSquare,
  Info,
  Trophy,
  BrainCircuit,
  ShieldAlert,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Repeat,
  List,
  Music,
  Mic,
  Brain,
  Hash,
  Star,
} from "lucide-react";
import { Venue, AppEvent } from "../../../types";
import { EventService } from "../../../services/eventService";
import { useToast } from "../../../components/ui/BrandedToast";
import { EventCreateModal } from "./EventCreateModal";
import { CalendarStrip } from "./CalendarStrip";

interface EventsManagementTabProps {
  venue: Venue;
  initialEventDraft?: { title: string; date: string };
}

export const EventsManagementTab: React.FC<EventsManagementTabProps> = ({
  venue,
  initialEventDraft,
}) => {
  const { showToast } = useToast();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [expandedAnalysisId, setExpandedAnalysisId] = useState<string | null>(
    null,
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<"upcoming" | "recurring">(
    "upcoming",
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Filter events based on viewMode and selectedDate
  const filteredEvents = events
    .filter((event) => {
      // 1. Date Filter (if selected)
      if (selectedDate) {
        // Safe comparison: convert selectedDate to YYYY-MM-DD (Local)
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");
        const selectedDateStr = `${year}-${month}-${day}`;

        if (event.date !== selectedDateStr) return false;
      }
      return true;
    })
    .sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}`).getTime() -
        new Date(`${b.date}T${b.time}`).getTime(),
    );

  const loadEvents = async () => {
    setIsLoading(true);
    const fetchedEvents = await EventService.fetchEvents({
      venueId: venue.id,
      status: "pending",
    });
    const approvedEvents = await EventService.fetchEvents({
      venueId: venue.id,
      status: "approved",
    });
    setEvents([...fetchedEvents, ...approvedEvents]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadEvents();
    if (initialEventDraft) {
      setShowCreateModal(true);
    }
  }, [venue.id, initialEventDraft]);

  const handleUpdateStatus = async (
    eventId: string,
    updates: Partial<AppEvent>,
  ) => {
    setIsActionLoading(eventId);
    try {
      await EventService.updateEvent(eventId, updates);
      if (updates.status)
        showToast(
          `Event ${updates.status === "approved" ? "Approved" : "Rejected"}!`,
          "success",
        );
      if (updates.isLeagueEvent !== undefined)
        showToast(`League Status Updated!`, "success");
      await loadEvents();
    } catch (error: any) {
      showToast(error.message || "Failed to update event.", "error");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    setIsActionLoading(eventId);
    try {
      await EventService.deleteEvent(eventId);
      showToast("Event deleted.", "success");
      await loadEvents();
    } catch (error: any) {
      showToast(error.message || "Failed to delete event.", "error");
    } finally {
      setIsActionLoading(null);
    }
  };

  const getEventTypeConfig = (type: string) => {
    switch (type) {
      case "karaoke":
        return {
          icon: <Mic size={10} />,
          label: "Karaoke",
          color: "text-pink-400 border-pink-500/30 bg-pink-500/10",
        };
      case "trivia":
        return {
          icon: <Brain size={10} />,
          label: "Trivia",
          color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
        };
      case "live_music":
        return {
          icon: <Music size={10} />,
          label: "Live Music",
          color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
        };
      case "bingo":
        return {
          icon: <Hash size={10} />,
          label: "Bingo",
          color: "text-green-400 border-green-500/30 bg-green-500/10",
        };
      case "openmic":
        return {
          icon: <Mic size={10} />,
          label: "Open Mic",
          color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
        };
      default:
        return {
          icon: <Star size={10} />,
          label: type || "Special",
          color: "text-slate-400 border-white/10 bg-white/5",
        };
    }
  };

  const handleRefineDescription = async (event: AppEvent) => {
    setIsGenerating(event.id);
    try {
      const refinedDescription = await EventService.generateDescription({
        venueId: venue.id,
        type: event.type,
        date: event.date,
        time: event.time,
      });
      await EventService.updateEvent(event.id, {
        description: refinedDescription,
      });
      showToast("Schmidt has polished the description!", "success");
      await loadEvents();
    } catch (error: any) {
      showToast(error.message || "Failed to polish description.", "error");
    } finally {
      setIsGenerating(null);
    }
  };

  const handleAnalyze = async (event: AppEvent) => {
    setAnalyzingId(event.id);
    try {
      const analysis = await EventService.analyzeEvent({
        title: event.title,
        type: event.type,
        date: event.date,
        time: event.time,
        description: event.description,
      });

      // Save analysis to event
      await EventService.updateEvent(event.id, { analysis });
      showToast(`Schmidt Score: ${analysis.confidenceScore}/100`, "success");
      setExpandedAnalysisId(event.id); // Auto-expand results
      await loadEvents();
    } catch (error: any) {
      showToast(error.message || "Analysis failed.", "error");
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleApprove = (event: AppEvent) => {
    if (event.analysis?.lcbWarning) {
      if (
        !window.confirm(
          "CRITICAL WARNING: Schmidt detected a potential LCB compliance issue. Are you sure you want to publish this event?",
        )
      )
        return;
    } else if (event.analysis && event.analysis.confidenceScore < 50) {
      if (
        !window.confirm(
          `Schmidt Score is low (${event.analysis.confidenceScore}). Are you sure you want to approve?`,
        )
      )
        return;
    }
    handleUpdateStatus(event.id, { status: "approved" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight font-league">
            Event Management
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Approve community submissions or schedule your own
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-black font-black px-4 py-2 rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <Plus size={14} /> Schedule Event
        </button>
      </div>

      {/* View Toggles */}
      <div className="flex bg-white/5 p-1 rounded-xl w-fit">
        <button
          onClick={() => setViewMode("upcoming")}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
            viewMode === "upcoming"
              ? "bg-primary text-black shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <List size={14} /> Upcoming
        </button>
        <button
          onClick={() => setViewMode("recurring")}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
            viewMode === "recurring"
              ? "bg-primary text-black shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Repeat size={14} /> Recurring Rules
        </button>
      </div>

      {viewMode === "upcoming" && (
        <CalendarStrip
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          className="w-full"
        />
      )}

      {viewMode === "upcoming" ? (
        isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-surface border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-primary/20 transition-all"
              >
                <div className="flex gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      event.status === "approved"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    <Calendar size={24} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-white uppercase font-league tracking-wide">
                        {event.title}
                      </h3>
                      <div className="flex gap-1">
                        <span
                          className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            event.status === "approved"
                              ? "border-green-500/30 text-green-500 bg-green-500/10"
                              : "border-yellow-500/30 text-yellow-500 bg-yellow-500/10"
                          }`}
                        >
                          {event.status}
                        </span>
                        {event.isLeagueEvent && (
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-primary/30 text-primary bg-primary/10 flex items-center gap-1">
                            <Trophy size={8} className="fill-current" /> League
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} /> {event.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {event.time}
                      </span>
                      {(() => {
                        const config = getEventTypeConfig(event.type);
                        return (
                          <span
                            className={`px-2 py-0.5 rounded border flex items-center gap-1 ${config.color}`}
                          >
                            {config.icon} {config.label}
                          </span>
                        );
                      })()}
                    </div>
                    {event.description && (
                      <p className="text-[10px] text-slate-500 font-medium italic truncate max-w-md">
                        "{event.description}"
                      </p>
                    )}
                    {event.submittedBy !== "guest" ? (
                      <p className="text-[8px] text-slate-600 font-bold uppercase flex items-center gap-1">
                        <Sparkles size={8} /> Submitted by Member
                      </p>
                    ) : (
                      <p className="text-[8px] text-slate-600 font-bold uppercase flex items-center gap-1">
                        <MessageSquare size={8} /> Guest Submission
                      </p>
                    )}
                  </div>
                </div>

                {/* Schmidt Analysis Report Card */}
                {event.analysis && expandedAnalysisId === event.id && (
                  <div className="mt-4 bg-black/40 rounded-xl p-4 border border-white/10 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`text-lg font-black font-league ${
                            event.analysis.confidenceScore > 80
                              ? "text-green-500"
                              : event.analysis.confidenceScore > 50
                                ? "text-yellow-500"
                                : "text-red-500"
                          }`}
                        >
                          {event.analysis.confidenceScore}/100
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          Confidence Score
                        </span>
                      </div>
                      {event.analysis.lcbWarning && (
                        <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-red-500/20">
                          <ShieldAlert size={12} /> LCB Warning
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-slate-300 italic">
                        "{event.analysis.summary}"
                      </p>

                      {event.analysis.issues.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangle size={10} /> Issues Detected:
                          </p>
                          <ul className="list-disc list-inside text-[10px] text-slate-400 pl-1">
                            {event.analysis.issues.map((issue, idx) => (
                              <li key={idx}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {event.analysis.suggestions.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={10} /> Suggestions:
                          </p>
                          <ul className="list-disc list-inside text-[10px] text-slate-400 pl-1">
                            {event.analysis.suggestions.map((sugg, idx) => (
                              <li key={idx}>{sugg}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      handleUpdateStatus(event.id, {
                        isLeagueEvent: !event.isLeagueEvent,
                      })
                    }
                    disabled={!!isActionLoading}
                    className={`h-10 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border ${
                      event.isLeagueEvent
                        ? "bg-primary text-black border-primary shadow-[0_0_15px_-3px_rgba(251,191,36,0.3)]"
                        : "bg-white/5 text-slate-400 border-white/10 hover:border-primary/50"
                    }`}
                  >
                    <Trophy
                      size={14}
                      className={event.isLeagueEvent ? "fill-current" : ""}
                    />{" "}
                    League
                  </button>

                  {/* Analyze Button */}
                  <button
                    onClick={() =>
                      event.analysis
                        ? setExpandedAnalysisId(
                            expandedAnalysisId === event.id ? null : event.id,
                          )
                        : handleAnalyze(event)
                    }
                    disabled={!!analyzingId && analyzingId !== event.id}
                    className={`h-10 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border ${
                      event.analysis
                        ? event.analysis.lcbWarning
                          ? "bg-red-500/10 text-red-500 border-red-500/30"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        : "bg-white/5 text-slate-400 border-white/10 hover:border-blue-500/50 hover:text-blue-400"
                    }`}
                  >
                    {analyzingId === event.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <BrainCircuit size={14} />
                    )}
                    {event.analysis
                      ? expandedAnalysisId === event.id
                        ? "Hide Report"
                        : "View Report"
                      : "Analyze"}
                  </button>
                  {event.status === "pending" && (
                    <button
                      onClick={() => handleApprove(event)}
                      disabled={!!isActionLoading}
                      className="h-10 px-4 bg-green-600 hover:bg-green-500 text-white rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleRefineDescription(event)}
                    disabled={!!isActionLoading || !!isGenerating}
                    className="h-10 px-4 bg-primary/10 hover:bg-primary hover:text-black text-primary rounded-xl border border-primary/20 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all group"
                  >
                    {isGenerating === event.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles
                        size={14}
                        className="group-hover:scale-125 transition-transform"
                      />
                    )}
                    Refine
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    disabled={!!isActionLoading}
                    className="h-10 w-10 flex items-center justify-center bg-white/5 hover:bg-red-500/10 hover:text-red-500 text-slate-400 rounded-xl border border-white/10 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-dashed border-white/5 p-12 rounded-3xl text-center space-y-4">
            <Calendar className="w-12 h-12 text-slate-700 mx-auto" />
            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">
              No events found for this filter.
            </p>
          </div>
        )
      ) : (
        <div className="bg-slate-900/40 border border-dashed border-white/5 p-12 rounded-3xl text-center space-y-4">
          <Repeat className="w-12 h-12 text-slate-700 mx-auto" />
          <h3 className="text-white font-league text-xl uppercase">
            Recurring Rules Engine
          </h3>
          <p className="text-slate-500 font-bold text-xs max-w-md mx-auto">
            Set it and forget it. Configure weekly events like "Taco Tuesday" or
            "Trivia Night" here. (Coming Soon)
          </p>
          <button className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-white/10 transition-all">
            + Create Rule
          </button>
        </div>
      )}

      <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
        <div className="flex gap-4">
          <Info className="text-primary shrink-0" size={24} />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-primary uppercase tracking-wider font-league">
              Venue Hosting Rules
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
              Events submitted by the community will appear here for your
              review. Once approved, they go live on the{" "}
              <span className="text-primary">Event Wire</span> and are visible
              to all League members. Make sure to reject any spam or
              non-compliant content to maintain your venue's standing.
            </p>
          </div>
        </div>
      </div>
      <EventCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        venueId={venue.id}
        venueName={venue.name}
        onEventCreated={loadEvents}
        initialData={initialEventDraft}
        existingEvents={events}
      />
    </div>
  );
};

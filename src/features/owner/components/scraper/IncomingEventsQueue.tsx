import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Edit2,
  Sparkles,
  AlertTriangle,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Inbox,
  Filter,
} from "lucide-react";
import { LeagueEvent, AppEvent } from "../../../../types";
import { EventCategory } from "../../../../types/taxonomy";
import { EventService } from "../../../../services/eventService";
import { useToast } from "../../../../components/ui/BrandedToast";
import { EventEditModal } from "../EventEditModal";
import { format } from "date-fns";
import { db } from "../../../../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { cn } from "../../../../lib/utils";

interface IncomingEventsQueueProps {
  venueId: string;
  venueName: string;
}

export const IncomingEventsQueue: React.FC<IncomingEventsQueueProps> = ({
  venueId,
  venueName,
}) => {
  const { showToast } = useToast();
  const [pendingEvents, setPendingEvents] = useState<LeagueEvent[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<AppEvent[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LeagueEvent | null>(null);

  const [expandedSources, setExpandedSources] = useState<Set<string>>(
    new Set(["automation", "facebook", "manual"])
  );

  useEffect(() => {
    const pendingQuery = query(
      collection(db, "league_events"),
      where("venueId", "==", venueId),
      where("status", "==", "PENDING")
    );

    const unsubscribe = onSnapshot(pendingQuery, (snapshot) => {
      const events = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LeagueEvent[];
      events.sort((a, b) => {
        // Prioritize startTime (numeric timestamp)
        if (a.startTime && b.startTime) {
          return a.startTime - b.startTime;
        }
        // Fallback to time string (HH:mm)
        const timeA = a.time || "00:00";
        const timeB = b.time || "00:00";
        return timeA.localeCompare(timeB);
      });
      setPendingEvents(events);
    });

    const fetchApproved = async () => {
      const evts = await EventService.fetchEvents({ venueId });
      setApprovedEvents(evts);
    };
    fetchApproved();

    return () => unsubscribe();
  }, [venueId]);

  const toggleSource = (source: string) => {
    const newSet = new Set(expandedSources);
    if (newSet.has(source)) newSet.delete(source);
    else newSet.add(source);
    setExpandedSources(newSet);
  };

  const handleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const processStatusUpdate = async (
    ids: string[],
    status: "approved" | "rejected"
  ) => {
    setIsProcessing(true);
    try {
      await Promise.all(
        ids.map((id) => EventService.updateEvent(id, { status }))
      );
      showToast(
        `${ids.length} event${ids.length > 1 ? "s" : ""} ${status === "approved" ? "approved" : "rejected"
        }`,
        "success"
      );
      setSelectedIds(new Set());
    } catch (e) {
      console.error(e);
      showToast("Failed to update status", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePolish = async (event: LeagueEvent) => {
    try {
      showToast("Polishing description with AI...", "info");
      const polished = await EventService.generateDescription({
        venueId,
        venueName,
        title: event.title,
        type: event.type as EventCategory,
        date: event.date,
        time: event.time || "19:00",
        description: event.description || "",
      });

      await EventService.updateEvent(event.id, { description: polished });
      showToast("Description polished!", "success");
    } catch (e) {
      showToast("Failed to polish event", "error");
    }
  };

  const groupedEvents = pendingEvents.reduce((acc, evt) => {
    const source = evt.source || "manual";
    if (!acc[source]) acc[source] = [];
    acc[source].push(evt);
    return acc;
  }, {} as Record<string, LeagueEvent[]>);

  // --- RENDERING ---

  if (pendingEvents.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-black/50 p-12 text-center backdrop-blur-md animate-in fade-in duration-700">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-50" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-900/20 border border-emerald-500/30 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]">
            <Inbox className="h-10 w-10 text-emerald-400" />
          </div>
          <h3 className="mb-2 text-2xl font-black tracking-tight text-white">
            Inbox Zero
          </h3>
          <p className="max-w-xs text-sm font-medium leading-relaxed text-slate-400">
            You're all caught up! The AI is monitoring your sources for new
            updates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visual Header / Bulk Actions */}
      <div className="sticky top-0 z-20 flex items-center justify-between rounded-xl border border-white/10 bg-black/60 p-4 backdrop-blur-xl transition-all">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Filter className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Pending Review
            </div>
            <div className="text-sm font-bold text-white">
              {selectedIds.size > 0 ? (
                <span className="text-indigo-400">
                  {selectedIds.size} Selected
                </span>
              ) : (
                <span>{pendingEvents.length} Events</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <div className="flex gap-2 animate-in slide-in-from-right-4 duration-300">
              <button
                onClick={() =>
                  processStatusUpdate(Array.from(selectedIds), "rejected")
                }
                disabled={isProcessing}
                className="rounded-lg bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-colors border border-red-500/20"
              >
                Reject
              </button>
              <button
                onClick={() =>
                  processStatusUpdate(Array.from(selectedIds), "approved")
                }
                disabled={isProcessing}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-black uppercase tracking-widest text-black hover:bg-emerald-400 transition-colors shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
              >
                Approve
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grouped Lists */}
      <div className="space-y-8">
        {Object.entries(groupedEvents).map(([source, events]) => {
          const isExpanded = expandedSources.has(source);
          const sourceLabel =
            source === "automation"
              ? "AI Scraper / Calendar"
              : source === "facebook"
                ? "Social Feeds"
                : "Manual Drafts";

          return (
            <div key={source} className="space-y-3">
              <button
                onClick={() => toggleSource(source)}
                className="flex w-full items-center gap-3 border-b border-white/5 pb-2 text-left group"
              >
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded text-white/50 transition-colors group-hover:bg-white/10 group-hover:text-white",
                    isExpanded && "bg-white/10 text-white"
                  )}
                >
                  {isExpanded ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronUp size={12} />
                  )}
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">
                  {sourceLabel}
                </span>
                <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                  {events.length}
                </span>
              </button>

              {isExpanded && (
                <div className="grid gap-3">
                  {events.map((event) => {
                    // Logic: Conflict & Confidence
                    const conflict = approvedEvents.find((e) => {
                      const t1 = e.startTime || 0;
                      const t2 = event.startTime || 0;
                      return (
                        Number(t1) > 0 &&
                        Number(t2) > 0 &&
                        e.date === event.date &&
                        Math.abs(Number(t1) - Number(t2)) < 3600000
                      );
                    });
                    const isSelected = selectedIds.has(event.id);
                    const startConfidence = event.sourceConfidence || 0;
                    const isLowConfidence =
                      startConfidence < 0.7 && source === "automation";
                    const missingTime = !event.time;

                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          // Allow clicking entire card to select if not clicking button
                          // But checkboxes are better for explicit selection.
                          // Let's keep checkbox authoritative.
                        }}
                        className={cn(
                          "group relative flex items-start gap-4 rounded-xl border p-4 transition-all duration-300",
                          isSelected
                            ? "border-indigo-500/50 bg-indigo-500/5 shadow-[0_0_30px_-10px_rgba(99,102,241,0.2)]"
                            : "border-white/5 bg-slate-900/40 hover:border-white/10 hover:bg-slate-900/60"
                        )}
                      >
                        {/* Selection Checkbox */}
                        <div className="pt-1">
                          <label className="relative flex cursor-pointer items-center justify-center p-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelect(event.id)}
                              className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/20 bg-black/40 transition-all checked:border-indigo-500 checked:bg-indigo-500"
                            />
                            <CheckCircle className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                          </label>
                        </div>

                        {/* Card Content */}
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="flex items-center gap-2 text-base font-bold text-white">
                                {event.title}
                                {isLowConfidence && (
                                  <span className="inline-flex items-center rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-500">
                                    Needs Review
                                  </span>
                                )}
                              </h4>
                              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-medium">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3 text-indigo-400" />
                                  {format(
                                    new Date(event.date),
                                    "EEE, MMM d"
                                  )}
                                </span>
                                <span
                                  className={cn(
                                    "flex items-center gap-1.5",
                                    missingTime && "text-red-400 font-bold"
                                  )}
                                >
                                  <Clock className="h-3 w-3 text-indigo-400" />
                                  {event.time || "Missing Time"}
                                </span>
                                {event.type && (
                                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-300">
                                    {event.type.replace("_", " ")}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Floating Actions */}
                            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                onClick={() => handlePolish(event)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-purple-500/20 hover:text-purple-400 transition-colors"
                                title="AI Polish"
                              >
                                <Sparkles size={16} />
                              </button>
                              <button
                                onClick={() => setEditingEvent(event)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-blue-500/20 hover:text-blue-400 transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <div className="mx-1 h-4 w-px bg-white/10" />
                              <button
                                onClick={() =>
                                  processStatusUpdate([event.id], "rejected")
                                }
                                className="rounded-lg p-2 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                title="Reject"
                              >
                                <XCircle size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  processStatusUpdate([event.id], "approved")
                                }
                                className="rounded-lg p-2 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Alerts & Description */}
                          {(conflict || event.description) && (
                            <div className="space-y-2">
                              {conflict && (
                                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-xs text-red-200">
                                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                                  <span className="font-bold">
                                    Conflict:
                                  </span>{" "}
                                  Clashes with "{conflict.title}" at{" "}
                                  {conflict.time}
                                </div>
                              )}
                              {event.description && (
                                <p className="line-clamp-2 text-xs italic leading-relaxed text-slate-500">
                                  "{event.description}"
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingEvent && (
        <EventEditModal
          isOpen={true}
          onClose={() => setEditingEvent(null)}
          venueId={venueId}
          venueName={venueName}
          event={editingEvent}
          onEventUpdated={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
};

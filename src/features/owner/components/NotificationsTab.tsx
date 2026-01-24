import React, { useState } from "react";
import { db, functions } from "../../../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { LeagueEvent, Venue } from "../../../types";
import { format, parseISO } from "date-fns";
import {
  Check,
  X,
  Bell,
  AlertCircle,
  Edit2,
  Sparkles,
  Clock,
  Camera,
  ExternalLink,
  Sun,
  Calendar,
  Zap,
} from "lucide-react";
import { useToast } from "../../../components/ui/BrandedToast";
import { useVenueNotifications } from "../hooks/useVenueNotifications";
import { VenueNotification } from "../../../types/owner";
import { VenueOpsService } from "../../../services/VenueOpsService";

interface NotificationsTabProps {
  venueId: string;
  onNavigate?: (view: string) => void;
  onDraftPost?: (draft: { type: string; content: string }) => void;
  onCreateEvent?: (draft: { title: string; date: string }) => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  venueId,
  onNavigate,
  onDraftPost,
  onCreateEvent,
}) => {
  const {
    notifications,
    loading: isLoading,
    error,
  } = useVenueNotifications(venueId);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
  }>({ title: "", description: "" });
  const { showToast } = useToast();

  const rewriteDescription = httpsCallable(
    functions,
    "rewriteEventDescription",
  );

  const handleDismissNotification = async (id: string) => {
    setProcessingId(id);
    try {
      await VenueOpsService.dismissNotification(venueId, id);
      showToast("Notification dismissed.", "success");
    } catch (e) {
      showToast("Failed to dismiss.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveEvent = async (
    event: LeagueEvent,
    notificationId?: string,
  ) => {
    if (!event.id) return;
    setProcessingId(notificationId || event.id);
    try {
      await updateDoc(doc(db, "league_events", event.id), {
        status: "APPROVED",
      });
      if (notificationId) {
        await VenueOpsService.resolveNotification(venueId, notificationId);
      }
      showToast("Event approved and live!", "success");
    } catch (e) {
      showToast("Failed to approve event.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectEvent = async (
    event: LeagueEvent,
    notificationId?: string,
  ) => {
    if (!event.id) return;
    setProcessingId(notificationId || event.id);
    try {
      await updateDoc(doc(db, "league_events", event.id), {
        status: "REJECTED",
      });
      if (notificationId) {
        await VenueOpsService.resolveNotification(venueId, notificationId);
      }
      showToast("Event rejected.", "success");
    } catch (e) {
      showToast("Failed to reject event.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprovePhoto = async (photo: any, notificationId?: string) => {
    setProcessingId(notificationId || photo.id || photo.url);
    try {
      const { VenueOpsService } =
        await import("../../../services/VenueOpsService");
      const venue = await VenueOpsService.getVenue(venueId);
      if (!venue || !venue.photos) return;

      const updatedPhotos = venue.photos.map((p) =>
        p.id === photo.id || p.url === photo.url
          ? ({
              ...p,
              marketingStatus: "approved",
              venueAdminApprovedBy: "owner",
              isApprovedForFeed: true,
            } as any)
          : p,
      );

      await updateDoc(doc(db, "venues", venueId), { photos: updatedPhotos });
      if (notificationId) {
        await VenueOpsService.resolveNotification(venueId, notificationId);
      }
      showToast("Photo approved for gallery!", "success");
    } catch (e) {
      showToast("Failed to approve photo.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectPhoto = async (photo: any, notificationId?: string) => {
    setProcessingId(notificationId || photo.id || photo.url);
    try {
      const { VenueOpsService } =
        await import("../../../services/VenueOpsService");
      const venue = await VenueOpsService.getVenue(venueId);
      if (!venue || !venue.photos) return;

      const updatedPhotos = venue.photos.map((p) =>
        p.id === photo.id || p.url === photo.url
          ? ({ ...p, marketingStatus: "rejected" } as any)
          : p,
      );

      await updateDoc(doc(db, "venues", venueId), { photos: updatedPhotos });
      if (notificationId) {
        await VenueOpsService.resolveNotification(venueId, notificationId);
      }
      showToast("Photo rejected.", "success");
    } catch (e) {
      showToast("Failed to reject photo.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1 flex items-center gap-2 italic">
              <Bell className="w-5 h-5 text-red-500" />
              Notifications
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-none">
              {notifications.length} items needing attention
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-xl">
            <Check className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h4 className="text-sm font-black text-white uppercase tracking-widest">
              All Caught Up!
            </h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              No pending items to review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-black/40 border rounded-xl p-4 group transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 ${
                  notification.priority === 1
                    ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)] animate-pulse-subtle"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                {notification.type === "GUEST_EVENT_PENDING" && (
                  <GuestEventApprovalCard
                    event={
                      notification.payload.eventData || notification.payload
                    }
                    isProcessing={processingId === notification.id}
                    onApprove={() =>
                      handleApproveEvent(
                        notification.payload.eventData || notification.payload,
                        notification.id,
                      )
                    }
                    onReject={() =>
                      handleRejectEvent(
                        notification.payload.eventData || notification.payload,
                        notification.id,
                      )
                    }
                  />
                )}

                {notification.type === "HOLIDAY" && (
                  <HolidayCard
                    notification={notification as any}
                    onDraftPost={() =>
                      onDraftPost?.({
                        type: "social",
                        content:
                          (notification.payload || notification).message || "",
                      })
                    }
                    onCreateEvent={() =>
                      onCreateEvent?.({
                        title:
                          (notification.payload || notification).title ||
                          "Holiday Event",
                        date:
                          (notification.payload || notification).action_context
                            ?.eventDate || "",
                      })
                    }
                  />
                )}

                {notification.type === "EVENT_REVIEW" && (
                  <EventReviewCard
                    event={
                      notification.payload.eventData || notification.payload
                    }
                    isEditing={editingId === notification.id}
                    isProcessing={processingId === notification.id}
                    editForm={editForm}
                    onEdit={() => {
                      setEditingId(notification.id);
                      const data =
                        notification.payload.eventData || notification.payload;
                      setEditForm({
                        title: data.title || "",
                        description: data.description || "",
                      });
                    }}
                    onCancelEdit={() => setEditingId(null)}
                    onSaveEdit={() => handleSaveEdit(notification.id)}
                    onUpdateEditForm={(updates) =>
                      setEditForm((prev) => ({ ...prev, ...updates }))
                    }
                    onApprove={() =>
                      handleApproveEvent(
                        notification.payload.eventData || notification.payload,
                        notification.id,
                      )
                    }
                    onReject={() =>
                      handleRejectEvent(
                        notification.payload.eventData || notification.payload,
                        notification.id,
                      )
                    }
                    onSpark={() =>
                      handleSpark(notification.id, editForm.description)
                    }
                  />
                )}

                {notification.type === "PHOTO_APPROVAL" && (
                  <PhotoApprovalCard
                    photo={notification.payload as any}
                    isProcessing={processingId === notification.id}
                    onApprove={() =>
                      handleApprovePhoto(
                        notification.payload as any,
                        notification.id,
                      )
                    }
                    onReject={() =>
                      handleRejectPhoto(
                        notification.payload as any,
                        notification.id,
                      )
                    }
                    onJump={() => onNavigate?.("marketing")}
                  />
                )}

                {notification.type === "SYSTEM_ALERT" && (
                  <SystemAlertCard
                    alert={notification.payload as any}
                    notificationId={notification.id}
                    venueId={venueId}
                    onJump={() => onNavigate?.("scraper")}
                  />
                )}

                {notification.type === "OPPORTUNITY" && (
                  <OpportunityCard
                    opportunity={notification as any}
                    isProcessing={processingId === notification.id}
                    onAskSchmidt={() => onNavigate?.("schmidt")}
                    onDismiss={() => handleDismissNotification(notification.id)}
                  />
                )}

                {notification.type === "SECURITY" && (
                  <SecurityAlertCard
                    alert={notification.payload as any}
                    onDismiss={() => handleDismissNotification(notification.id)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const OpportunityCard: React.FC<{
  opportunity: SystemNotification;
  isProcessing: boolean;
  onAskSchmidt: () => void;
  onDismiss: () => void;
}> = ({ opportunity, isProcessing, onAskSchmidt, onDismiss }) => (
  <div className="flex items-start gap-4 animate-in zoom-in-95 duration-500">
    <div className="bg-green-500/20 text-green-500 p-2.5 rounded-xl shrink-0 border border-green-500/10">
      <Sun className="w-5 h-5" />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-black text-white uppercase tracking-tight italic">
          {opportunity.title}
        </h4>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
          <Sparkles className="w-2.5 h-2.5 text-green-400" />
          <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">
            OPPORTUNITY
          </span>
        </div>
      </div>
      <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1.5 pr-4">
        {opportunity.message}
      </p>
      <div className="flex gap-2 mt-4">
        <button
          onClick={onAskSchmidt}
          className="flex items-center gap-2 text-[9px] font-black text-black bg-primary px-4 py-2 rounded-lg uppercase tracking-widest hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/10"
        >
          <Zap className="w-3.5 h-3.5 fill-current" /> Ask Schmidt
        </button>
        <button
          onClick={onDismiss}
          disabled={isProcessing}
          className="px-4 py-2 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  </div>
);

const WeatherWarningCard: React.FC<{
  alert: SystemNotification;
  onJump: () => void;
}> = ({ alert, onJump }) => (
  <div className="flex items-start gap-4 animate-in slide-in-from-left-4 duration-500">
    <div className="bg-yellow-500/20 text-yellow-500 p-2.5 rounded-xl shrink-0 border border-yellow-500/10">
      <AlertCircle className="w-5 h-5" />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-black text-white uppercase italic">
          Weather Alert
        </h4>
        <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
          LOW VIBE RISK
        </span>
      </div>
      <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1.5">
        {alert.message}
      </p>
      <button
        onClick={onJump}
        className="mt-4 flex items-center gap-1.5 text-[9px] font-black text-yellow-500 uppercase tracking-widest hover:text-yellow-400"
      >
        Check Outdoor Services <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  </div>
);

const EventReviewCard: React.FC<{
  event: LeagueEvent;
  isEditing: boolean;
  isProcessing: boolean;
  editForm: { title: string; description: string };
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onUpdateEditForm: (
    updates: Partial<{ title: string; description: string }>,
  ) => void;
  onApprove: () => void;
  onReject: () => void;
  onSpark: () => void;
}> = ({
  event,
  isEditing,
  isProcessing,
  editForm,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onUpdateEditForm,
  onApprove,
  onReject,
  onSpark,
}) => (
  <div className="space-y-4">
    <div className="flex items-start justify-between">
      <div className="flex gap-4">
        <div className="bg-slate-800 p-2 rounded text-center min-w-[50px] border border-white/5">
          <span className="block text-[10px] font-black text-red-400 uppercase tracking-widest mb-0.5">
            {event.date ? format(parseISO(event.date), "MMM") : "???"}
          </span>
          <span className="block text-xl font-black text-white leading-none">
            {event.date ? format(parseISO(event.date), "dd") : "??"}
          </span>
        </div>
        <div>
          {isEditing ? (
            <input
              value={editForm.title}
              onChange={(e) => onUpdateEditForm({ title: e.target.value })}
              className="bg-black border border-white/20 rounded px-2 py-1 text-white font-black uppercase text-sm w-full mb-1"
            />
          ) : (
            <h4 className="text-lg font-black text-white uppercase italic tracking-tight">
              {event.title}
            </h4>
          )}
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {event.time}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-primary italic font-black">EVENT REVIEW</span>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5 relative">
      {isEditing ? (
        <div className="relative">
          <textarea
            value={editForm.description}
            onChange={(e) => onUpdateEditForm({ description: e.target.value })}
            rows={3}
            className="w-full bg-transparent text-xs text-slate-300 outline-none resize-none placeholder:text-slate-600 font-medium leading-relaxed"
            placeholder="Enter event description..."
          />
          <button
            onClick={onSpark}
            disabled={isProcessing}
            className="mt-2 text-[9px] font-black text-yellow-400 uppercase tracking-widest hover:text-yellow-300 flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20"
          >
            <Sparkles className="w-3 h-3" />
            {isProcessing ? "Sparking..." : "AI Remix"}
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-400 leading-relaxed font-medium">
          {event.description || "No description provided."}
        </p>
      )}
    </div>

    <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
      {isEditing ? (
        <>
          <button
            onClick={onCancelEdit}
            className="px-3 py-1.5 rounded text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={onSaveEdit}
            disabled={isProcessing}
            className="bg-green-500 text-black px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:bg-green-400 flex items-center gap-1"
          >
            <Check className="w-3 h-3" /> Save & Approve
          </button>
        </>
      ) : (
        <>
          <button
            onClick={onEdit}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white bg-white/5 hover:bg-white/10 flex items-center gap-1 border border-white/5 mr-auto"
          >
            <Edit2 className="w-3 h-3" /> Edit
          </button>
          <button
            onClick={onReject}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500/10 flex items-center gap-1 border border-transparent hover:border-red-500/20"
          >
            <X className="w-3 h-3 stroke-[3]" /> Reject
          </button>
          <button
            onClick={onApprove}
            disabled={isProcessing}
            className="bg-primary text-black px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 flex items-center gap-1 shadow-lg shadow-primary/10"
          >
            <Check className="w-3 h-3 stroke-[3]" /> Approve
          </button>
        </>
      )}
    </div>
  </div>
);

const PhotoApprovalCard: React.FC<{
  photo: NonNullable<Venue["photos"]>[number];
  isProcessing: boolean;
  onApprove: () => void;
  onReject: () => void;
  onJump: () => void;
}> = ({ photo, isProcessing, onApprove, onReject, onJump }) => (
  <div className="flex gap-4">
    <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-slate-800 shadow-xl">
      <img
        src={photo.url}
        alt="Community submission"
        className="w-full h-full object-cover"
      />
    </div>
    <div className="flex-1 space-y-3">
      <div>
        <h4 className="text-sm font-black text-white uppercase italic">
          Community Photo
        </h4>
        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
          <span className="flex items-center gap-1">
            <Camera className="w-3 h-3" /> Photo Gallery
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-blue-400 italic">PHOTO APPROVAL</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onReject}
          disabled={isProcessing}
          className="px-3 py-1.5 rounded text-[10px] font-black text-red-500 uppercase bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 font-black"
        >
          Reject
        </button>
        <button
          onClick={onApprove}
          disabled={isProcessing}
          className="bg-primary text-black px-4 py-1.5 rounded text-[10px] font-black uppercase hover:bg-primary/90 shadow-lg shadow-primary/5"
        >
          Approve
        </button>
        <button
          onClick={onJump}
          className="ml-auto p-1.5 text-slate-500 hover:text-white transition-colors"
          title="Manage in Marketing"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);

const SystemAlertCard: React.FC<{
  alert: { message: string; severity: "error" | "warning" };
  notificationId: string;
  venueId: string;
  onJump: () => void;
}> = ({ alert, notificationId, venueId, onJump }) => {
  const [isResolving, setIsResolving] = useState(false);
  const { showToast } = useToast();

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      await VenueOpsService.resolveNotification(venueId, notificationId);
      showToast("Alert cleared.", "success");
    } catch (e) {
      showToast("Failed to clear alert.", "error");
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="flex items-start gap-4">
      <div
        className={`p-2.5 rounded-xl shrink-0 border ${alert.severity === "error" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}`}
      >
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-white uppercase italic">
            System Alert
          </h4>
          <span
            className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${alert.severity === "error" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}`}
          >
            {alert.severity}
          </span>
        </div>
        <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1.5 pr-4">
          {alert.message}
        </p>
        <div className="flex gap-4 mt-4">
          <button
            onClick={onJump}
            className="flex items-center gap-1.5 text-[9px] font-black text-primary uppercase tracking-widest hover:text-primary/80"
          >
            Review Logs <ExternalLink className="w-3 h-3" />
          </button>
          <button
            onClick={handleResolve}
            disabled={isResolving}
            className="ml-auto text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white"
          >
            {isResolving ? "Clearing..." : "Clear Alert"}
          </button>
        </div>
      </div>
    </div>
  );
};

const SecurityAlertCard: React.FC<{
  alert: { message: string; severity?: string };
  onDismiss: () => void;
}> = ({ alert, onDismiss }) => (
  <div className="flex items-start gap-4 animate-in shake duration-500">
    <div className="bg-red-600/20 text-red-500 p-2.5 rounded-xl shrink-0 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
      <AlertCircle className="w-5 h-5" />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-black text-white uppercase italic">
          Security Alert
        </h4>
        <span className="text-[8px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 animate-pulse">
          CRITICAL
        </span>
      </div>
      <p className="text-xs text-slate-300 font-bold leading-relaxed mt-1.5">
        {alert.message}
      </p>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => (window.location.href = "tel:911")}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-500 active:scale-95 transition-all"
        >
          Emergency Call
        </button>
        <button
          onClick={onDismiss}
          className="px-4 py-2 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white"
        >
          Dismiss
        </button>
      </div>
    </div>
  </div>
);

const GuestEventApprovalCard: React.FC<{
  event: any;
  isProcessing: boolean;
  onApprove: () => void;
  onReject: () => void;
}> = ({ event, isProcessing, onApprove, onReject }) => (
  <div className="space-y-4">
    <div className="flex items-start justify-between">
      <div className="flex gap-4">
        <div className="bg-purple-900/40 p-2 rounded text-center min-w-[50px] border border-purple-500/20">
          <span className="block text-[10px] font-black text-purple-400 uppercase tracking-widest mb-0.5">
            {event.date ? format(parseISO(event.date), "MMM") : "???"}
          </span>
          <span className="block text-xl font-black text-white leading-none">
            {event.date ? format(parseISO(event.date), "dd") : "??"}
          </span>
        </div>
        <div>
          <h4 className="text-lg font-black text-white uppercase italic tracking-tight">
            {event.title}
          </h4>
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {event.time}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-purple-400 italic font-black">
              GUEST SUBMISSION
            </span>
          </div>
        </div>
      </div>
      <div className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded-full border border-purple-500/20 flex items-center gap-1 animate-pulse">
        <Sparkles className="w-3 h-3" />
        <span className="text-[8px] font-black uppercase tracking-widest">
          Needs Review
        </span>
      </div>
    </div>

    <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5">
      <p className="text-xs text-slate-400 leading-relaxed font-medium">
        {event.description || "No description provided."}
      </p>
      {event.submittedBy && (
        <div className="mt-2 text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
          <Check className="w-3 h-3" /> Submitted by {event.submittedBy}
        </div>
      )}
    </div>

    <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
      <button
        onClick={onReject}
        disabled={isProcessing}
        className="px-3 py-1.5 rounded text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500/10 flex items-center gap-1 border border-transparent hover:border-red-500/20"
      >
        <X className="w-3 h-3 stroke-[3]" /> Reject
      </button>
      <button
        onClick={onApprove}
        disabled={isProcessing}
        className="bg-primary text-black px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 flex items-center gap-1 shadow-lg shadow-primary/10"
      >
        <Check className="w-3 h-3 stroke-[3]" /> Approve & Publish
      </button>
    </div>
  </div>
);

const HolidayCard: React.FC<{
  notification: any;
  onDraftPost: () => void;
  onCreateEvent: () => void;
}> = ({ notification, onDraftPost, onCreateEvent }) => (
  <div className="flex items-start gap-4 animate-in slide-in-from-right-4 duration-500">
    <div className="bg-purple-500/20 text-purple-400 p-2.5 rounded-xl shrink-0 border border-purple-500/10">
      <Calendar className="w-5 h-5" />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-black text-white uppercase italic">
          {notification.title}
        </h4>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
          <Sparkles className="w-2.5 h-2.5 text-purple-400" />
          <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">
            UPCOMING
          </span>
        </div>
      </div>
      <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1.5 pr-4">
        {notification.message}
      </p>

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={onDraftPost}
          className="flex items-center gap-2 text-[9px] font-black text-black bg-primary px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/10"
        >
          <Edit2 className="w-3 h-3" /> Draft Post
        </button>
        <button
          onClick={onCreateEvent}
          className="flex items-center gap-2 text-[9px] font-black text-white bg-white/10 px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95 border border-white/5"
        >
          <Calendar className="w-3 h-3" /> Create Event
        </button>
        <div className="ml-auto text-[9px] text-slate-600 font-bold uppercase tracking-widest italic py-1.5 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {(notification.action_context as any)?.eventDate
            ? format(
                new Date((notification.action_context as any).eventDate),
                "MMM d",
              )
            : "Soon"}
        </div>
      </div>
    </div>
  </div>
);

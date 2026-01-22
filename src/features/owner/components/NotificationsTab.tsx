import React, { useEffect, useState } from 'react';
import { db, functions } from '../../../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { LeagueEvent } from '../../../types';
import { format, parseISO } from 'date-fns';
import { Check, X, Bell, AlertCircle, Edit2, RotateCcw, Calendar, Clock, Sparkles } from 'lucide-react';
import { useToast } from '../../../components/ui/BrandedToast';

interface NotificationsTabProps {
  venueId: string;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({ venueId }) => {
  const [pendingEvents, setPendingEvents] = useState<LeagueEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; description: string }>({ title: '', description: '' });
  const { showToast } = useToast();

  // AI Function
  const rewriteDescription = httpsCallable(functions, 'rewriteEventDescription');

  useEffect(() => {
    fetchPendingEvents();
  }, [venueId]);

  const fetchPendingEvents = async () => {
    setIsLoading(true);
    try {
      // Firestore composite index required: venueId ASC, status ASC, date ASC
      // If missing, it will error in console with link to create.
      const q = query(
        collection(db, 'league_events'),
        where('venueId', '==', venueId),
        where('status', '==', 'PENDING'),
        orderBy('date', 'asc')
      );
      const snap = await getDocs(q);
      const events = snap.docs.map(d => ({ id: d.id, ...d.data() } as LeagueEvent));
      setPendingEvents(events);
    } catch (error) {
      console.error("Failed to fetch pending events:", error);
      // Fallback if index missing (client-side filter)
      // Not ideal for scale but safe for now
      try {
        const qLimit = query(
          collection(db, 'league_events'),
          where('venueId', '==', venueId),
          where('status', '==', 'PENDING')
        );
        const snapLimit = await getDocs(qLimit);
        const allPending = snapLimit.docs.map(d => ({ id: d.id, ...d.data() } as LeagueEvent));
        setPendingEvents(allPending.sort((a, b) => a.date.localeCompare(b.date)));
      } catch (e) {
        showToast("Failed to load review queue.", 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (event: LeagueEvent) => {
    if (!event.id) return;
    setProcessingId(event.id);
    try {
      await updateDoc(doc(db, 'league_events', event.id), {
        status: 'APPROVED'
      });
      setPendingEvents(prev => prev.filter(e => e.id !== event.id));
      showToast("Event approved and live!", 'success');
    } catch (e) {
      showToast("Failed to approve.", 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (event: LeagueEvent) => {
    if (!event.id) return;
    setProcessingId(event.id);
    try {
      await updateDoc(doc(db, 'league_events', event.id), {
        status: 'REJECTED'
      });
      setPendingEvents(prev => prev.filter(e => e.id !== event.id));
      showToast("Event rejected.", 'success');
    } catch (e) {
      showToast("Failed to reject.", 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveEdit = async (eventId: string) => {
    setProcessingId(eventId);
    try {
      await updateDoc(doc(db, 'league_events', eventId), {
        title: editForm.title,
        description: editForm.description,
        status: 'APPROVED' // Auto-approve on save? Maybe just save changes. Let's Auto-Approve for better flow.
      });
      setPendingEvents(prev => prev.filter(e => e.id !== eventId));
      setEditingId(null);
      showToast("Changes saved and approved!", 'success');
    } catch (e) {
      showToast("Failed to save.", 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSpark = async (eventId: string, currentText: string) => {
    setProcessingId(eventId); // Lock UI
    try {
      const result = await rewriteDescription({ text: currentText, tone: 'inviting' });
      const data = result.data as any;
      if (data?.text) {
        setEditForm(prev => ({ ...prev, description: data.text }));
        showToast("Sparked new description!", 'success');
      }
    } catch (e) {
      console.error(e);
      showToast("AI Spark failed.", 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1 flex items-center gap-2 italic">
              <Bell className="w-5 h-5 text-red-500" />
              Notifications
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              {pendingEvents.length} items needing attention
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pendingEvents.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-xl">
            <Check className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h4 className="text-sm font-black text-white uppercase tracking-widest">All Caught Up!</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">No pending items to review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingEvents.map(ev => {
              const isEditing = editingId === ev.id;
              const isProcessing = processingId === ev.id;

              return (
                <div key={ev.id} className="bg-black/40 border border-white/10 rounded-xl p-4 group hover:border-white/20 transition-colors">
                  {/* Header Info */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-4">
                      <div className="bg-slate-800 p-2 rounded text-center min-w-[50px]">
                        <span className="block text-[10px] font-black text-red-400 uppercase tracking-widest">
                          {ev.date ? format(parseISO(ev.date), 'MMM') : '???'}
                        </span>
                        <span className="block text-xl font-black text-white leading-none">
                          {ev.date ? format(parseISO(ev.date), 'dd') : '??'}
                        </span>
                      </div>
                      <div>
                        {isEditing ? (
                          <input
                            value={editForm.title}
                            onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                            className="bg-black border border-white/20 rounded px-2 py-1 text-white font-black uppercase text-sm w-full mb-1"
                          />
                        ) : (
                          <h4 className="text-lg font-black text-white uppercase italic">{ev.title}</h4>
                        )}

                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {ev.time}
                          </span>
                          <span className="text-slate-600">|</span>
                          <span className="text-primary">{ev.type}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4 bg-slate-900/50 p-3 rounded-lg border border-white/5 relative">
                    {isEditing ? (
                      <div className="relative">
                        <textarea
                          value={editForm.description}
                          onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full bg-transparent text-xs text-slate-300 outline-none resize-none placeholder:text-slate-600 font-medium leading-relaxed"
                          placeholder="Enter event description..."
                        />
                        <button
                          onClick={() => handleSpark(ev.id!, editForm.description)}
                          disabled={isProcessing}
                          className="absolute bottom-[-30px] left-0 text-[9px] font-black text-yellow-400 uppercase tracking-widest hover:text-yellow-300 flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20"
                        >
                          <Sparkles className="w-3 h-3" />
                          {isProcessing ? 'Sparking...' : 'AI Remix'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {ev.description || "No description provided."}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 rounded text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(ev.id!)}
                          disabled={isProcessing}
                          className="bg-green-500 text-black px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:bg-green-400 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Save & Approve
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(ev.id!);
                            setEditForm({ title: ev.title, description: ev.description || '' });
                          }}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white bg-white/5 hover:bg-white/10 flex items-center gap-1 border border-white/5 mr-auto"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>

                        <button
                          onClick={() => handleReject(ev)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500/10 flex items-center gap-1 border border-transparent hover:border-red-500/20"
                        >
                          <X className="w-3 h-3 stroke-[3]" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(ev)}
                          disabled={isProcessing}
                          className="bg-primary text-black px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 flex items-center gap-1 shadow-lg shadow-primary/10"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          Approve
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

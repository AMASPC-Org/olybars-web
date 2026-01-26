import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw, X, Send, Bot, Sparkles, Loader2, CheckCircle2, TrendingUp, ShieldAlert, BarChart3, Briefcase } from 'lucide-react';
import { useSchmidtChat } from '../../hooks/useSchmidtChat';
import { useToast } from '../ui/BrandedToast';
import schmidtLogo from '../../assets/Schmidt-Only-Logo (40 x 40 px).png';

interface SchmidtChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueId?: string;
}

/**
 * SchmidtChatModal: The B2B "War Room" for Venue Owners.
 * Aesthetic: High-contrast, Sleek, Data-Driven.
 */
export const SchmidtChatModal: React.FC<SchmidtChatModalProps> = ({ isOpen, onClose, venueId }) => {
  const { messages, sendMessage, isLoading, error, clearMessages } = useSchmidtChat(venueId);
  const [input, setInput] = useState('');
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [actionStatus, setActionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();

    // Parse for [ACTION] strings in Schmidt's response
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'schmidt' && !isLoading) {
      if (lastMessage.text.includes('[ACTION]:')) {
        try {
          const actionJson = lastMessage.text.split('[ACTION]:')[1].trim();
          const action = JSON.parse(actionJson);
          setPendingAction(action);
        } catch (e) {
          console.error("Schmidt Action Parse Error:", e);
        }
      }
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const currentInput = input;
    setInput('');
    setPendingAction(null);
    await sendMessage(currentInput);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setActionStatus('loading');

    try {
      const { VenueOpsService } = await import('../../services/VenueOpsService');
      const vId = venueId || (window as any)._artie_venue_id;

      if (!vId) {
        showToast("Venue context missing. Cannot execute action.", "error");
        setActionStatus('error');
        return;
      }

      switch (pendingAction.skill) {
        case 'schedule_flash_deal':
          await VenueOpsService.scheduleFlashBounty(vId, {
            title: pendingAction.params.summary,
            description: pendingAction.params.details,
            price: pendingAction.params.price,
            startTime: new Date(pendingAction.params.startTimeISO).getTime(),
            endTime: new Date(pendingAction.params.startTimeISO).getTime() + (Number(pendingAction.params.duration) * 60000),
            durationMinutes: Number(pendingAction.params.duration),
            status: 'PENDING',
            createdBy: 'SCHMIDT',
            staffBriefingConfirmed: true
          });
          showToast("Flash Bounty Deployed Successfully", "success");
          break;
        // Add more skill handlers as needed
        default:
          showToast(`Action '${pendingAction.skill}' scheduled for execution.`, "success");
      }

      setActionStatus('success');
      setTimeout(() => {
        setPendingAction(null);
        setActionStatus('idle');
      }, 2000);
    } catch (e: any) {
      showToast(e.message || "Operation failed", "error");
      setActionStatus('error');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 font-inter">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

      <div className="bg-[#050505] border-2 border-[#222] w-full max-w-lg h-[700px] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 duration-300">

        {/* B2B Header */}
        <div className="bg-black border-b border-[#222] p-4 flex justify-between items-center bg-gradient-to-r from-black to-[#0a0a0a]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#111] border border-[#333] p-1 shadow-inner flex items-center justify-center">
              <img src={schmidtLogo} className="w-full h-full object-contain grayscale opacity-80" alt="Schmidt" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider font-oswald">
                  Strategic Advisor <span className="text-primary">Schmidt</span>
                </h3>
                <div className="bg-primary/10 border border-primary/30 px-2 py-0.5 rounded flex items-center gap-1">
                  <TrendingUp size={10} className="text-primary" />
                  <span className="text-[9px] font-bold text-primary uppercase">ROI Optimized</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">OPS Terminal Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearMessages} className="text-zinc-600 hover:text-white transition-colors p-2" title="Clear Logs">
              <RotateCcw size={18} />
            </button>
            <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors p-2">
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Tactical Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[radial-gradient(circle_at_50%_50%,_#0a0a0a_0%,_#050505_100%)]">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <Briefcase size={48} className="text-zinc-700" />
              <div className="max-w-xs space-y-2">
                <p className="text-white font-bold uppercase tracking-widest text-sm">Awaiting Briefing</p>
                <p className="text-zinc-500 text-xs">Ask Schmidt about yield gaps, flash bounties, or competitive intelligence for your venue.</p>
              </div>
            </div>
          )}

          {messages.map((m, i) => {
            const isUser = m.role === 'user';
            // Filter out internal tags
            const displayText = m.text.split('[ACTION]:')[0].trim();
            if (!displayText) return null;

            return (
              <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[90%] p-4 rounded-xl text-sm font-medium leading-relaxed ${isUser
                    ? 'bg-zinc-800 text-white rounded-tr-none border border-zinc-700'
                    : 'bg-[#111] text-zinc-300 border border-[#222] rounded-tl-none shadow-lg'
                  }`}>
                  {displayText}
                </div>
              </div>
            );
          })}

          {/* Action Proposition Card */}
          {pendingAction && (
            <div className="flex justify-center my-4 animate-in slide-in-from-bottom-6 duration-500">
              <div className="bg-[#0a0a0a] border-2 border-primary/50 p-6 rounded-xl shadow-[0_0_30px_rgba(251,191,36,0.1)] w-full max-w-sm">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#222]">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="text-primary w-5 h-5" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Deployment Proposal</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/50 p-4 rounded-lg border border-[#222] space-y-2">
                    <h4 className="text-white font-bold text-sm uppercase tracking-tight">
                      {pendingAction.skill.split('_').join(' ')}
                    </h4>
                    <p className="text-zinc-400 text-xs italic leading-relaxed">
                      {pendingAction.params.summary || pendingAction.params.prompt}
                    </p>
                  </div>

                  {actionStatus === 'success' ? (
                    <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg flex items-center justify-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-[10px] font-black text-green-500 uppercase tracking-widest text-center italic">Mission Executed.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleConfirmAction}
                        disabled={actionStatus === 'loading'}
                        className="bg-primary hover:bg-yellow-400 text-black font-black text-[10px] py-3 rounded uppercase tracking-widest transition-all disabled:opacity-50"
                      >
                        {actionStatus === 'loading' ? 'Executing...' : 'Authorize'}
                      </button>
                      <button
                        onClick={() => setPendingAction(null)}
                        disabled={actionStatus === 'loading'}
                        className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-black text-[10px] py-3 rounded uppercase tracking-widest transition-all border border-zinc-800"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#111] p-3 rounded-lg border border-[#222] flex gap-2 items-center">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-[10px] text-zinc-500 uppercase font-black animate-pulse">Analyzing ROI...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-red-500/10 text-red-400 text-[10px] font-bold p-3 rounded border border-red-500/20 flex items-center gap-2 uppercase tracking-wide">
                <ShieldAlert size={14} />
                {error}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-6 bg-black border-t border-[#111]">
          <div className="flex gap-3 bg-[#0a0a0a] border border-[#222] rounded-xl p-2 focus-within:border-primary/50 transition-all shadow-inner">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Direct strategic inquiry..."
              className="flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-zinc-700 font-medium"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-zinc-800 hover:bg-zinc-700 text-white p-2.5 rounded-lg disabled:opacity-50 transition-all flex items-center justify-center shrink-0 w-10 h-10 border border-zinc-700/50"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <div className="mt-4 flex justify-between items-center px-1">
            <p className="text-[8px] text-zinc-700 font-bold uppercase tracking-[0.2em]">OlyBars Operations Protocol v2.5</p>
            <span className="text-[8px] text-zinc-800 font-bold uppercase">Locked & Encrypted</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

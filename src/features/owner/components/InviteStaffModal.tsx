import React, { useState } from "react";
import {
  X,
  Mail,
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  Shield,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { db } from "../../../lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { VenueRole } from "../../../types/auth_schema";
import { VenueInvite } from "../../../types/venue";

interface InviteStaffModalProps {
  venueId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
}

export const InviteStaffModal: React.FC<InviteStaffModalProps> = ({
  venueId,
  isOpen,
  onClose,
  currentUserEmail,
}) => {
  const [step, setStep] = useState<"form" | "success">("form");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<VenueRole>("staff");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateToken = () => {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = generateToken();
      const expiresAt = Timestamp.fromMillis(Date.now() + 48 * 60 * 60 * 1000); // 48h

      const inviteData: Omit<VenueInvite, "id"> = {
        token,
        email,
        role: role as "manager" | "staff",
        status: "pending",
        expiresAt,
        createdAt: serverTimestamp(),
        createdBy: currentUserEmail,
      };

      const docRef = await addDoc(
        collection(db, "venues", venueId, "invites"),
        inviteData,
      );

      // Generate Link
      const link = `https://olybars.com/admin/join?token=${token}&v=${venueId}`;
      setInviteLink(link);
      setStep("success");
    } catch (err: any) {
      console.error("Error creating invite:", err);
      setError(err.message || "Failed to create invite");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setStep("form");
    setEmail("");
    setRole("staff");
    setInviteLink("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Invite Team Member
          </h3>
          <button
            onClick={handleClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === "form" ? (
          <form onSubmit={handleCreateInvite} className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                  Role Access
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("staff")}
                    className={`p-3 rounded-xl border text-left transition-all ${role === "staff" ? "bg-primary/10 border-primary shadow-[0_0_15px_-3px_rgba(251,191,36,0.2)]" : "bg-slate-800 border-white/5 hover:border-white/10"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-2 h-2 rounded-full ${role === "staff" ? "bg-primary" : "bg-slate-600"}`}
                      />
                      <span
                        className={`text-xs font-bold ${role === "staff" ? "text-white" : "text-slate-400"}`}
                      >
                        Staff
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Can manage orders, vibe checks, and standard operations.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("manager")}
                    className={`p-3 rounded-xl border text-left transition-all ${role === "manager" ? "bg-primary/10 border-primary shadow-[0_0_15px_-3px_rgba(251,191,36,0.2)]" : "bg-slate-800 border-white/5 hover:border-white/10"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Shield
                        className={`w-3 h-3 ${role === "manager" ? "text-primary" : "text-slate-600"}`}
                      />
                      <span
                        className={`text-xs font-bold ${role === "manager" ? "text-white" : "text-slate-400"}`}
                      >
                        Manager
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Full access to settings, reports, and team management.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-primary hover:bg-primary-hover disabled:bg-slate-800 disabled:text-slate-500 text-black font-black uppercase tracking-widest text-xs py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Invite...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4" />
                    Generate Invite Link
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 text-center space-y-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2 animate-in zoom-in duration-300">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>

            <div>
              <h4 className="text-white font-bold text-lg mb-1">
                Invite Generated!
              </h4>
              <p className="text-slate-400 text-xs">
                Share this secure link with your team member.
              </p>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-1 flex items-center gap-2">
              <code className="flex-1 text-[10px] text-slate-300 font-mono px-3 truncate">
                {inviteLink}
              </code>
              <button
                onClick={copyToClipboard}
                className={`p-2 rounded-lg transition-all ${copied ? "bg-green-500/20 text-green-500" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-xl text-left border border-white/5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">
                  Expires In
                </span>
                <span className="text-[10px] text-amber-500 font-mono">
                  47h 59m
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="w-full h-full bg-amber-500" />
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-widest text-xs py-3 rounded-xl transition-all"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

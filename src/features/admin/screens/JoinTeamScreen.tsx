import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Shield,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  validateInvite,
  acceptInvite,
  fetchVenueById,
} from "../../../services/venueService"; // Updated import path
import { UserProfile, Venue, VenueInvite } from "../../../types";
import { useToast } from "../../../components/ui/BrandedToast";

interface JoinTeamScreenProps {
  userProfile: UserProfile;
}

export const JoinTeamScreen: React.FC<JoinTeamScreenProps> = ({
  userProfile,
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const token = searchParams.get("token");
  const venueId = searchParams.get("v");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<VenueInvite | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (!token || !venueId) {
      setError("Invalid invite link. Missing token or venue ID.");
      setIsLoading(false);
      return;
    }

    verifyInvite();
  }, [token, venueId]);

  const verifyInvite = async () => {
    try {
      // 1. Fetch Venue Details First (for UI)
      const venueData = await fetchVenueById(venueId!);
      if (!venueData) throw new Error("Venue not found.");
      setVenue(venueData);

      // 2. Validate Token
      const inviteData = await validateInvite(venueId!, token!);
      setInvite(inviteData);
    } catch (err: any) {
      console.error("Verification failed", err);
      setError(err.message || "Invite is invalid or expired.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invite || !venue || userProfile.uid === "guest") return;

    setIsAccepting(true);
    try {
      await acceptInvite(venue.id, invite.id, userProfile.uid, invite.role);
      showToast(`Welcome to the ${venue.name} team!`, "success");

      // Redirect to Admin Dashboard
      setTimeout(() => {
        navigate(`/admin/brewhouse/${venue.id}`);
        // Force reload to refresh permissions if needed, or rely on App.tsx hydration
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error("Accept failed", err);
      showToast("Failed to accept invite. Please try again.", "error");
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider mb-2">
            Invite Error
          </h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambient */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

      <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full relative z-10 shadow-2xl">
        {/* Logo/Icon */}
        <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_-5px_rgba(251,191,36,0.3)] border border-primary/20">
          <Shield className="w-10 h-10 text-primary" />
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">
            Join the Team
          </h1>
          <p className="text-slate-400 text-sm">
            You have been invited to join the staff at
          </p>
          <div className="mt-4 p-4 bg-black/40 border border-white/5 rounded-xl">
            <div className="text-lg font-bold text-white mb-1">
              {venue?.name}
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
              Role: {invite?.role}
            </div>
          </div>
        </div>

        {/* Validations */}
        {userProfile.uid === "guest" ? (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
            <p className="text-amber-500 text-xs font-bold text-center mb-3">
              You must be logged in to accept this invite.
            </p>
            <button
              onClick={() => navigate("/auth?mode=login")}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-xs py-3 rounded-xl transition-all"
            >
              Login / Sign Up
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div className="text-xs font-medium">
                Logged in as{" "}
                <span className="font-bold text-white">
                  {userProfile.email}
                </span>
              </div>
            </div>

            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full bg-primary hover:bg-primary-hover disabled:bg-slate-700 disabled:text-slate-500 text-black font-black uppercase tracking-widest text-sm py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Accept Invite
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-[10px] text-slate-500 text-center">
              By accepting, you agree to the OlyBars Venue Operator terms.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

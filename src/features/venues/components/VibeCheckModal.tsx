import React, { useState, useRef } from "react";
import {
  X,
  Camera,
  Loader2,
  Sparkles,
  Flame,
  MapPin,
  Gamepad2,
  Zap,
  AlertTriangle,
  ShieldCheck,
  Lock,
  Droplets,
  Waves,
} from "lucide-react";
import { Venue, VenueStatus, GameStatus } from "../../../types";
import { getGameTTL } from "../../../config/gameConfig";
import { GAMIFICATION_CONFIG } from "../../../config/gamification";
import { FormatCurrency } from "../../../utils/formatCurrency";
import { useBouncer, AdmissionStatus } from "../../../hooks/useBouncer";
import { useUser } from "../../../contexts";

interface VibeCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  venue: Venue;
  onConfirm: (
    venue: Venue,
    status: VenueStatus,
    hasConsent: boolean,
    photoUrl?: string,
    verificationMethod?: "gps" | "qr",
    gameStatus?: Record<string, GameStatus>,
    soberCheck?: { isGood: boolean; reason?: string },
  ) => void;
  clockedIn?: boolean;
  onClockInPrompt?: () => void;
  verificationMethod?: "gps" | "qr";
  onLogin?: (mode: "login" | "signup") => void;
}

export const VibeCheckModal: React.FC<VibeCheckModalProps> = ({
  isOpen,
  onClose,
  venue,
  onConfirm,
  clockedIn,
  onClockInPrompt,
  verificationMethod = "gps",
  onLogin,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<VenueStatus>(
    venue.status || "flowing",
  );
  // ... (rest of simple state)
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allowMarketingUse, setAllowMarketingUse] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shadowVariant, setShadowVariant] = useState<
    "success" | "locked" | null
  >(null);
  const [vibeResult, setVibeResult] = useState<{
    total?: number;
    bountyPending?: boolean;
  } | null>(null);

  // Initialize with existing status or empty
  const [gameStatus, setGameStatus] = useState<Record<string, GameStatus>>(
    venue.liveGameStatus || {},
  );

  // [SOBER FRIENDLY] State
  const [soberCheck, setSoberCheck] = useState<{
    isGood: boolean;
    reason?: string;
  } | null>(null);
  const [showSoberReason, setShowSoberReason] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { userProfile } = useUser();

  // --- BOUNCER INTEGRATION ---
  const {
    canClockIn, // Vibe Check shares logic with ClockIn for location/cooldown often
    admissionStatus,
    estimatePoints,
    location
  } = useBouncer(userProfile, venue);

  const { coords, loading: geoLoading, refresh } = location;

  // Derived User State (Legacy logic preserved via AdmissionStatus)
  const isAnonymous = admissionStatus === AdmissionStatus.SHADOW_MODE;

  // Location Verification (Independent of Cooldowns)
  // We consider location valid if we are NOT locked by distance.
  // LOCKED_COOLDOWN implies we are close enough but timed out, which is fine for Vibe Check.
  const isLocationVerified = canClockIn?.status !== AdmissionStatus.LOCKED_DISTANCE &&
    canClockIn?.status !== AdmissionStatus.SYSTEM_ERROR &&
    canClockIn?.metadata?.distance !== undefined;

  const distance = canClockIn?.metadata?.distance;

  // For Sober Check / UI logic that requires strictly "Allowed" status
  const isAllowed =
    canClockIn?.status === AdmissionStatus.ALLOWED ||
    canClockIn?.status === AdmissionStatus.SHADOW_MODE;

  if (!isOpen) return null;

  const startCamera = async () => {
    setCameraError(false);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access denied", err);
      setCameraError(true);
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL("image/jpeg");
        setCapturedPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const handleConfirm = async () => {
    // [BOUNCER VALIDATION]
    // Vibe Check also requires proximity.
    // We reuse canClockIn status for proximity check since it's the same radius.
    // If we want a separate 'canVibeCheck' in the future, we can add it to Bouncer.
    if (!canClockIn || canClockIn.status === AdmissionStatus.LOCKED_DISTANCE) {
      setErrorMessage(
        "Coordinate Verification Failed. You must be at the venue to submit a vibe.",
      );
      return;
    }

    // Cooldown check?
    // Bouncer Service handles Clock In cooldowns.
    // Vibe Checks have separate cooldowns (handled in App.tsx handleVibeCheck usually BEFORE modal opens).
    // If the modal is open, we assume cooldown was checked?
    // No, App.tsx checks it before setting showVibeCheckModal.
    // So we assume if we are here, cooldown is OK.

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await onConfirm(
        venue,
        selectedStatus,
        allowMarketingUse,
        capturedPhoto || undefined,
        verificationMethod,
        Object.keys(gameStatus).length > 0 ? gameStatus : undefined,
        soberCheck || undefined,
      );

      setVibeResult({
        total:
          (result as any)?.pointsAwarded ||
          estimatePoints('vibe') + (capturedPhoto ? estimatePoints('photo') : 0) + (allowMarketingUse ? 15 : 0),
        bountyPending: (result as any)?.bountyPending,
      });

      // If success (200), check mode
      if (admissionStatus === AdmissionStatus.SHADOW_MODE) {
        setShadowVariant("success");
      } else {
        setIsSuccess(true);
      }

      if (clockedIn) {
        setTimeout(onClose, 2000);
      }
    } catch (err: any) {
      // Honest Gate: Handle Auth Errors (401/403)
      // Vibe Check usually executes logic in App.tsx which mimics 'performClockIn'-like calls.
      if (admissionStatus === AdmissionStatus.SHADOW_MODE && (err.status === 401 || err.status === 403)) {
        setShadowVariant("locked");
      } else {
        setErrorMessage(err.message || "Failed to submit vibe.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const vibeOptions: {
    status: VenueStatus;
    label: string;
    icon: any;
    color: string;
    desc: string;
  }[] = [
      {
        status: "trickle",
        label: "Trickle",
        icon: Droplets,
        color: "text-emerald-400",
        desc: "Low flow, easy access.",
      },
      {
        status: "flowing",
        label: "Flowing",
        icon: Waves,
        color: "text-blue-400",
        desc: "Steady stream, good vibes.",
      },
      {
        status: "gushing",
        label: "Gushing",
        icon: Flame,
        color: "text-orange-500",
        desc: "High pressure, active energy!",
      },
      {
        status: "flooded",
        label: "Flooded",
        icon: Zap,
        color: "text-red-500",
        desc: "Max depth, wall to wall.",
      },
    ];

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-surface w-full max-w-sm rounded-2xl border-2 border-primary shadow-[0_0_50px_-12px_rgba(251,191,36,0.5)] overflow-hidden text-center p-8 space-y-6">
          <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto animate-bounce border-2 border-cyan-500">
            <Droplets className="w-10 h-10 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter font-league italic">
              Flow Reported!
            </h2>
            {!isAnonymous ? (
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-cyan-400 font-black uppercase tracking-widest text-xs">
                  Data Signal Reward:
                </span>
                <FormatCurrency amount={vibeResult?.total || 10} />
              </div>
            ) : (
              <p className="text-cyan-400 font-black uppercase tracking-widest text-xs mt-1">
                DROPS PENDING CLAIM
              </p>
            )}
            {!isAnonymous && (
              <p className="text-white font-black uppercase tracking-widest text-[10px] mt-2 opacity-60">
                Total Flow: {vibeResult?.total}{" "}
                {GAMIFICATION_CONFIG.CURRENCY.UNIT}
              </p>
            )}
          </div>

          {!clockedIn && onClockInPrompt ? (
            <div className="bg-slate-900/80 p-4 rounded-xl border border-white/5 space-y-4">
              <p className="text-slate-300 text-sm font-bold leading-tight">
                Nice vibe! Since you're here, want to{" "}
                <span className="text-primary italic">Clock In</span> for +{estimatePoints('clockin')}
                more points?
              </p>
              <button
                onClick={onClockInPrompt}
                className="w-full bg-white text-black font-black py-3 rounded-lg uppercase tracking-wider font-league hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <MapPin className="w-5 h-5" /> Clock In Now
              </button>
              <button
                onClick={onClose}
                className="text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-white"
              >
                Maybe Later
              </button>
            </div>
          ) : isAnonymous && onLogin ? (
            <div className="bg-primary/10 rounded-xl p-4 border border-primary/20 space-y-3">
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
                Claim Your Rewards
              </p>
              <button
                onClick={() => onLogin("signup")}
                className="w-full bg-primary text-black font-black py-3 rounded-lg uppercase tracking-wider font-league hover:scale-105 transition-transform"
              >
                Join League to Save
              </button>
              <button
                onClick={onClose}
                className="text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-white"
              >
                Close & Lose Points
              </button>
            </div>
          ) : (
            <p className="text-slate-400 text-xs font-medium italic">
              Redirecting to status hub...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (shadowVariant) {
    const isLocked = shadowVariant === "locked";

    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-surface w-full max-w-sm rounded-2xl border-2 border-primary shadow-[0_0_50px_-12px_rgba(251,191,36,0.5)] overflow-hidden text-center p-8 space-y-6">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${isLocked ? "bg-slate-800 border-2 border-primary/30" : "bg-primary animate-bounce"}`}
          >
            {isLocked ? (
              <Lock className="w-8 h-8 text-primary" />
            ) : (
              <Sparkles className="w-10 h-10 text-black" />
            )}
          </div>

          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter font-league italic">
              {isLocked ? "Signal Ready" : "Pulse Updated"}
            </h2>
            <div className="mt-4 space-y-3">
              <p className="text-sm text-slate-300 font-medium leading-relaxed">
                {isLocked ? (
                  <>
                    Guest signals are currently limited. Create a League Profile
                    to{" "}
                    <span className="text-white font-bold">
                      publish this Vibe Check
                    </span>{" "}
                    and earn your first <FormatCurrency amount={5} hideSign />.
                  </>
                ) : isAnonymous ? (
                  <>
                    Thanks for the intel! that Vibe Check was worth{" "}
                    <FormatCurrency amount={5} hideSign />. You are in Guest
                    Mode, so you didn't bank them.
                  </>
                ) : (
                  <>
                    Vibe Verified! You generated{" "}
                    <FormatCurrency amount={5} hideSign />.
                  </>
                )}
              </p>
              {!isLocked && (
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight bg-slate-900 px-3 py-2 rounded-lg border border-white/5">
                  {isAnonymous ? (
                    <>
                      Join the League to{" "}
                      <span className="text-cyan-400">claim these drops</span>,
                      or they drain away at midnight.
                    </>
                  ) : (
                    <>
                      Activate League Membership to{" "}
                      <span className="text-cyan-400">seal your reservoir</span>{" "}
                      permanently.
                    </>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onLogin?.("signup")}
              className="w-full bg-primary text-black font-black py-4 rounded-xl uppercase tracking-wider font-league hover:scale-105 transition-transform shadow-lg shadow-primary/20"
            >
              {isLocked
                ? "Create Profile & Publish"
                : isAnonymous
                  ? "Join League to Bank Points"
                  : "Activate League Membership"}
            </button>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-3 italic">
              {isLocked ? "It takes 30 seconds." : "Don't miss out next time."}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
          >
            Close & Continue as Guest
          </button>
        </div>
      </div>
    );
  }

  // --- UI RENDER HELPERS ---

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
      <div className="bg-surface w-full max-w-sm overflow-hidden rounded-xl border border-slate-700 shadow-lg relative">
        {showCamera && (
          <div className="absolute inset-0 z-[70] bg-black flex flex-col">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="flex-1 object-cover w-full"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="p-4 bg-black/50 flex justify-between items-center absolute bottom-0 w-full border-t border-primary/20">
              <button
                onClick={stopCamera}
                className="font-bold uppercase tracking-wider text-sm text-white"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                className="w-16 h-16 bg-white rounded-full border-4 border-primary shadow-xl active:scale-95 transition-transform"
              ></button>
              <div className="w-16"></div>
            </div>
          </div>
        )}

        <div className="bg-primary p-4 text-center border-b border-black/10 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-black/70 hover:text-black hover:scale-110 transition-transform"
          >
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-black uppercase tracking-wider font-league italic">
            Vibe Check
          </h2>
          <p className="text-black/60 text-[10px] font-black uppercase tracking-widest font-league leading-none">
            {venue.name}
          </p>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-center">
            {/* BOUNCER LOCATION STATUS */}
            <p
              className={`text-[10px] font-black uppercase tracking-widest ${isLocationVerified ? "text-primary" : distance !== undefined ? "text-red-400" : "text-slate-500"}`}
            >
              {geoLoading
                ? "Finding you..."
                : isLocationVerified
                  ? "?? Verified At Venue"
                  : distance !== undefined
                    ? `${Math.round(distance)}m FROM VENUE`
                    : "?? Location Check Required"}
            </p>
            {!isLocationVerified && !geoLoading && (
              <button
                onClick={refresh}
                className="mt-2 text-[10px] bg-primary/20 text-primary font-black px-3 py-1 rounded-full border border-primary/30 hover:bg-primary/30 transition-all uppercase tracking-widest"
              >
                {coords ? "Verify Again" : "Verify My Location"}
              </button>
            )}
          </div>

          {/* Vibe Selection */}
          <div className="grid grid-cols-1 gap-2">
            {vibeOptions.map((opt) => (
              <button
                key={opt.status}
                onClick={() => setSelectedStatus(opt.status)}
                className={`flex items-center gap-4 p-3 rounded-xl border-2 transition-all text-left ${selectedStatus === opt.status ? "bg-primary/10 border-primary" : "bg-slate-800/50 border-slate-700 hover:border-slate-500"}`}
              >
                <div className={`p-2 rounded-lg bg-black/40 ${opt.color}`}>
                  <opt.icon size={20} />
                </div>
                <div className="flex-1">
                  <p
                    className={`font-black uppercase tracking-wider font-league ${selectedStatus === opt.status ? "text-primary" : "text-slate-300"}`}
                  >
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">
                    {opt.desc}
                  </p>
                </div>
                {selectedStatus === opt.status && (
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Game Status Section (Premium) */}
        {venue.hasGameVibeCheckEnabled &&
          venue.gameFeatures &&
          venue.gameFeatures.length > 0 && (
            <div className="bg-slate-900/50 border border-white/5 rounded-xl p-3 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Gamepad2 className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Game Status (Live)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {venue.gameFeatures.map((feature) => {
                  const current = gameStatus[feature.id]?.status || "open";
                  const isBroken = current === "out_of_order";

                  return (
                    <div
                      key={feature.id}
                      className="bg-black/40 rounded-lg p-2 border border-white/5 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate flex-1">
                          {feature.name}
                        </span>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Report ${feature.name} as broken?`,
                              )
                            ) {
                              setGameStatus((prev) => ({
                                ...prev,
                                [feature.id]: {
                                  status: "out_of_order",
                                  timestamp: Date.now(),
                                  reportedBy: "user",
                                },
                              }));
                            }
                          }}
                          className="text-slate-600 hover:text-yellow-400 -mr-1"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      </div>

                      {isBroken ? (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase py-1 text-center rounded flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Needs Repair
                        </div>
                      ) : (
                        <div className="flex bg-slate-800 rounded-lg p-0.5">
                          <button
                            onClick={() =>
                              setGameStatus((prev) => ({
                                ...prev,
                                [feature.id]: {
                                  status: "open",
                                  timestamp: Date.now(),
                                  reportedBy: "user",
                                },
                              }))
                            }
                            className={`flex-1 py-1 text-[9px] font-black uppercase rounded-md transition-all ${current === "open" ? "bg-green-500 text-black shadow-sm" : "text-slate-500 hover:text-white"}`}
                          >
                            Open
                          </button>
                          <button
                            onClick={() => {
                              const ttl = getGameTTL(feature.id);
                              setGameStatus((prev) => ({
                                ...prev,
                                [feature.id]: {
                                  status: "taken",
                                  timestamp: Date.now(),
                                  reportedBy: "user",
                                  expiresAt: Date.now() + ttl * 60 * 1000,
                                },
                              }));
                            }}
                            className={`flex-1 py-1 text-[9px] font-black uppercase rounded-md transition-all ${current === "taken" ? "bg-red-500 text-white shadow-sm" : "text-slate-500 hover:text-white"}`}
                          >
                            Taken
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* Sober Friendly Feedback (GPS Verified Only) */}
        {venue.isSoberFriendly && isAllowed && (
          <div className="bg-blue-900/40 border border-blue-800 rounded-xl p-3 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-secondary" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                Sober Friendly Promise Kept?
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSoberCheck({ isGood: true });
                  setShowSoberReason(false);
                }}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${soberCheck?.isGood === true ? "bg-secondary text-black border-secondary" : "bg-black/40 text-slate-500 border-white/5"}`}
              >
                ?? Yes
              </button>
              <button
                onClick={() => {
                  setSoberCheck({ isGood: false, reason: "No Options" });
                  setShowSoberReason(true);
                }}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${soberCheck?.isGood === false ? "bg-red-500 text-white border-red-500" : "bg-black/40 text-slate-500 border-white/5"}`}
              >
                ?? No
              </button>
            </div>

            {showSoberReason && (
              <div className="animate-in slide-in-from-top duration-200">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 block">
                  What was missing?
                </label>
                <select
                  value={soberCheck?.reason}
                  onChange={(e) =>
                    setSoberCheck({ isGood: false, reason: e.target.value })
                  }
                  className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold outline-none focus:border-red-500/50"
                >
                  <option value="No Options">No NA Options Beyond Soda</option>
                  <option value="Bad Service">
                    Poor Service / Pressure to Drink
                  </option>
                  <option value="Plastic Cup">
                    Served in Plastic (Glassware Fail)
                  </option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Optional Photo */}
        <div
          onClick={capturedPhoto ? undefined : startCamera}
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer group relative overflow-hidden ${capturedPhoto ? "border-primary/50 bg-black" : "border-slate-600 bg-surface hover:bg-slate-800 hover:border-primary"}`}
        >
          {capturedPhoto ? (
            <div>
              <img
                src={capturedPhoto}
                alt="Captured Vibe"
                className="w-full h-24 object-cover rounded-md mb-2"
              />
              <button
                onClick={() => setCapturedPhoto(null)}
                className="text-[9px] text-slate-400 font-bold uppercase hover:text-white"
              >
                Retake Photo
              </button>
            </div>
          ) : (
            <>
              {cameraError ? (
                <p className="text-red-500 text-[10px] font-bold">
                  Camera access error. Photo optional.
                </p>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                  <p className="text-[10px] font-black text-slate-300 uppercase italic">
                    Add Proof of Flow (+{estimatePoints('photo')} Drops)
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Marketing Consent */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles
                size={14}
                className={
                  allowMarketingUse ? "text-primary" : "text-slate-600"
                }
              />
              <div>
                <p className="text-[10px] font-black text-white uppercase tracking-wider font-league leading-none">
                  Marketing Consent
                </p>
                <p className="text-[8px] text-slate-500 font-bold uppercase italic mt-0.5">
                  Earn +{GAMIFICATION_CONFIG.REWARDS.MARKETING_CONSENT} Bonus Drops!
                </p>
              </div>
            </div>
            <button
              onClick={() => setAllowMarketingUse(!allowMarketingUse)}
              className={`w-8 h-4 rounded-full p-0.5 transition-all ${allowMarketingUse ? "bg-primary" : "bg-slate-700"}`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white transition-all ${allowMarketingUse ? "translate-x-4" : "translate-x-0"}`}
              />
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-900/20 border border-red-800 p-3 rounded-lg text-red-200 text-xs font-bold text-center">
            ?? {errorMessage}
          </div>
        )}

        <div className="pt-2 border-t border-slate-800 flex justify-between items-center mb-2">
          <span className="text-[10px] font-black text-slate-500 uppercase font-league tracking-widest">
            League Reward
          </span>
          <span className="text-sm font-black text-cyan-400 uppercase font-league">
            +{estimatePoints('vibe') + (capturedPhoto ? estimatePoints('photo') : 0) + (allowMarketingUse ? GAMIFICATION_CONFIG.REWARDS.MARKETING_CONSENT : 0)} DROPS
          </span>
        </div>

        <button
          onClick={handleConfirm}
          disabled={isSubmitting || (!isLocationVerified && !geoLoading)}
          className="w-full bg-primary hover:bg-yellow-400 disabled:bg-slate-700 disabled:text-slate-400 text-black font-black text-lg uppercase tracking-widest py-4 rounded-lg shadow-xl active:scale-95 transition-all font-league italic flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Transmitting...
            </>
          ) : (
            <>Submit Vibe</>
          )}
        </button>
      </div>
    </div>
  );
};

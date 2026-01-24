import React, { useState, useEffect } from "react";
import {
  Info,
  Phone,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Save,
  Clock,
  MapPin,
  Mail,
  ChevronRight,
  Beer,
  Sparkles,
  Users,
  Shield,
  Gamepad2,
  Trophy,
  Zap,
  Utensils,
  Feather,
  Plus,
  Trash2,
  ShoppingBag,
  Music,
  Terminal,
  Star,
  Ticket,
  CreditCard,
} from "lucide-react";
import {
  Venue,
  SceneTag,
  UserProfile,
  PartnerTier,
  VenueType,
} from "../../../types";
import { syncVenueWithGoogle } from "../../../services/venueService";
import { useToast } from "../../../components/ui/BrandedToast";
import { PlaceAutocomplete } from "../../../components/ui/PlaceAutocomplete";

import { SoberPledgeModal } from "./SoberPledgeModal";
import { HoursEditor } from "./HoursEditor";
import { FulfillmentLinkManager } from "./FulfillmentLinkManager";
import { normalizeTo24h } from "../../../utils/timeUtils";

interface ListingManagementTabProps {
  venue: Venue;
  venues?: Venue[];
  onUpdate: (venueId: string, updates: Partial<Venue>) => Promise<void> | void;
  userProfile: UserProfile;
}

const STRATEGIC_VIBES = [
  { value: "dive", label: "Dive" },
  { value: "cocktail_focus", label: "Cocktails" },
  { value: "wine_focus", label: "Wine" },
  { value: "martini_bar", label: "Martini Bar" },
  { value: "patio_garden", label: "Patio" },
  { value: "sports", label: "Sports" },
  { value: "speakeasy", label: "Speakeasy" },
  { value: "speakeasy", label: "Speakeasy" },
];

const PLAY_TYPE_MAP: Record<string, string> = {
  Pool: "pool_table",
  Pinball: "pinball_machine",
  Darts: "darts",
  Arcade: "arcade_game",
  Shuffleboard: "shuffleboard",
  Cornhole: "cornhole",
  "Skee-Ball": "skeeball",
  "Board Games": "board_games",
  "Ping Pong": "ping_pong",
  Foosball: "foosball",
  "Giant Jenga": "giant_jenga",
  "Ring Toss": "ring_toss",
};

export const ListingManagementTab: React.FC<ListingManagementTabProps> = ({
  venue,
  venues,
  onUpdate,
  userProfile,
}) => {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [showSoberPledge, setShowSoberPledge] = useState(false);
  const [formData, setFormData] = useState<Partial<Venue>>({
    name: venue.name || "",
    description: venue.description || "",
    hours: typeof venue.hours === "string" ? venue.hours : "Standard Hours",
    phone: venue.phone || "",
    email: venue.email || "",
    website: venue.website || "",
    instagram: venue.instagram || "",
    facebook: venue.facebook || "",
    twitter: venue.twitter || "",
    vibe: venue.vibe || "",
    insiderVibe: venue.insiderVibe || "",
    originStory: venue.originStory || "",
    isSoberFriendly: venue.isSoberFriendly || false,
    venueType: venue.venueType || "bar_pub",
    sceneTags: venue.sceneTags || [],
    isLocalMaker: venue.isLocalMaker || false,
    tier_config: venue.tier_config || {
      is_directory_listed: true,
      is_league_eligible: false,
    },
    hasGameVibeCheckEnabled: venue.hasGameVibeCheckEnabled || false,
    gameFeatures: venue.gameFeatures || [],
    happyHour: venue.happyHour || {
      startTime: "",
      endTime: "",
      description: "",
      days: [],
    },
    happyHourSpecials: venue.happyHourSpecials || "",
    happyHourSimple: venue.happyHourSimple || "",
    leagueEvent: venue.leagueEvent || null,
    triviaTime: venue.triviaTime || "",
    triviaHost: venue.triviaHost || "",
    triviaPrizes: venue.triviaPrizes || "",
    triviaSpecials: venue.triviaSpecials || "",
    happyHourRules: venue.happyHourRules || [],
    happyHourMenu: venue.happyHourMenu || [],
    is_scraping_enabled: venue.is_scraping_enabled || false,
    scraper_config: venue.scraper_config || [],
    partner_tier: venue.partner_tier || PartnerTier.LOCAL,
    partnerConfig: venue.partnerConfig || {
      tier: PartnerTier.LOCAL,
      billingCycleStart: Date.now(),
      flashBountiesUsed: 0,
    },
    wifiPassword: venue.wifiPassword || "",
    posKey: venue.posKey || "",
    ticketLink: venue.ticketLink || "",
    giftCardUrl: venue.giftCardUrl || "",
    loyalty_signup_url: venue.loyalty_signup_url || "",
    newsletterUrl: venue.newsletterUrl || "",
    directMenuUrl: venue.directMenuUrl || "",
    orderUrl: venue.orderUrl || "",
    reservations: venue.reservations || "",
    reservationUrl: venue.reservationUrl || "",
    capacity: venue.capacity || 0,
    address: venue.address || "",
    fulfillment: venue.fulfillment || {
      doordash: "",
      opentable: "",
      toast: "",
    },
    isLocked: venue.isLocked || false,
  });

  useEffect(() => {
    setFormData({
      ...venue,
      name: venue.name || "",
      description: venue.description || "",
      vibe: venue.vibe || "",
      insiderVibe: venue.insiderVibe || "",
      originStory: venue.originStory || "",
      isSoberFriendly: venue.isSoberFriendly || false,
      venueType: venue.venueType || "bar_pub",
      sceneTags: venue.sceneTags || [],
      gameFeatures: venue.gameFeatures || [],
      happyHourRules: venue.happyHourRules || [],
      happyHourMenu: venue.happyHourMenu || [],
      scraper_config: venue.scraper_config || [],
      wifiPassword: venue.wifiPassword || "",
      posKey: venue.posKey || "",
      ticketLink: venue.ticketLink || "",
      giftCardUrl: venue.giftCardUrl || "",
      loyalty_signup_url: venue.loyalty_signup_url || "",
      newsletterUrl: venue.newsletterUrl || "",
      capacity: venue.capacity || 0,
      address: venue.address || "",
      fulfillment: venue.fulfillment || {
        doordash: "",
        opentable: "",
        toast: "",
      },
      isLocked: venue.isLocked || false,
    });
  }, [venue]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const finalValue = type === "number" ? parseInt(value) || 0 : value;

    // Critical fields that trigger isLocked (Google Lock)
    const CRITICAL_LISTING_FIELDS = [
      "name",
      "address",
      "phone",
      "hours",
      "website",
    ];
    const shouldLock = CRITICAL_LISTING_FIELDS.includes(name);

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
      isLocked: shouldLock ? true : prev.isLocked,
    }));
  };

  const handleSoberToggle = () => {
    if (!formData.isSoberFriendly) {
      // Turning ON -> Show Pledge
      setShowSoberPledge(true);
    } else {
      // Turning OFF -> Direct update
      setFormData((prev) => ({ ...prev, isSoberFriendly: false }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(venue.id, formData);
      showToast("VENUE LISTING UPDATED SUCCESSFULLY", "success");
    } catch (error) {
      console.error("[OwnerDashboard] Failed to save:", error);
      showToast("FAILED TO UPDATE LISTING", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const InputField = ({
    label,
    name,
    value,
    icon: Icon,
    placeholder,
    type = "text",
  }: any) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-slate-100 placeholder:text-slate-800 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all font-medium"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-12">
      {/* ZONE 1: THE PULSE & IDENTITY (TOP PRIORITY) */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <Beer className="w-3 h-3 text-primary" />
              Official Venue Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Venue Name"
              className="w-full bg-transparent border-none p-0 text-3xl font-black text-white uppercase font-league leading-none focus:ring-0 placeholder:text-slate-800"
            />
            <p className="text-[10px] text-primary font-black uppercase tracking-widest italic drop-shadow-sm">
              Zone 1: Pulse & Identity
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${formData.isLocked ? "bg-amber-500/10 border-amber-500/30" : "bg-slate-800/50 border-white/5"}`}
            >
              <Shield
                className={`w-3.5 h-3.5 ${formData.isLocked ? "text-amber-500" : "text-slate-500"}`}
              />
              <div className="flex flex-col">
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${formData.isLocked ? "text-amber-500" : "text-slate-500"}`}
                >
                  {formData.isLocked ? "Google Locked" : "Auto-Sync Active"}
                </span>
                {formData.isLocked && (
                  <span className="text-[8px] text-amber-500/50 font-bold uppercase tracking-tighter">
                    Manual edits will not be overwritten
                  </span>
                )}
              </div>
            </div>
            {formData.isLocked && (
              <button
                onClick={() =>
                  setFormData((prev) => ({ ...prev, isLocked: false }))
                }
                className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1"
              >
                <Zap className="w-2.5 h-2.5" />
                Unlock Sync
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 bg-slate-900/40 border border-white/5 p-8 rounded-[2rem] shadow-2xl">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-primary" />
              The Vibe Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {STRATEGIC_VIBES.map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => {
                    const currentTags = formData.sceneTags || [];
                    const newTags = currentTags.includes(tag.value as SceneTag)
                      ? currentTags.filter((t: SceneTag) => t !== tag.value)
                      : [...currentTags, tag.value as SceneTag];
                    setFormData((prev) => ({ ...prev, sceneTags: newTags }));
                  }}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                    (formData.sceneTags || []).includes(tag.value as SceneTag)
                      ? "bg-primary text-black border-primary shadow-[0_0_20px_rgba(251,191,36,0.2)] scale-105"
                      : "bg-black/40 text-slate-500 border-white/10 hover:border-white/30"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                The One-Liner (Max 140 chars)
              </label>
              <span
                className={`text-[10px] font-bold ${(formData.vibe?.length || 0) > 130 ? "text-red-500" : "text-slate-600"}`}
              >
                {formData.vibe?.length || 0}/140
              </span>
            </div>
            <div className="relative group">
              <div className="absolute left-6 top-6 text-slate-600 group-focus-within:text-primary transition-colors">
                <Feather className="w-5 h-5" />
              </div>
              <textarea
                name="vibe"
                value={formData.vibe}
                onChange={handleChange}
                maxLength={140}
                placeholder="Ex: A legendary dive with the best burgers and cheapest beer in town."
                className="w-full bg-black border-2 border-white/5 rounded-3xl p-6 pl-16 text-sm text-slate-100 placeholder:text-slate-700 min-h-[100px] focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none shadow-inner"
              />
            </div>
          </div>

          {/* [NEW] INSIDER VIBE & ORIGIN STORY */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Insider Vibe (The "Secret Sauce")
                </label>
              </div>
              <div className="relative group">
                <div className="absolute left-6 top-6 text-slate-600 group-focus-within:text-primary transition-colors">
                  <Sparkles className="w-5 h-5" />
                </div>
                <textarea
                  name="insiderVibe"
                  value={formData.insiderVibe || ""}
                  onChange={handleChange}
                  placeholder="Ex: The best spot for late-night jazz and quiet conversation..."
                  className="w-full bg-black border-2 border-white/5 rounded-3xl p-6 pl-16 text-sm text-slate-100 placeholder:text-slate-700 min-h-[80px] focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Origin Story
                </label>
              </div>
              <div className="relative group">
                <div className="absolute left-6 top-6 text-slate-600 group-focus-within:text-primary transition-colors">
                  <Feather className="w-5 h-5" />
                </div>
                <textarea
                  name="originStory"
                  value={formData.originStory || ""}
                  onChange={handleChange}
                  placeholder="Tell the story of how this place came to be..."
                  className="w-full bg-black border-2 border-white/5 rounded-3xl p-6 pl-16 text-sm text-slate-100 placeholder:text-slate-700 min-h-[120px] focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ZONE 2: REMOVED ANCHOR INVENTORY PER V2 SPECS */}

      {/* ZONE 3: THE YIELD ENGINE (SCHEDULE & SPECIALS) */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xl font-black text-white uppercase font-league leading-none flex items-center gap-2">
              <Utensils className="w-5 h-5 text-primary" />
              The Yield Engine
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest italic drop-shadow-sm">
              Manage your Happy Hour & Recurring Specials
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                happyHourRules: [
                  ...(prev.happyHourRules || []),
                  {
                    id: Math.random().toString(36).substr(2, 9),
                    startTime: "16:00",
                    endTime: "18:00",
                    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
                    description: "Happy Hour Specials",
                  },
                ],
              }))
            }
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/20 transition-all"
          >
            <Plus className="w-3 h-3" />
            Add Window
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {(formData.happyHourRules || []).map((rule, idx) => (
            <div
              key={rule.id}
              className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4 animate-in slide-in-from-left-4 duration-300"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Window #{idx + 1}
                </span>
                <button
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      happyHourRules: prev.happyHourRules?.filter(
                        (r) => r.id !== rule.id,
                      ),
                    }))
                  }
                  className="text-red-500/50 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InputField
                  label="Start"
                  name={`rule_start_${idx}`}
                  value={normalizeTo24h(rule.startTime)}
                  type="time"
                  icon={Clock}
                />
                <InputField
                  label="End"
                  name={`rule_end_${idx}`}
                  value={normalizeTo24h(rule.endTime)}
                  type="time"
                  icon={Clock}
                />
                <div className="col-span-2 space-y-1.5 flex flex-col justify-end">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Buzz Clock Text
                    </label>
                    <span
                      className={`text-[9px] font-bold ${(rule.description || "").length >= 35 ? "text-red-500" : "text-slate-600"} mr-1`}
                    >
                      {(rule.description || "").length}/40
                    </span>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors">
                      <Zap className="w-4 h-4" />
                    </div>
                    <input
                      value={rule.description}
                      maxLength={40}
                      onChange={(e) => {
                        const newRules = [...(formData.happyHourRules || [])];
                        newRules[idx].description = e.target.value;
                        setFormData({ ...formData, happyHourRules: newRules });
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-slate-100 placeholder:text-slate-800 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all font-medium"
                      placeholder="Ex: $1 Off Taps & Tacos"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ZONE 4: VITAL INFORMATION & HOURS */}
      <section className="space-y-8 bg-slate-900/40 border border-white/5 p-8 rounded-[2rem] shadow-2xl">
        <div>
          <h3 className="text-xl font-black text-white uppercase font-league leading-none flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            Vital Information & Hours
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest italic">
            Core Contact, Location, & Operating Hours
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              Contact & Logistics
            </h4>
            <InputField
              label="Phone Number"
              name="phone"
              value={formData.phone}
              icon={Phone}
              placeholder="(360) 000-0000"
            />
            <InputField
              label="Public Email"
              name="email"
              value={formData.email}
              icon={Mail}
              placeholder="info@yourvenue.com"
            />
            <InputField
              label="Website"
              name="website"
              value={formData.website}
              icon={Globe}
              placeholder="www.yourvenue.com"
            />

            <div className="pt-4 border-t border-white/5 space-y-4">
              <h4
                id="hours-section"
                className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]"
              >
                Hours of Operation
              </h4>
              <div className="space-y-4">
                <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-xl">
                      <Clock className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                        Digital Storefront Hours
                      </div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">
                        Set your daily opening & closing times
                      </div>
                    </div>
                  </div>
                </div>

                <HoursEditor
                  hours={formData.hours}
                  onChange={(newHours) =>
                    setFormData((prev) => ({
                      ...prev,
                      hours: newHours,
                      isLocked: true, // Structured hour edit always locks
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <MapPin className="w-3 h-3 text-primary" />
                Google Maps Alignment
              </h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const placeIdToSync = venue.googlePlaceId;
                    if (placeIdToSync) {
                      // FORCE SYNC: Use existing ID
                      setIsSyncing(true);
                      syncVenueWithGoogle(venue.id, undefined)
                        .then((result) => {
                          if (result.success) {
                            setFormData((prev) => ({
                              ...prev,
                              ...result.updates,
                            }));
                            onUpdate(venue.id, result.updates);
                            showToast("SYNCED WITH GOOGLE PLACES", "success");
                          }
                        })
                        .catch((err) =>
                          showToast(err.message || "SYNC FAILED", "error"),
                        )
                        .finally(() => setIsSyncing(false));
                    } else {
                      showToast(
                        "NO PLACE LINKED. PLEASE SEARCH FIRST.",
                        "error",
                      );
                    }
                  }}
                  disabled={isSyncing}
                  className="px-3 py-1.5 bg-primary text-black text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                >
                  {isSyncing ? (
                    <Sparkles className="w-3 h-3 animate-spin" />
                  ) : (
                    <Zap className="w-3 h-3" />
                  )}
                  {isSyncing ? "Syncing..." : "Force Sync"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPlaceId(
                      selectedPlaceId === "SEARCH_MODE" ? null : "SEARCH_MODE",
                    )
                  }
                  className="px-3 py-1.5 bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-slate-700 transition-all flex items-center gap-1.5"
                >
                  <Globe className="w-3 h-3" />
                  {selectedPlaceId === "SEARCH_MODE" ? "Cancel" : "Re-Link"}
                </button>
              </div>
            </div>

            {/* Display Current Link Info if not searching */}
            {selectedPlaceId !== "SEARCH_MODE" && (
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-medium">
                    Currently Linked To:
                  </div>
                  <div className="text-sm text-white font-bold">
                    {venue.googlePlaceId
                      ? venue.address || venue.googlePlaceId
                      : "Not Linked"}
                  </div>
                </div>
                {venue.lastGoogleSync && (
                  <div className="text-[10px] text-slate-500 font-mono">
                    Last Sync:{" "}
                    {new Date(venue.lastGoogleSync).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}

            {/* Search Box - Only visible if requested */}
            {selectedPlaceId === "SEARCH_MODE" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <PlaceAutocomplete
                  onPlaceSelect={(place) => {
                    // Trigger Sync immediately on selection
                    setIsSyncing(true);
                    syncVenueWithGoogle(venue.id, place.place_id)
                      .then((result) => {
                        if (result.success) {
                          setFormData((prev) => ({
                            ...prev,
                            ...result.updates,
                          }));
                          onUpdate(venue.id, result.updates);
                          showToast("RE-LINKED & SYNCED", "success");
                          setSelectedPlaceId(null);
                        }
                      })
                      .catch((err) =>
                        showToast(err.message || "SYNC FAILED", "error"),
                      )
                      .finally(() => setIsSyncing(false));
                  }}
                  placeholder="Search Google Maps to Re-Link..."
                  className="!bg-black/20"
                  venues={venues}
                />
                <p className="text-[10px] text-slate-500 mt-2 ml-1">
                  Select a location to update address, hours, and photos
                  automatically.
                </p>
              </div>
            )}
            <InputField
              label="Current Address"
              name="address"
              value={formData.address}
              icon={MapPin}
            />

            <div className="pt-4 border-t border-white/5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Wifi Password"
                  name="wifiPassword"
                  value={formData.wifiPassword || ""}
                  icon={Shield}
                  placeholder="Password"
                />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Capacity
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors">
                      <Users className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity || ""}
                      onChange={handleChange}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-slate-100 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
              <InputField
                label="POS Integration Key"
                name="posKey"
                value={formData.posKey || ""}
                icon={Terminal}
                placeholder="Ex: toast_XXXXXX"
                type="password"
              />
            </div>
          </div>
        </div>

        {/* ZONE 5: PROFIT & FULFILLMENT */}
        <div
          id="fulfillment-section"
          className="pt-8 border-t border-white/5 space-y-6"
        >
          <div>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
              Profit & Fulfillment
            </h4>
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest italic">
              Ticketing, Reservations, & Retention
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-6">
              <h5 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">
                Fulfillment Links (Third-Party Services)
              </h5>
              <FulfillmentLinkManager
                fulfillment={formData.fulfillment}
                onChange={(newFulfillment) =>
                  setFormData((prev) => ({
                    ...prev,
                    fulfillment: newFulfillment,
                    isLocked: true, // Editing fulfillment locks the listing
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
              <div className="space-y-6">
                <h5 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">
                  Reservations & Access
                </h5>
                <InputField
                  label="Primary Booking Link"
                  name="reservationUrl"
                  value={formData.reservationUrl}
                  icon={ChevronRight}
                  placeholder="OpenTable, Tock, Resy URL"
                />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Reservation Policy
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-4 text-slate-600 group-focus-within:text-primary transition-colors">
                      <Info className="w-4 h-4" />
                    </div>
                    <textarea
                      name="reservations"
                      value={formData.reservations}
                      onChange={handleChange}
                      placeholder="Ex: First come first served, or Reservations required for 6+..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-slate-100 placeholder:text-slate-800 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all font-medium min-h-[80px] resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h5 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">
                  Ticketing & Loyalty
                </h5>
                <InputField
                  label="Ticketing Link"
                  name="ticketLink"
                  value={formData.ticketLink}
                  icon={Trophy}
                  placeholder="VRS, Ticketmaster, etc"
                />
                <InputField
                  label="Gift Card URL"
                  name="giftCardUrl"
                  value={formData.giftCardUrl}
                  icon={CreditCard}
                  placeholder="Square, Toast, or GiftFly Link"
                />
                <InputField
                  label="Loyalty Program URL"
                  name="loyalty_signup_url"
                  value={formData.loyalty_signup_url}
                  icon={Star}
                  placeholder="Rewards/Loyalty Signup"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <InputField
              label="Newsletter Signup"
              name="newsletterUrl"
              value={formData.newsletterUrl}
              icon={Mail}
              placeholder="Mailchimp, Substack, etc"
            />
            <InputField
              label="Direct Menu / Taps URL"
              name="directMenuUrl"
              value={formData.directMenuUrl}
              icon={Utensils}
              placeholder="Untappd, DigitalPour, etc"
            />
          </div>
        </div>

        {/* ZONE 6: SOCIAL NETWORKS */}
        <div className="pt-8 border-t border-white/5">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">
            Social Networks
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField
              label="Instagram"
              name="instagram"
              value={formData.instagram}
              icon={Instagram}
              placeholder="@handle"
            />
            <InputField
              label="Facebook"
              name="facebook"
              value={formData.facebook}
              icon={Facebook}
              placeholder="facebook.com/..."
            />
            <InputField
              label="Twitter / X"
              name="twitter"
              value={formData.twitter}
              icon={Twitter}
              placeholder="@handle"
            />
          </div>
        </div>

        {/* Meta Sync (Artie Social Engine) */}
        <div className="pt-8 border-t border-white/5">
          <div className="mt-6 bg-gradient-to-br from-purple-900/10 to-blue-900/10 border border-purple-500/20 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-xl text-white shadow-lg shadow-purple-500/20">
                  <Instagram className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight leading-none mb-1">
                    Artie Social Engine
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">
                    Auto-sync events & photos from Instagram
                  </p>
                </div>
              </div>

              {formData.partnerConfig?.metaSync?.instagramBusinessId ? (
                <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 px-3 py-1.5 rounded-lg text-green-400 text-[10px] font-black uppercase tracking-widest animate-in fade-in">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Connected
                </div>
              ) : (
                <div className="bg-slate-800/50 border border-white/5 px-3 py-1.5 rounded-lg text-slate-500 text-[10px] font-black uppercase tracking-widest italic">
                  Not Connected
                </div>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Connect your Instagram Business account to let Artie
                automatically classification your posts as{" "}
                <strong>League Events</strong> (+25 pts) or{" "}
                <strong>Venue Specials</strong>.
              </p>

              {!formData.partnerConfig?.metaSync?.instagramBusinessId ? (
                <button
                  onClick={() => {
                    const appId = import.meta.env.VITE_META_APP_ID;
                    const redirectUri = `${window.location.origin}/oauth/callback`;
                    const scopes = [
                      "public_profile",
                      "pages_show_list",
                      "pages_read_engagement",
                      "pages_manage_posts",
                      "instagram_basic",
                      "instagram_content_publish",
                    ].join(",");

                    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${venue.id}&scope=${scopes}&response_type=code`;

                    window.location.href = authUrl;
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black py-4 rounded-xl uppercase tracking-[0.15em] text-xs shadow-xl shadow-purple-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
                >
                  <Instagram className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  Connect Instagram Business
                </button>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-2">
                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">
                      IG Business ID:
                    </span>
                    <span className="text-[10px] text-white font-black tracking-widest">
                      {formData.partnerConfig.metaSync.instagramBusinessId}
                    </span>
                  </div>
                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">
                      Auto-Publish:
                    </span>
                    <button
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          partnerConfig: {
                            ...prev.partnerConfig!,
                            metaSync: {
                              ...prev.partnerConfig!.metaSync!,
                              autoPublishEnabled:
                                !prev.partnerConfig!.metaSync!
                                  .autoPublishEnabled,
                            },
                          },
                        }))
                      }
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${formData.partnerConfig?.metaSync?.autoPublishEnabled ? "bg-primary text-black" : "bg-slate-800 text-slate-500"}`}
                    >
                      {formData.partnerConfig?.metaSync?.autoPublishEnabled
                        ? "ENABLED"
                        : "DISABLED"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Visibility Strategy */}
        <div className="pt-8 border-t border-white/5">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">
            Visibility Strategy
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: "directory",
                label: "In Discovery Lists",
                isEnabled: formData.tier_config?.is_directory_listed || false,
                icon: Shield,
              },
              {
                id: "league",
                label: "Artesian Bar League Active",
                isEnabled: formData.tier_config?.is_league_eligible || false,
                icon: Trophy,
              },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  const newVal = !item.isEnabled;
                  setFormData((prev) => ({
                    ...prev,
                    tier_config: {
                      ...prev.tier_config!,
                      [item.id === "directory"
                        ? "is_directory_listed"
                        : "is_league_eligible"]: newVal,
                    },
                  }));
                }}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  item.isEnabled
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-black/20 border-white/5 text-slate-500 hover:border-white/20"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Features Checklist */}
        <div className="pt-8 border-t border-white/5">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">
            Features
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: "isAllAges", label: "All Ages", icon: Users },
              { id: "isDogFriendly", label: "Dog Friendly", icon: Shield },
              {
                id: "hasOutdoorSeating",
                label: "Patio / Outdoor",
                icon: MapPin,
              },
              {
                id: "reservations",
                label: "Accepts Reservations",
                icon: Clock,
              },
              {
                id: "dance_floor_tag",
                label: "Dance Floor",
                icon: Music,
                isTag: true,
                tagValue: "dance_floor",
              },
              // NEW: Game Features presented as Amenities
              {
                id: "jukebox",
                label: "Jukebox",
                icon: Music,
                isGameFeature: true,
                gameName: "Jukebox",
              },
              {
                id: "pull_tabs",
                label: "Pull Tabs",
                icon: Ticket,
                isGameFeature: true,
                gameName: "Pull Tabs",
              },
            ].map((amenity: any) => {
              // Determine Active State
              let isActive = false;
              if (amenity.isTag) {
                isActive = formData.sceneTags?.includes(amenity.tagValue);
              } else if (amenity.isGameFeature) {
                isActive = !!formData.gameFeatures?.find(
                  (gf) => gf.name === amenity.gameName,
                );
              } else {
                isActive = (formData as any)[amenity.id];
              }

              return (
                <button
                  key={amenity.id}
                  type="button"
                  onClick={() => {
                    if (amenity.isTag) {
                      // Toggle Scene Tag
                      const currentTags = formData.sceneTags || [];
                      const newTags = currentTags.includes(amenity.tagValue)
                        ? currentTags.filter((t: any) => t !== amenity.tagValue)
                        : [...currentTags, amenity.tagValue];
                      setFormData((prev) => ({ ...prev, sceneTags: newTags }));
                    } else if (amenity.isGameFeature) {
                      // Toggle Game Feature (Complex Object)
                      const currentFeatures = formData.gameFeatures || [];
                      const existing = currentFeatures.find(
                        (gf) => gf.name === amenity.gameName,
                      );

                      if (existing) {
                        // Remove
                        setFormData((prev) => ({
                          ...prev,
                          gameFeatures: currentFeatures.filter(
                            (gf) => gf.name !== amenity.gameName,
                          ),
                        }));
                      } else {
                        // Add with Smart Defaults
                        const newFeature: any = {
                          id: amenity.id,
                          name: amenity.gameName,
                          type: amenity.id, // 'jukebox' or 'pull_tabs'
                          status: "active",
                          count: 1,
                        };
                        setFormData((prev) => ({
                          ...prev,
                          gameFeatures: [...currentFeatures, newFeature],
                        }));
                      }
                    } else {
                      // Standard Boolean Toggle
                      setFormData((prev) => ({
                        ...prev,
                        [amenity.id]: !(prev as any)[amenity.id],
                      }));
                    }
                  }}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    isActive
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "bg-black/20 border-white/5 text-slate-500 hover:border-white/20"
                  }`}
                >
                  <amenity.icon className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {amenity.label}
                  </span>
                </button>
              );
            })}
            {/* Sober Friendly Pledge Button */}
            <button
              type="button"
              onClick={handleSoberToggle}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                formData.isSoberFriendly
                  ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                  : "bg-black/20 border-white/5 text-slate-500 hover:border-white/20"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Sober Friendly
              </span>
            </button>
          </div>
        </div>

        {/* Play Section (New) */}
        <div className="pt-8 border-t border-white/5">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">
            Play
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Pool",
              "Pinball",
              "Darts",
              "Arcade",
              "Shuffleboard",
              "Cornhole",
              "Skee-Ball",
              "Board Games",
              "Ping Pong",
              "Foosball",
              "Giant Jenga",
              "Ring Toss",
            ].map((playItem) => {
              const existingFeature = formData.gameFeatures?.find(
                (gf) => gf.name === playItem,
              );
              const isSelected = !!existingFeature;

              return (
                <button
                  key={playItem}
                  type="button"
                  onClick={() => {
                    const currentFeatures = formData.gameFeatures || [];
                    if (isSelected) {
                      setFormData((prev) => ({
                        ...prev,
                        gameFeatures: currentFeatures.filter(
                          (gf) => gf.name !== playItem,
                        ),
                      }));
                    } else {
                      const newFeature: any = {
                        id: playItem.toLowerCase().replace(/ /g, "_"),
                        name: playItem,
                        type: PLAY_TYPE_MAP[playItem] || "unknown",
                        status: "active",
                        count: 1,
                      };
                      setFormData((prev) => ({
                        ...prev,
                        gameFeatures: [...currentFeatures, newFeature],
                      }));
                    }
                  }}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "bg-black/20 border-white/5 text-slate-500 hover:border-white/20"
                  }`}
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {playItem}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Access & Policy Details */}
        <div className="pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              Fulfillment Links
            </h4>
            <InputField
              label="Reservations URL"
              name="reservationUrl"
              value={formData.reservationUrl}
              icon={Clock}
              placeholder="OpenTable/Resy link"
            />
            <InputField
              label="Direct Order URL"
              name="orderUrl"
              value={formData.orderUrl}
              icon={ShoppingBag}
              placeholder="Toast/Square link"
            />
          </div>
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Venue Category
              </label>
              <select
                name="venueType"
                value={formData.venueType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    venueType: e.target.value as VenueType,
                  }))
                }
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-slate-100 focus:border-primary/50 outline-none transition-all font-medium appearance-none"
              >
                <option value="bar_pub">Bar / Pub</option>
                <option value="restaurant_bar">Restaurant / Bar</option>
                <option value="brewery_taproom">Brewery / Taproom</option>
                <option value="brewpub">Brewpub</option>
                <option value="lounge_club">Lounge / Club</option>
                <option value="arcade_bar">Arcade Bar</option>
                <option value="private_club">Private Club</option>
                <option value="winery_tasting">Winery / Tasting Room</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ACTION FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none z-50">
        <div className="max-w-7xl mx-auto flex justify-end pointer-events-auto">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="group relative px-12 py-5 bg-primary rounded-2xl shadow-[0_0_50px_rgba(251,191,36,0.3)] hover:shadow-[0_0_60px_rgba(251,191,36,0.5)] transition-all active:scale-95 disabled:opacity-50 overflow-hidden"
          >
            <div className="relative z-10 flex items-center gap-3">
              <Save
                className={`w-5 h-5 text-black ${isSaving ? "animate-spin" : "group-hover:rotate-12 transition-transform"}`}
              />
              <span className="text-sm font-black text-black uppercase tracking-[0.2em]">
                {isSaving ? "Syncing..." : "Commit All Changes"}
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </button>
        </div>
      </div>

      <SoberPledgeModal
        isOpen={showSoberPledge}
        onClose={() => setShowSoberPledge(false)}
        onConfirm={() => {
          setFormData((prev) => ({ ...prev, isSoberFriendly: true }));
          setShowSoberPledge(false);
          showToast("Sober Pledge Committed!", "success");
        }}
      />

      <div className="h-32" />
    </div>
  );
};

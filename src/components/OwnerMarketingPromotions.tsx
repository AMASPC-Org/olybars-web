import React, { useState } from "react";

type PostTypeKey =
  | "launch"
  | "weekly"
  | "standings"
  | "joinNextSeason"
  | "holiday";

const POST_TYPE_LABELS: Record<PostTypeKey, string> = {
  launch: "Launch Announcement",
  weekly: "Tonight at [Bar] – Weekly Post",
  standings: "Standings / Winners Post",
  joinNextSeason: "Join Next Season Post",
  holiday: "Seasonal / Holiday Post",
};

interface OwnerMarketingPromotionsProps {
  initialDraft?: { type: string; content: string };
}

export const OwnerMarketingPromotions: React.FC<
  OwnerMarketingPromotionsProps
> = ({ initialDraft }) => {
  const [activeSection, setActiveSection] = useState<
    "overview" | "posts" | "assets" | "faq"
  >(initialDraft ? "posts" : "overview");

  // Simple stub state for drafts; real implementation should load/save from Firestore.
  const [drafts, setDrafts] = useState<Record<PostTypeKey, string>>({
    launch: "",
    weekly: "",
    standings: "",
    joinNextSeason: "",
    holiday: "",
  });

  // [NEW] Effect to pre-fill draft from other tabs
  React.useEffect(() => {
    if (initialDraft && initialDraft.type === "holiday") {
      setDrafts((prev) => ({ ...prev, holiday: initialDraft.content }));
      setActiveSection("posts");
      // Optional: Scroll to posts
      setTimeout(() => {
        document
          .getElementById("posts")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [initialDraft]);

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {
      // Swallow for now; real app can show toast.
    });
  };

  const handleUpdateDraft = (key: PostTypeKey, value: string) => {
    setDrafts((prev) => ({ ...prev, [key]: value }));
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id as any);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-primary tracking-tight font-['Bangers'] tracking-wide uppercase">
          Marketing &amp; Promotions
        </h1>
        <p className="text-sm text-slate-300 font-['Roboto_Condensed'] font-bold">
          Plan and promote your Artesian Bar League nights with AI-drafted
          posts, ready-to-use assets, and simple best practices.
        </p>

        {/* In-page nav */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            { id: "overview", label: "Overview" },
            { id: "posts", label: "Auto-Generated Posts" },
            { id: "assets", label: "Assets & Templates" },
            { id: "faq", label: "FAQ & Best Practices" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => scrollToSection(tab.id)}
              className={`px-3 py-1.5 text-xs font-['Bangers'] tracking-wider border-2 transition uppercase
                ${
                  activeSection === tab.id
                    ? "bg-primary text-black border-black shadow-[2px_2px_0px_0px_#000]"
                    : "bg-slate-800 text-slate-200 border-slate-600 hover:border-primary"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Overview */}
      <section
        id="overview"
        className="bg-slate-800 border-2 border-black shadow-[4px_4px_0px_0px_#000] p-4 space-y-3"
      >
        <h2 className="text-lg font-['Bangers'] uppercase text-primary tracking-wide">
          Overview: Why this exists
        </h2>
        <p className="text-sm text-slate-200 font-['Roboto_Condensed'] font-bold">
          The Artesian Bar League is player-first, but it only works when{" "}
          <span className="text-primary">your bar talks about it</span>. This
          hub gives you three things:
        </p>
        <ul className="list-disc list-inside text-sm text-slate-300 space-y-1 font-['Roboto_Condensed']">
          <li>AI-drafted posts you can approve in seconds.</li>
          <li>Posters, table tents, and graphics that stay on-brand.</li>
          <li>
            Clear guidance on how people will hear about the league and how to
            promote it in your space.
          </li>
        </ul>
        <div className="grid gap-3 sm:grid-cols-3 mt-2 text-xs text-slate-300 font-['Roboto_Condensed']">
          <div className="border-2 border-slate-600 bg-slate-900 p-3">
            <p className="font-black text-primary mb-1 uppercase">
              Objective 1 – Consistency
            </p>
            <p>
              Every venue tells the same story about the league, in its own
              voice.
            </p>
          </div>
          <div className="border-2 border-slate-600 bg-slate-900 p-3">
            <p className="font-black text-primary mb-1 uppercase">
              Objective 2 – Ease
            </p>
            <p>No blank page. You review, tweak, and hit copy.</p>
          </div>
          <div className="border-2 border-slate-600 bg-slate-900 p-3">
            <p className="font-black text-primary mb-1 uppercase">
              Objective 3 – Reach
            </p>
            <p>
              Social posts + in-venue signage so players see the league
              everywhere.
            </p>
          </div>
        </div>
      </section>

      {/* Auto-Generated Posts */}
      <section
        id="posts"
        className="bg-slate-800 border-2 border-black shadow-[4px_4px_0px_0px_#000] p-4 space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-['Bangers'] uppercase text-primary tracking-wide">
            Auto-Generated Posts
          </h2>
          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-black bg-black px-2 py-1">
            Draft → Edit → Approve → Copy &amp; Post
          </span>
        </div>

        {/* Profile summary chips (read-only placeholders) */}
        <div className="flex flex-wrap gap-2 text-xs font-['Roboto_Condensed'] font-bold">
          <span className="px-2 py-1 bg-slate-900 border border-slate-600 text-slate-300">
            Bar:{" "}
            <span className="text-white">Hannah&apos;s Bar &amp; Grille</span>
          </span>
          <span className="px-2 py-1 bg-slate-900 border border-slate-600 text-slate-300">
            League Night: <span className="text-white">Wed 8–11pm</span>
          </span>
          <span className="px-2 py-1 bg-slate-900 border border-slate-600 text-slate-300">
            Season: <span className="text-white">Season 3 – Winter</span>
          </span>
          <span className="px-2 py-1 bg-slate-900 border border-slate-600 text-slate-300">
            Tone:{" "}
            <span className="text-white">Fun, competitive, not cheesy</span>
          </span>
        </div>

        <p className="text-xs text-slate-400 font-['Roboto_Condensed'] italic">
          These posts are generated from your bar profile. Artie drafts content
          for you – you just review, tweak, and approve.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {(Object.keys(POST_TYPE_LABELS) as PostTypeKey[]).map((key) => (
            <div
              key={key}
              className="border-2 border-slate-600 bg-slate-900 p-3 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-black text-white uppercase">
                  {POST_TYPE_LABELS[key]}
                </h3>
                <span className="text-[10px] px-2 py-0.5 bg-primary text-black border border-black uppercase font-black">
                  Draft
                </span>
              </div>
              <textarea
                value={drafts[key]}
                onChange={(e) => handleUpdateDraft(key, e.target.value)}
                placeholder="Post copy will appear here once generated. You can edit before approving."
                className="w-full min-h-[120px] text-xs bg-black border border-slate-700 px-2 py-1.5 text-white resize-vertical focus:outline-none focus:border-primary font-mono"
              />
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="text-[10px] px-2 py-1 bg-slate-800 border border-slate-600 hover:border-primary transition font-bold uppercase text-slate-300"
                  >
                    Generate
                  </button>
                  <button
                    type="button"
                    className="text-[10px] px-2 py-1 bg-primary text-black border border-black hover:bg-yellow-400 transition font-black uppercase"
                  >
                    Approve
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(drafts[key])}
                  className="text-[10px] px-2 py-1 bg-slate-700 border border-slate-500 hover:bg-slate-600 transition font-bold uppercase text-white"
                >
                  Copy text
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Assets & Templates */}
      <section
        id="assets"
        className="bg-slate-800 border-2 border-black shadow-[4px_4px_0px_0px_#000] p-4 space-y-4"
      >
        <h2 className="text-lg font-['Bangers'] uppercase text-primary tracking-wide">
          Assets &amp; Templates
        </h2>
        <p className="text-sm text-slate-200 font-['Roboto_Condensed'] font-bold">
          Download ready-made Artesian Bar League visuals for your bar.
        </p>

        <div className="grid gap-3 md:grid-cols-2 text-sm font-['Roboto_Condensed']">
          <AssetTile
            title="Artesian Bar League logo pack (PNG/SVG)"
            description="Use in your own graphics or on your website."
            href="#TODO-logo-pack"
          />
          <AssetTile
            title="“League Night HQ” web badge (PNG/SVG)"
            description="Add this badge to your site or digital menus."
            href="#TODO-web-badge"
          />
        </div>

        <div className="border-t-2 border-black border-dashed pt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className="inline-flex items-center justify-center px-3 py-1.5 bg-slate-900 border-2 border-slate-600 text-xs font-black text-white hover:border-primary transition uppercase tracking-wide"
          >
            Request more materials
          </button>
          <p className="text-[11px] text-slate-400 font-['Roboto_Condensed']">
            For now, text Artie{" "}
            <span className="font-mono text-primary">'marketing help'</span>
          </p>
        </div>
      </section>

      {/* FAQ & Best Practices */}
      <section
        id="faq"
        className="bg-slate-800 border-2 border-black shadow-[4px_4px_0px_0px_#000] p-4 space-y-4 mb-10"
      >
        <h2 className="text-lg font-['Bangers'] uppercase text-primary tracking-wide">
          FAQ &amp; Best Practices
        </h2>

        <div className="grid gap-4 md:grid-cols-2 font-['Roboto_Condensed']">
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wide mb-2 border-b-2 border-black pb-1 inline-block">
              Social Best Practices
            </h4>
            <ul className="list-disc list-inside text-sm text-slate-300 space-y-1 font-bold">
              <li>
                Post a “Tonight at [Bar]” update the afternoon of every league
                night.
              </li>
              <li>
                Use consistent hashtags like{" "}
                <span className="font-mono text-xs text-primary">
                  #ArtesianBarLeague
                </span>
                .
              </li>
              <li>Tag OlyBars and other participating venues.</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wide mb-2 border-b-2 border-black pb-1 inline-block">
              In-Venue Best Practices
            </h4>
            <ul className="list-disc list-inside text-sm text-slate-300 space-y-1 font-bold">
              <li>Place table tents on bar tops during league season.</li>
              <li>Hang the poster near the entrance and restrooms.</li>
              <li>
                Give staff a one-liner: “Check in on OlyBars to earn points.”
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

type AssetTileProps = {
  title: string;
  description: string;
  href: string;
};

const AssetTile: React.FC<AssetTileProps> = ({ title, description, href }) => (
  <div className="border-2 border-black bg-slate-900 p-3 flex flex-col justify-between gap-2 shadow-[2px_2px_0px_0px_#000]">
    <div>
      <h3 className="text-sm font-black text-white uppercase">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 font-bold">{description}</p>
    </div>
    <a
      href={href}
      className="inline-flex items-center justify-center mt-1 text-[10px] px-2 py-1 bg-black border border-white text-white hover:bg-white hover:text-black transition font-black uppercase tracking-wider"
    >
      Download
    </a>
  </div>
);

export default OwnerMarketingPromotions;

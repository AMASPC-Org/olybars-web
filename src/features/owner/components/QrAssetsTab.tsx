import React, { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Printer, Info, Check, Copy } from "lucide-react";
import { Venue } from "../../../types";
import { useToast } from "../../../components/ui/BrandedToast";

interface QrAssetsTabProps {
  venue: Venue;
}

export const QrAssetsTab: React.FC<QrAssetsTabProps> = ({ venue }) => {
  const { showToast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const qrUrl = `https://olybars.com/check-in?v=${venue.id}`;

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `olybars-checkin-${venue.id}-${theme}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast("QR Asset Downloaded", "success");
    } else {
      showToast("Failed to generate QR", "error");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrUrl);
    showToast("Check-in URL copied to clipboard", "success");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 border border-yellow-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Printer size={80} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white italic tracking-tight font-league">
            PHYSICAL ASSETS
          </h2>
          <p className="text-slate-400 text-sm max-w-md">
            Download your official Brew House Check-in QR code. Place this on
            tables or at the register to let guests check in and boost your
            Vibe.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Preview Card */}
        <div className="space-y-4">
          <div className="bg-surface border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
            {/* Theme Toggle */}
            <div className="absolute top-4 right-4 flex bg-black/40 rounded-full p-1 border border-white/10">
              <button
                onClick={() => setTheme("light")}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                  theme === "light"
                    ? "bg-white text-black"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                  theme === "dark"
                    ? "bg-primary text-black"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                Dark
              </button>
            </div>

            <div
              ref={qrRef}
              className={`p-6 rounded-2xl transition-colors duration-300 shadow-2xl ${
                theme === "light"
                  ? "bg-white"
                  : "bg-[#0f172a] border border-white/20"
              }`}
            >
              <QRCodeCanvas
                value={qrUrl}
                size={200}
                level={"M"}
                bgColor={theme === "light" ? "#ffffff" : "#0f172a"}
                fgColor={theme === "light" ? "#000000" : "#fbbf24"} // Gold on Dark, Black on Light
                includeMargin={true}
              />
            </div>

            <div className="text-center space-y-1">
              <p className="text-white font-black uppercase tracking-widest text-sm">
                {venue.name}
              </p>
              <p className="text-primary text-xs font-mono">
                olybars.com/check-in
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownload}
              className="bg-primary text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Download PNG
            </button>
            <button
              onClick={handleCopyLink}
              className="bg-white/5 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Copy size={16} />
              Copy Check-in Link
            </button>
          </div>
        </div>

        {/* Instructions / Guide */}
        <div className="space-y-6">
          <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
            <h3 className="text-primary font-black uppercase tracking-tight mb-4 flex items-center gap-2">
              <Info size={16} />
              Placement Guide
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0">
                  <Check size={14} strokeWidth={3} />
                </div>
                <div>
                  <h4 className="text-white text-xs font-bold uppercase">
                    Table Tents
                  </h4>
                  <p className="text-slate-400 text-xs leading-relaxed mt-1">
                    The highest conversion rate comes from placing a small QR
                    card on every table.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0">
                  <Check size={14} strokeWidth={3} />
                </div>
                <div>
                  <h4 className="text-white text-xs font-bold uppercase">
                    The Bar Top
                  </h4>
                  <p className="text-slate-400 text-xs leading-relaxed mt-1">
                    Place a laminated card every 4-5 seats at the main bar.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0">
                  <Check size={14} strokeWidth={3} />
                </div>
                <div>
                  <h4 className="text-white text-xs font-bold uppercase">
                    The Entrance
                  </h4>
                  <p className="text-slate-400 text-xs leading-relaxed mt-1">
                    Host stand or front door placement helps capture guests as
                    they arrive.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

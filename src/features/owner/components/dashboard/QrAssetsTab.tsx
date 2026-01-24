import React from "react";
import { Download, Printer, Info } from "lucide-react";
import { Venue } from "../../../../types";
import { useToast } from "../../../../components/ui/BrandedToast";

interface QrAssetsTabProps {
  venue: Venue;
}

export default function QrAssetsTab({ venue }: QrAssetsTabProps) {
  const { showToast } = useToast();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-black text-white uppercase font-league leading-none">
          Vibe Check QR
        </h3>
        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">
          Physical Assets for On-Premise Verification
        </p>
      </div>

      <div className="bg-surface border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center space-y-6">
        <div className="bg-white p-4 rounded-xl shadow-2xl">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://olybars.com/vc/${venue.id}`}
            alt="Venue QR Code"
            className="w-48 h-48"
          />
        </div>
        <div>
          <p className="text-primary font-black uppercase tracking-widest text-sm mb-2">
            Scan Target
          </p>
          <code className="bg-black/50 px-3 py-1 rounded text-slate-400 text-xs font-mono">
            https://olybars.com/vc/{venue.id}
          </code>
        </div>

        <div className="flex gap-4 w-full">
          <a
            href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=https://olybars.com/vc/${venue.id}&format=png`}
            download={`${venue.name.replace(/\s+/g, "_")}_QR.png`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-slate-800 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </a>
          <button
            onClick={() =>
              showToast("Printer integration coming in V2", "info")
            }
            className="flex-1 bg-surface border border-white/10 text-slate-500 font-black py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Label
          </button>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-xl text-left w-full">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <p className="text-blue-400 font-black uppercase tracking-widest text-xs mb-1">
                Placement Guide
              </p>
              <ul className="text-slate-400 text-[10px] space-y-1 list-disc pl-4">
                <li>Place near the entrance or at the bar.</li>
                <li>Ensure good lighting for easy scanning.</li>
                <li>This code is permanent for your venue.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

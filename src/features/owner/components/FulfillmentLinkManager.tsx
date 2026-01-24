import React from "react";
import { ShoppingBag, Utensils, Zap, ExternalLink } from "lucide-react";

interface FulfillmentLinkManagerProps {
  fulfillment?: {
    doordash?: string;
    opentable?: string;
    toast?: string;
    [key: string]: string | undefined;
  };
  onChange: (fulfillment: any) => void;
}

export const FulfillmentLinkManager: React.FC<FulfillmentLinkManagerProps> = ({
  fulfillment = {},
  onChange,
}) => {
  const links = [
    {
      key: "doordash",
      label: "DoorDash",
      icon: ShoppingBag,
      color: "text-red-500",
      placeholder: "Order URL",
    },
    {
      key: "opentable",
      label: "OpenTable",
      icon: Utensils,
      color: "text-emerald-500",
      placeholder: "Reservation URL",
    },
    {
      key: "toast",
      label: "Toast Tab",
      icon: Zap,
      color: "text-orange-500",
      placeholder: "Direct Ordering URL",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {links.map((link) => {
        const Icon = link.icon;
        const value = fulfillment[link.key] || "";

        return (
          <div key={link.key} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Icon className={`w-3 h-3 ${link.color}`} />
                {link.label}
              </label>
              {value && (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="relative group">
              <input
                type="text"
                value={value}
                onChange={(e) =>
                  onChange({ ...fulfillment, [link.key]: e.target.value })
                }
                placeholder={link.placeholder}
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-xs text-slate-100 placeholder:text-slate-800 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium shadow-inner"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

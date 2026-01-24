import React, { useState } from "react";
import {
  MenuItem,
  MenuItemStatus,
  MenuItemType,
} from "../../../../types/venue";
import {
  Beer,
  Martini,
  Wine,
  Utensils,
  AlertTriangle,
  Power,
  Trash2,
} from "lucide-react";

interface InventoryItemCardProps {
  item: MenuItem;
  onToggle: (item: MenuItem) => void;
  onEdit?: (item: MenuItem) => void;
  onDelete?: (item: MenuItem) => void;
}

export const InventoryItemCard: React.FC<InventoryItemCardProps> = ({
  item,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const isLive = item.status === MenuItemStatus.Live;
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isToggling) return;
    setIsToggling(true);
    // Optimistic update handled by parent usually, but we can animate here
    await onToggle(item);
    setIsToggling(false);
  };

  const getTypeIcon = (type: MenuItemType) => {
    switch (type) {
      case MenuItemType.Crisp:
      case MenuItemType.Hoppy:
      case MenuItemType.Malty:
      case MenuItemType.Dark:
      case MenuItemType.Sour:
      case MenuItemType.Cider:
      case MenuItemType.Seltzer:
        return <Beer size={20} />;
      case MenuItemType.Cocktail:
        return <Martini size={20} />;
      case MenuItemType.Wine:
        return <Wine size={20} />;
      case MenuItemType.Food:
        return <Utensils size={20} />;
      default:
        return <Beer size={20} />;
    }
  };

  return (
    <div
      onClick={() => onEdit?.(item)}
      className={`
                relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer group
                ${
                  isLive
                    ? "bg-slate-800 border-primary/40 shadow-[0_0_15px_rgba(250,204,21,0.1)]"
                    : "bg-slate-900/50 border-white/5 opacity-70 hover:opacity-100 hover:border-white/10"
                }
            `}
    >
      {/* Status Indicator Glint */}
      {isLive && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-2xl -mr-10 -mt-10" />
      )}

      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        {/* Information Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`p-2 rounded-lg ${isLive ? "bg-primary/20 text-primary" : "bg-slate-800 text-slate-500"}`}
            >
              {getTypeIcon(item.type)}
            </div>
            <div>
              <h4
                className={`font-black text-lg truncate pr-2 ${isLive ? "text-white" : "text-slate-400"}`}
              >
                {item.name}
              </h4>
              <div className="flex items-center gap-2 text-xs font-bold font-mono">
                <span className={isLive ? "text-primary" : "text-slate-500"}>
                  {item.stats.price || "$-"}
                </span>
                {item.stats.abv && (
                  <>
                    <span className="text-slate-700">•</span>
                    <span
                      className={`flex items-center gap-1 ${parseFloat(item.stats.abv.toString()) > 8 ? "text-red-400" : "text-slate-500"}`}
                    >
                      {parseFloat(item.stats.abv.toString()) > 8 && (
                        <AlertTriangle size={10} />
                      )}
                      {item.stats.abv}% ABV
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-500 line-clamp-2 pl-12 sm:pl-0 sm:ml-[3.25rem]">
            {item.description || "No description provided."}
          </p>
        </div>

        {/* Action Section */}
        <div className="flex items-center gap-4 pl-12 sm:pl-0">
          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
              className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
              title="Delete Item"
            >
              <Trash2 size={16} />
            </button>
          )}

          {/* Status Label */}
          <div className="text-right hidden sm:block">
            <div
              className={`text-[10px] font-black uppercase tracking-widest ${isLive ? "text-primary" : "text-slate-600"}`}
            >
              {isLive ? "ON TAP" : "86'D"}
            </div>
          </div>

          {/* Massive Toggle Switch */}
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={`
                            relative w-20 h-10 rounded-full p-1 transition-all duration-300 ease-out shadow-inner
                            ${isLive ? "bg-primary shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]" : "bg-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"}
                        `}
          >
            <div
              className={`
                            absolute top-1 left-1 w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all duration-300
                            ${isLive ? "translate-x-10 bg-white" : "translate-x-0 bg-slate-600"}
                        `}
            >
              <Power
                size={14}
                className={`
                                transition-opacity duration-300
                                ${isLive ? "text-primary opacity-100" : "text-slate-400 opacity-50"}
                            `}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Editing Hint Overlay */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

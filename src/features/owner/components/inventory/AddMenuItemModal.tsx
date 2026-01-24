import React, { useState } from "react";
import {
  MenuItem,
  MenuItemType,
  MenuItemStatus,
  MenuSource,
} from "../../../../types/venue";
import { Search, X, Zap, Utensils, Beer } from "lucide-react";

interface AddMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<MenuItem>) => Promise<void>;
}

export const AddMenuItemModal: React.FC<AddMenuItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Local UI state for Category Toggle
  const [category, setCategory] = useState<"drink" | "food">("drink");

  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    type: MenuItemType.Hoppy,
    source: MenuSource.Manual,
    status: MenuItemStatus.Library,
    stats: {},
  });

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!newItem.name) return;
    setIsSubmitting(true);
    try {
      await onSave(newItem);
      onClose();
      // Reset form
      setNewItem({
        type: MenuItemType.Hoppy,
        source: MenuSource.Manual,
        status: MenuItemStatus.Library,
        stats: {},
      });
      setCategory("drink");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black italic text-white uppercase">
              ADD NEW ITEM
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {/* Category Toggle */}
            <div className="flex bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => {
                  setCategory("drink");
                  setNewItem({ ...newItem, type: MenuItemType.Hoppy }); // Reset to default drink
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${category === "drink" ? "bg-primary text-black shadow-lg" : "text-slate-400 hover:text-white"}`}
              >
                <Beer size={16} /> Drink
              </button>
              <button
                onClick={() => {
                  setCategory("food");
                  setNewItem({ ...newItem, type: MenuItemType.Food });
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${category === "food" ? "bg-white text-black shadow-lg" : "text-slate-400 hover:text-white"}`}
              >
                <Utensils size={16} /> Food
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block uppercase tracking-wide">
                Name
              </label>
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-slate-600 font-bold"
                placeholder="e.g. Space Dust IPA"
                value={newItem.name || ""}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {category === "drink" && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                  <label className="text-xs font-bold text-slate-400 mb-1 block uppercase tracking-wide">
                    Type
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-primary focus:outline-none appearance-none font-bold"
                      value={newItem.type}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          type: e.target.value as MenuItemType,
                        })
                      }
                    >
                      {Object.values(MenuItemType)
                        .filter((t) => t !== MenuItemType.Food)
                        .map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>
              )}
              <div className={category === "food" ? "col-span-2" : ""}>
                <label className="text-xs font-bold text-slate-400 mb-1 block uppercase tracking-wide">
                  Price
                </label>
                <input
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-primary focus:outline-none font-mono font-bold"
                  placeholder="$14"
                  value={newItem.stats?.price || ""}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      stats: { ...newItem.stats, price: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block uppercase tracking-wide">
                Description{" "}
                <span className="text-slate-600 font-normal normal-case">
                  (Max 140)
                </span>
              </label>
              <textarea
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-primary focus:outline-none resize-none"
                placeholder="Flavor notes, hop varieties..."
                rows={2}
                maxLength={140}
                value={newItem.description || ""}
                onChange={(e) =>
                  setNewItem({ ...newItem, description: e.target.value })
                }
              />
            </div>

            {category === "drink" && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-500">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block uppercase tracking-wide">
                    ABV %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-primary focus:outline-none font-mono"
                    placeholder="5.2"
                    value={newItem.stats?.abv || ""}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        stats: {
                          ...newItem.stats,
                          abv: parseFloat(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block uppercase tracking-wide">
                    IBU
                  </label>
                  <input
                    type="number"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-primary focus:outline-none font-mono"
                    placeholder="40"
                    value={newItem.stats?.ibu || ""}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        stats: {
                          ...newItem.stats,
                          ibu: parseFloat(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wide text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting || !newItem.name}
              className="flex-1 bg-primary text-black py-3 rounded-xl font-black uppercase tracking-widest hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              {isSubmitting ? "Saving..." : "Add to Library"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from "react";
import {
  Venue,
  MenuItem,
  HappyHourMenuItem,
  MenuItemType,
  MenuItemStatus,
  MenuSource,
} from "../../../types/venue";
import { UserProfile } from "../../../types";
import { VenueOpsService } from "../../../services/VenueOpsService";
import { Plus, Search, Zap, Library, Trash2 } from "lucide-react";
import { useToast } from "../../../components/ui/BrandedToast";
import { InventoryItemCard } from "./inventory/InventoryItemCard";
import { AddMenuItemModal } from "./inventory/AddMenuItemModal";

interface MenuManagementTabProps {
  venue: Venue;
  onUpdate: (venueId: string, updates: Partial<Venue>) => void;
  userId?: string;
  userProfile: UserProfile;
}

export const MenuManagementTab: React.FC<MenuManagementTabProps> = ({
  venue,
  onUpdate,
  userId,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"live" | "library">("live");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Initialize Menu Items
  const [menuItems, setMenuItems] = useState<MenuItem[]>(venue.fullMenu || []);
  const [happyHourMenu, setHappyHourMenu] = useState<HappyHourMenuItem[]>(
    venue.happyHourMenu || [],
  );

  // --- Actions ---

  const handleToggleStatus = async (item: MenuItem) => {
    const newStatus =
      item.status === MenuItemStatus.Live
        ? MenuItemStatus.Library
        : MenuItemStatus.Live;
    const now = Date.now();

    const updatedItems = menuItems.map((i) =>
      i.id === item.id ? { ...i, status: newStatus, last_toggled_at: now } : i,
    );
    setMenuItems(updatedItems);

    try {
      await VenueOpsService.updateVenue(
        venue.id,
        { fullMenu: updatedItems },
        userId,
      );
      onUpdate(venue.id, { fullMenu: updatedItems });
      showToast(
        `Item moved to ${newStatus === MenuItemStatus.Live ? "Live Taps" : "Library"}`,
        "success",
      );
    } catch (error) {
      console.error("Failed to update status", error);
      showToast("Sync failed", "error");
      // Revert on failure
      setMenuItems(menuItems);
    }
  };

  const handleSaveNewItem = async (partialItem: Partial<MenuItem>) => {
    const addedItem: MenuItem = {
      id: crypto.randomUUID(),
      name: partialItem.name!,
      type: partialItem.type || MenuItemType.Hoppy,
      description: partialItem.description || "",
      source: MenuSource.Manual,
      status: MenuItemStatus.Library,
      stats: partialItem.stats || {},
    };

    const updatedItems = [...menuItems, addedItem];
    setMenuItems(updatedItems);

    await VenueOpsService.updateVenue(
      venue.id,
      { fullMenu: updatedItems },
      userId,
    );
    onUpdate(venue.id, { fullMenu: updatedItems });
    showToast("Item added to library", "success");
  };

  const handleDeleteMenuItem = async (item: MenuItem) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${item.name}" from your library?`,
      )
    )
      return;

    const updatedItems = menuItems.filter((i) => i.id !== item.id);
    setMenuItems(updatedItems);

    try {
      await VenueOpsService.updateVenue(
        venue.id,
        { fullMenu: updatedItems },
        userId,
      );
      onUpdate(venue.id, { fullMenu: updatedItems });
      showToast("Item deleted", "success");
    } catch (error) {
      console.error("Failed to delete item", error);
      showToast("Delete failed", "error");
      // Revert handle failure
      setMenuItems(menuItems);
    }
  };

  // --- Happy Hour Logic (Preserved) ---
  const handleAddHappyHourItem = () => {
    const newItem: HappyHourMenuItem = {
      id: crypto.randomUUID(),
      name: "",
      price: "",
      category: "drink",
      description: "",
    };
    const updatedMenu = [...happyHourMenu, newItem];
    setHappyHourMenu(updatedMenu);
    updateHappyHour(updatedMenu);
  };

  const handleUpdateHappyHourItem = (
    idx: number,
    updates: Partial<HappyHourMenuItem>,
  ) => {
    const updatedMenu = [...happyHourMenu];
    updatedMenu[idx] = { ...updatedMenu[idx], ...updates };
    setHappyHourMenu(updatedMenu);
    updateHappyHour(updatedMenu);
  };

  const handleRemoveHappyHourItem = (id: string) => {
    const updatedMenu = happyHourMenu.filter((item) => item.id !== id);
    setHappyHourMenu(updatedMenu);
    updateHappyHour(updatedMenu);
  };

  const updateHappyHour = (menu: HappyHourMenuItem[]) => {
    onUpdate(venue.id, { happyHourMenu: menu });
    VenueOpsService.updateVenue(venue.id, { happyHourMenu: menu }, userId);
  };

  // --- Computed ---

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      if (activeTab === "live")
        return item.status === MenuItemStatus.Live && matchesSearch;
      return matchesSearch;
    });
  }, [menuItems, activeTab, searchTerm]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    Object.values(MenuItemType).forEach((type) => (groups[type] = []));
    filteredItems.forEach((item) => {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
    });
    return groups;
  }, [filteredItems]);

  const typeOrder = [
    MenuItemType.Crisp,
    MenuItemType.Hoppy,
    MenuItemType.Malty,
    MenuItemType.Dark,
    MenuItemType.Sour,
    MenuItemType.Cider,
    MenuItemType.Seltzer,
    MenuItemType.Cocktail,
    MenuItemType.Wine,
    MenuItemType.Food,
    MenuItemType.Other,
  ];

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter">
              THE MENU
            </h2>
            <p className="text-sm text-slate-400">Inventory Control Center</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-400 shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            <Plus size={18} />
            ADD ITEM
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-1 items-center bg-slate-900/80 p-1 rounded-xl w-full sm:w-auto border border-white/5">
            <button
              onClick={() => setActiveTab("live")}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${activeTab === "live" ? "bg-primary text-black shadow-lg" : "text-slate-500 hover:text-white"}`}
            >
              Live On Tap
            </button>
            <button
              onClick={() => setActiveTab("library")}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${activeTab === "library" ? "bg-slate-700 text-white shadow-lg" : "text-slate-500 hover:text-white"}`}
            >
              Full Library
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Quick search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-slate-700 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-8">
        {typeOrder.map((type) => {
          const items = groupedItems[type];
          if (items.length === 0) return null;

          return (
            <div
              key={type}
              className="animate-in fade-in duration-500 slide-in-from-bottom-2"
            >
              <div className="flex items-center gap-2 mb-3 ml-1">
                <h3 className="font-black text-slate-500 uppercase tracking-widest text-xs flex items-center gap-2">
                  {type}{" "}
                  <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-mono">
                    {items.length}
                  </span>
                </h3>
                <div className="h-px bg-slate-800 flex-grow ml-2"></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {items.map((item) => (
                  <InventoryItemCard
                    key={item.id}
                    item={item}
                    onToggle={handleToggleStatus}
                    onDelete={handleDeleteMenuItem}
                    /* onEdit to be implemented */
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="p-16 text-center text-slate-500 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center">
          <Library size={48} className="mb-4 opacity-30" />
          <p className="font-black text-lg text-slate-400 mb-1">
            NO ITEMS FOUND
          </p>
          <p className="text-sm max-w-xs mx-auto">
            No items match your search or filter criteria. Try checking the
            "Full Library".
          </p>
        </div>
      )}

      {/* Happy Hour Section (Still monolithic for now, but styled) */}
      <div className="mt-12 pt-8 border-t border-slate-800/50">
        <div className="bg-gradient-to-br from-indigo-900/20 to-transparent border border-indigo-500/20 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3 className="text-lg font-black text-white uppercase italic flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-400" />
                Happy Hour Menu
              </h3>
              <p className="text-xs text-indigo-300/60 font-medium tracking-wide">
                Visible only during active Happy Hour windows
              </p>
            </div>
            <button
              onClick={handleAddHappyHourItem}
              className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <Plus className="w-3 h-3 inline mr-1" /> Add HH Item
            </button>
          </div>

          <div className="space-y-3">
            {happyHourMenu.map((item, idx) => (
              <div
                key={item.id}
                className="bg-slate-900/50 border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row gap-3 group transition-all hover:border-indigo-500/30"
              >
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-[10px] font-black text-slate-700 italic font-mono">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <input
                    placeholder="HH Item Name"
                    value={item.name}
                    onChange={(e) =>
                      handleUpdateHappyHourItem(idx, { name: e.target.value })
                    }
                    className="flex-grow bg-transparent border-none text-sm text-white placeholder:text-slate-700 font-bold focus:ring-0 p-0 focus:outline-none"
                  />
                  <div className="flex items-center gap-1 border-l border-white/5 pl-4 px-2">
                    <span className="text-xs text-slate-500">$</span>
                    <input
                      placeholder="0.00"
                      value={item.price}
                      onChange={(e) =>
                        handleUpdateHappyHourItem(idx, {
                          price: e.target.value,
                        })
                      }
                      className="w-12 bg-transparent border-none text-sm text-indigo-400 font-mono font-black placeholder:text-slate-800 text-right focus:ring-0 p-0 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex bg-slate-950 rounded-lg p-1 border border-white/5">
                    {(["drink", "food"] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() =>
                          handleUpdateHappyHourItem(idx, { category: cat })
                        }
                        className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${
                          item.category === cat
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                            : "text-slate-600 hover:text-slate-400"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleRemoveHappyHourItem(item.id)}
                    className="p-1.5 text-slate-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AddMenuItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewItem}
      />
    </div>
  );
};

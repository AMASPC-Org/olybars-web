import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Gamepad2,
  Search,
  Hash,
  Star,
  LayoutGrid,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Venue, GameFeature } from "../../../types";
import { barGames } from "../../../data/barGames";

interface GameFeatureManagerProps {
  venue: Venue;
  onChange: (updates: Partial<Venue>) => void;
}

export const GameFeatureManager: React.FC<GameFeatureManagerProps> = ({
  venue,
  onChange,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const currentFeatures = venue.gameFeatures || [];

  const handleAdd = (
    gameName: string,
    defaultType: GameFeature["type"] = "arcade_game",
  ) => {
    let type = defaultType;
    const lowerName = gameName.toLowerCase();

    // Smart Type Detection
    if (lowerName.includes("jukebox")) type = "jukebox";
    else if (lowerName.includes("pull tab")) type = "pull_tabs";
    else if (lowerName.includes("pool")) type = "pool_table";
    else if (lowerName.includes("pinball")) type = "pinball_machine";
    else if (lowerName.includes("dart")) type = "darts";
    else if (lowerName.includes("skeeball")) type = "skeeball";
    else if (lowerName.includes("shuffleboard")) type = "shuffleboard";
    else if (lowerName.includes("foosball")) type = "foosball";
    else if (lowerName.includes("cornhole")) type = "cornhole";
    else if (lowerName.includes("jenga")) type = "giant_jenga";
    else if (lowerName.includes("karaoke")) type = "karaoke";
    else if (lowerName.includes("trivia")) type = "trivia";
    else if (
      lowerName.includes("console") ||
      lowerName.includes("nintendo") ||
      lowerName.includes("xbox") ||
      lowerName.includes("playstation")
    )
      type = "console_gaming";

    const id = `${type}_${Date.now()}`;
    const newFeature: GameFeature = {
      id,
      name: gameName,
      type: type,
      count: 1,
      status: "active",
      isLeaguePartner: true,
    };

    const updated = [...currentFeatures, newFeature];
    onChange({
      gameFeatures: updated,
    });
    setIsAdding(false);
    setSearchQuery("");
  };

  const handleRemove = (id: string) => {
    const updated = currentFeatures.filter((f) => f.id !== id);
    onChange({
      gameFeatures: updated,
    });
  };

  const handleUpdate = (id: string, updates: Partial<GameFeature>) => {
    const updated = currentFeatures.map((f) =>
      f.id === id ? { ...f, ...updates } : f,
    );
    onChange({ gameFeatures: updated });
  };

  // Flatten barGames to get available options
  const availableGames = barGames
    .flatMap((cat) => cat.games)
    .filter((g) => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-sm font-black text-white uppercase flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-primary" />
            Specific Games & Assets
          </h4>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Configure counts and names for Vibe Check
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-black text-[10px] font-black uppercase rounded-lg hover:scale-105 transition-transform"
          >
            <Plus size={14} strokeWidth={3} /> Add Game
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-slate-900 border border-primary/30 rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="SEARCH LEAGUE GLOSSARY..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-xs font-bold text-white uppercase focus:border-primary outline-none transition-all"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {availableGames.map((game) => (
              <button
                key={game.name}
                onClick={() =>
                  handleAdd(game.name, "arcade_game" as GameFeature["type"])
                } // Default type, user can edit
                className="text-left p-2.5 bg-white/5 hover:bg-primary/20 border border-white/5 hover:border-primary/50 rounded-lg group transition-all"
              >
                <p className="text-[10px] font-black text-slate-300 group-hover:text-white uppercase transition-colors">
                  {game.name}
                </p>
              </button>
            ))}
            {availableGames.length === 0 && (
              <p className="col-span-2 text-center text-slate-500 text-[10px] font-bold uppercase py-4 italic">
                No matching games found
              </p>
            )}
          </div>

          <button
            onClick={() => setIsAdding(false)}
            className="w-full py-2 text-[10px] font-black text-slate-500 uppercase hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="space-y-2">
        {currentFeatures.map((feature) => (
          <div
            key={feature.id}
            className="bg-slate-900/50 border border-white/5 rounded-xl p-4 group transition-all hover:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-black/40 rounded-lg flex items-center justify-center border border-white/5">
                  <Hash className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <h5
                    className={`text-xs font-black uppercase tracking-wider ${feature.status === "out_of_order" ? "text-slate-500 line-through" : "text-white"}`}
                  >
                    {feature.name}
                  </h5>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      {feature.count} Unit{feature.count !== 1 ? "s" : ""}
                    </p>
                    {feature.status === "out_of_order" && (
                      <span className="text-[8px] font-black text-red-500 bg-red-900/20 px-1.5 py-0.5 rounded uppercase">
                        Out of Order
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setEditingId(editingId === feature.id ? null : feature.id)
                  }
                  className="p-2 text-slate-500 hover:text-primary transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleRemove(feature.id)}
                  className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {editingId === feature.id && (
              <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={feature.name}
                    onChange={(e) =>
                      handleUpdate(feature.id, { name: e.target.value })
                    }
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-bold text-white uppercase outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={feature.count}
                    onChange={(e) =>
                      handleUpdate(feature.id, {
                        count: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-bold text-white uppercase outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Status
                  </label>
                  <select
                    value={feature.status}
                    onChange={(e) =>
                      handleUpdate(feature.id, {
                        status: e.target.value as any,
                      })
                    }
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-bold text-white uppercase outline-none focus:border-primary"
                  >
                    <option value="active">Active / Working</option>
                    <option value="out_of_order">Out of Order</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Type
                  </label>
                  <select
                    value={feature.type}
                    onChange={(e) =>
                      handleUpdate(feature.id, {
                        type: e.target.value as GameFeature["type"],
                      })
                    }
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-bold text-white uppercase outline-none focus:border-primary"
                  >
                    <option value="arcade_game">Arcade Game</option>
                    <option value="pinball_machine">Pinball</option>
                    <option value="pool_table">Pool Table</option>
                    <option value="darts">Darts</option>
                    <option value="skeeball">Skee-Ball</option>
                    <option value="shuffleboard">Shuffleboard</option>
                    <option value="foosball">Foosball</option>
                    <option value="cornhole">Cornhole</option>
                    <option value="giant_jenga">Giant Jenga</option>
                    <option value="karaoke">Karaoke</option>
                    <option value="trivia">Trivia</option>
                    <option value="console_gaming">Console Gaming</option>
                    <option value="jukebox">Jukebox</option>
                    <option value="pull_tabs">Pull Tabs</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Description / Artie Lore
                  </label>
                  <textarea
                    value={feature.description || ""}
                    onChange={(e) =>
                      handleUpdate(feature.id, { description: e.target.value })
                    }
                    placeholder="E.G. LOCATED IN THE BACK ROOM NEAR THE STAGE..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-bold text-white uppercase outline-none focus:border-primary h-20 resize-none"
                  />
                </div>
                <div className="col-span-2 flex items-center justify-between p-2 bg-black/30 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2">
                    <Star
                      className={`w-4 h-4 ${feature.isLeaguePartner ? "text-primary" : "text-slate-600"}`}
                    />
                    <span className="text-[10px] font-black text-slate-400 uppercase">
                      League Partner Machine
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleUpdate(feature.id, {
                        isLeaguePartner: !feature.isLeaguePartner,
                      })
                    }
                    className={`w-8 h-4 rounded-full p-0.5 transition-all ${feature.isLeaguePartner ? "bg-primary" : "bg-slate-700"}`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white transition-all ${feature.isLeaguePartner ? "translate-x-4" : "translate-x-0"}`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {currentFeatures.length === 0 && !isAdding && (
          <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl bg-slate-900/30">
            <Gamepad2 className="w-12 h-12 text-slate-800 mx-auto mb-3" />
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">
              No specific games configured
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-4 text-xs font-black text-primary hover:text-white uppercase tracking-widest underline underline-offset-4"
            >
              Add Your First Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

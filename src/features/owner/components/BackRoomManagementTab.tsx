import React, { useState } from "react";
import {
  Users,
  Plus,
  Trash2,
  ExternalLink,
  Info,
  Maximize2,
  X,
} from "lucide-react";
import { Venue } from "../../../types";

interface BackRoomManagementTabProps {
  venue: Venue;
  onUpdate: (updates: Partial<Venue>) => Promise<void>;
}

interface NewSpace {
  name: string;
  capacity: string;
  description: string;
  bookingLink: string;
  features: { name: string; count: number }[];
  photos?: string[];
}

export const BackRoomManagementTab: React.FC<BackRoomManagementTabProps> = ({
  venue,
  onUpdate,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSpace, setNewSpace] = useState<NewSpace>({
    name: "",
    capacity: "",
    description: "",
    bookingLink: "",
    features: [],
  });
  const [tempFeature, setTempFeature] = useState({ name: "", count: 1 });
  const [tempPhoto, setTempPhoto] = useState("");

  const handleAddFeature = () => {
    if (!tempFeature.name) return;
    setNewSpace((prev) => ({
      ...prev,
      features: [...prev.features, { ...tempFeature }],
    }));
    setTempFeature({ name: "", count: 1 });
  };

  const handleAddPhoto = () => {
    if (!tempPhoto) return;
    setNewSpace((prev) => ({
      ...prev,
      photos: [...(prev.photos || []), tempPhoto],
    }));
    setTempPhoto("");
  };

  const removeFeature = (idx: number) => {
    setNewSpace((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx),
    }));
  };

  const removePhoto = (idx: number) => {
    setNewSpace((prev) => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== idx),
    }));
  };

  const spaces = venue.privateSpaces || [];

  const handleAddSpace = async () => {
    if (!newSpace.name || !newSpace.capacity) return;

    setSaving(true);
    try {
      const updatedSpaces = [
        ...spaces,
        {
          ...newSpace,
          capacity: parseInt(newSpace.capacity) || 0,
        },
      ];

      await onUpdate({
        privateSpaces: updatedSpaces,
        hasPrivateRoom: updatedSpaces.length > 0,
      });

      setNewSpace({
        name: "",
        capacity: "",
        description: "",
        bookingLink: "",
        features: [],
        photos: [],
      });
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding space:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSpace = async (index: number) => {
    if (!window.confirm("Are you sure you want to remove this space?")) return;

    setSaving(true);
    try {
      const updatedSpaces = spaces.filter((_, i) => i !== index);
      await onUpdate({
        privateSpaces: updatedSpaces,
        hasPrivateRoom: updatedSpaces.length > 0,
      });
    } catch (error) {
      console.error("Error deleting space:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Hook */}
      <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Users size={80} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white italic tracking-tight font-league">
              THE BACK ROOM
            </h2>
            <p className="text-slate-400 text-sm max-w-md">
              Manage your private rooms, VIP booths, and event spaces. These
              appear on your profile and help Artie recommend you for parties.
            </p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              isAdding
                ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
                : "bg-primary text-black hover:scale-105 active:scale-95"
            }`}
          >
            {isAdding ? <X size={16} /> : <Plus size={16} />}
            {isAdding ? "Cancel" : "Add New Space"}
          </button>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-surface border border-white/10 rounded-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Space Name
              </label>
              <input
                type="text"
                placeholder="e.g. The Library Loft"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors"
                value={newSpace.name}
                onChange={(e) =>
                  setNewSpace({ ...newSpace, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Capacity (People)
              </label>
              <input
                type="number"
                placeholder="e.g. 20"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors"
                value={newSpace.capacity}
                onChange={(e) =>
                  setNewSpace({ ...newSpace, capacity: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Description
              </label>
              <textarea
                placeholder="What makes this space special? AV setup, private bar, lounge seating..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors min-h-[100px]"
                value={newSpace.description}
                onChange={(e) =>
                  setNewSpace({ ...newSpace, description: e.target.value })
                }
              />
            </div>

            {/* Photos Section */}
            <div className="space-y-2 md:col-span-2 bg-black/20 p-4 rounded-xl border border-white/5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Space Photos (URLs)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  value={tempPhoto}
                  onChange={(e) => setTempPhoto(e.target.value)}
                />
                <button
                  onClick={handleAddPhoto}
                  className="bg-slate-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-600 transition-colors"
                >
                  Add Photo
                </button>
              </div>
              {newSpace.photos && newSpace.photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {newSpace.photos.map((url, i) => (
                    <div key={i} className="relative group aspect-square">
                      <img
                        src={url}
                        alt="Space preview"
                        className="w-full h-full object-cover rounded-lg border border-white/10"
                      />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 bg-black/80 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Features Section */}
            <div className="space-y-2 md:col-span-2 bg-black/20 p-4 rounded-xl border border-white/5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Included Features
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Feature (e.g. TV, Projector)"
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  value={tempFeature.name}
                  onChange={(e) =>
                    setTempFeature({ ...tempFeature, name: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Qty"
                  min="1"
                  className="w-16 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  value={tempFeature.count}
                  onChange={(e) =>
                    setTempFeature({
                      ...tempFeature,
                      count: parseInt(e.target.value) || 1,
                    })
                  }
                />
                <button
                  onClick={handleAddFeature}
                  className="bg-slate-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-600 transition-colors"
                >
                  Add
                </button>
              </div>

              {newSpace.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newSpace.features.map((f, i) => (
                    <div
                      key={i}
                      className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-2"
                    >
                      <span>
                        {f.count > 1 ? `${f.count}x ` : ""}
                        {f.name}
                      </span>
                      <button
                        onClick={() => removeFeature(i)}
                        className="hover:text-red-400"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Booking URL (Optional)
              </label>
              <div className="relative">
                <ExternalLink
                  size={14}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                />
                <input
                  type="url"
                  placeholder="https://tock.com/your-venue/..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-primary outline-none transition-colors"
                  value={newSpace.bookingLink}
                  onChange={(e) =>
                    setNewSpace({ ...newSpace, bookingLink: e.target.value })
                  }
                />
              </div>
              <p className="text-[9px] text-slate-500 italic mt-1">
                If left blank, users will be told to contact the venue directly.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              disabled={saving}
              onClick={handleAddSpace}
              className="bg-primary text-black px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              Save Space
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spaces.length === 0 && !isAdding && (
          <div className="md:col-span-3 py-12 flex flex-col items-center justify-center text-center space-y-4 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-500">
              <Users size={32} />
            </div>
            <div>
              <h3 className="text-white font-bold">No Private Spaces Yet</h3>
              <p className="text-slate-500 text-sm max-w-xs">
                Add your first space to start accepting larger groups and
                events.
              </p>
            </div>
          </div>
        )}

        {spaces.map((space, idx) => (
          <div
            key={idx}
            className="group bg-surface border border-white/10 hover:border-primary/50 rounded-2xl p-5 transition-all relative"
          >
            <button
              onClick={() => handleDeleteSpace(idx)}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <Trash2 size={16} />
            </button>

            {/* Photo Preview if available */}
            {space.photos && space.photos.length > 0 && (
              <div className="w-full h-32 mb-4 rounded-xl overflow-hidden relative">
                <img
                  src={space.photos[0]}
                  alt={space.name}
                  className="w-full h-full object-cover"
                />
                {space.photos.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] font-bold text-white backdrop-blur-sm">
                    +{space.photos.length - 1} more
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                <Maximize2 size={20} />
              </div>
              <div>
                <h4 className="font-black text-white italic tracking-tight line-clamp-1">
                  {space.name}
                </h4>
                <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-widest">
                  <Users size={10} />
                  <span>Cap: {space.capacity}</span>
                </div>
              </div>
            </div>

            {/* Features Display */}
            {space.features && space.features.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-1.5">
                {space.features.slice(0, 4).map((f, i) => (
                  <span
                    key={i}
                    className="text-[9px] font-bold bg-white/5 text-slate-400 px-1.5 py-0.5 rounded border border-white/5"
                  >
                    {f.count > 1 ? `${f.count}x ` : ""}
                    {f.name}
                  </span>
                ))}
                {space.features.length > 4 && (
                  <span className="text-[9px] font-bold text-slate-500 px-1.5 py-0.5">
                    +{space.features.length - 4}
                  </span>
                )}
              </div>
            )}

            <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed h-[3.75rem]">
              {space.description || "No description provided."}
            </p>

            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${space.bookingLink ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-slate-600"}`}
                />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {space.bookingLink ? "External Booking" : "Contact Only"}
                </span>
              </div>
              {space.bookingLink && (
                <a
                  href={space.bookingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-primary transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tip Box */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-4">
        <Info className="shrink-0 text-primary" size={20} />
        <div className="space-y-1">
          <h4 className="text-xs font-black text-primary uppercase tracking-widest italic">
            Artie Tip
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Adding specific capacities and descriptions helps Artie provide
            better answers when tourists or locals ask for "a place that can
            seat 15 for a birthday." High-quality descriptions drive
            conversions!
          </p>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { Camera, Trash2, Check, X } from "lucide-react";
import { Venue } from "../../../types";
import { useToast } from "../../../components/ui/BrandedToast";

interface GalleryManagerProps {
  venue: Venue;
  updateVenue: (venueId: string, updates: Partial<Venue>) => Promise<void>;
  userUid: string;
}

export const GalleryManager: React.FC<GalleryManagerProps> = ({
  venue,
  updateVenue,
  userUid,
}) => {
  const { showToast } = useToast();

  const handlePhotoTierApprove = async (photoId: string) => {
    if (!venue.photos) return;
    const updatedPhotos = venue.photos.map((p) =>
      p.id === photoId
        ? ({
            ...p,
            marketingStatus: "approved",
            venueAdminApprovedBy: userUid,
            isApprovedForFeed: true,
          } as any)
        : p,
    );
    try {
      await updateVenue(venue.id, { photos: updatedPhotos });
      showToast("PHOTO APPROVED FOR GALLERY", "success");
    } catch (e) {
      showToast("FAILED TO APPROVE PHOTO", "error");
    }
  };

  const handlePhotoTierReject = async (photoId: string) => {
    if (!venue.photos) return;
    const updatedPhotos = venue.photos.map((p) =>
      p.id === photoId ? ({ ...p, marketingStatus: "rejected" } as any) : p,
    );
    try {
      await updateVenue(venue.id, { photos: updatedPhotos });
      showToast("PHOTO REJECTED", "success");
    } catch (e) {
      showToast("FAILED TO REJECT PHOTO", "error");
    }
  };

  const pendingPhotos =
    venue.photos?.filter((p) => p.marketingStatus === "pending-venue") || [];
  const approvedPhotos =
    venue.photos?.filter((p) => p.marketingStatus === "approved") || [];

  return (
    <section className="space-y-8">
      {/* Pending Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-2xl font-black text-white uppercase font-league leading-none tracking-tight">
              Pending Gallery
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">
              Review content before it hits your feed
            </p>
          </div>
          <div className="bg-primary/10 px-3 py-1 rounded border border-primary/20">
            <span className="text-primary font-black font-league text-sm">
              {pendingPhotos.length} PENDING
            </span>
          </div>
        </div>

        {pendingPhotos.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl bg-white/5">
            <Camera className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest font-league">
              No pending photos
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingPhotos.map((photo) => (
              <div
                key={photo.id}
                className="bg-surface border border-white/10 rounded-xl overflow-hidden shadow-2xl group relative"
              >
                <div className="aspect-square bg-black relative">
                  <img
                    src={photo.url}
                    alt="Pending"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                    <button
                      onClick={() => handlePhotoTierApprove(photo.id!)}
                      className="flex-1 bg-green-500 text-black font-black py-2 rounded uppercase text-[10px] tracking-widest flex items-center justify-center gap-1 hover:bg-green-400 transition-colors shadow-lg shadow-green-500/20"
                    >
                      <Check className="w-3 h-3" strokeWidth={4} /> Approve
                    </button>
                    <button
                      onClick={() => handlePhotoTierReject(photo.id!)}
                      className="flex-1 bg-red-500/10 text-red-500 border border-red-500/50 font-black py-2 rounded uppercase text-[10px] tracking-widest flex items-center justify-center gap-1 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" strokeWidth={4} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Section */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-2xl font-black text-white uppercase font-league leading-none tracking-tight">
              Live Gallery
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">
              Visible to the public
            </p>
          </div>
          <div className="bg-white/5 px-3 py-1 rounded border border-white/10">
            <span className="text-slate-400 font-black font-league text-sm">
              {approvedPhotos.length} LIVE
            </span>
          </div>
        </div>

        {approvedPhotos.length === 0 ? (
          <div className="py-8 text-center bg-black/20 rounded-xl">
            <p className="text-slate-700 font-bold uppercase text-[9px] tracking-widest font-league italic">
              Gallery is empty
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {approvedPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square group rounded-lg overflow-hidden bg-black border border-white/10"
              >
                <img
                  src={photo.url}
                  alt="Live"
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500"
                />
                <div className="absolute top-2 right-2">
                  <div className="bg-green-500/90 w-2 h-2 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse" />
                </div>
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                  <button
                    onClick={() => handlePhotoTierReject(photo.id!)}
                    className="bg-red-500 text-white p-2 rounded-full hover:scale-110 transition-transform shadow-xl"
                    title="Remove from Gallery"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

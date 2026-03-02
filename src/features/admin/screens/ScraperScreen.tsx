import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchVenueById, updateVenueDetails } from "../../../services/venueService";
import { useUser } from "../../../contexts/UserContext";
import { ScraperManagementTab } from "../../owner/components/ScraperManagementTab";
import { ChevronLeft, Loader2, AlertTriangle } from "lucide-react";
import { isSystemAdmin } from "../../../types/auth_schema";

export const ScraperScreen: React.FC = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useUser();

  const { data: venue, isLoading, error } = useQuery({
    queryKey: ["venue", venueId],
    queryFn: () => fetchVenueById(venueId!),
    enabled: !!venueId,
  });

  const handleUpdate = async (id: string, updates: any) => {
    await updateVenueDetails(id, updates);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Venue Not Found</h2>
        <p className="text-slate-400 mb-6">
          Could not load scraper configuration for ID: {venueId}
        </p>
        <button
          onClick={() => navigate("/admin")}
          className="px-6 py-2 bg-slate-800 rounded-lg font-bold hover:bg-slate-700 transition-colors"
        >
          Return to Admin
        </button>
      </div>
    );
  }

  // Basic authorization check (UI only - backend rules enforce real security)
  if (!isSystemAdmin(userProfile)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-slate-400 mb-6">
          You do not have permission to view this page.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-slate-800 rounded-lg font-bold hover:bg-slate-700 transition-colors"
        >
          Return Home
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-slate-400" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black font-league uppercase tracking-tight truncate max-w-[200px] sm:max-w-none">
                  {venue.name}
                </h1>
                <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-white/5">{venue.id}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-widest">
                Scraper Configuration
              </p>
            </div>
          </div>
        </div>

        <ScraperManagementTab
          venue={venue}
          onUpdate={handleUpdate}
          userProfile={userProfile}
        />
      </div>
    </div>
  );
};
